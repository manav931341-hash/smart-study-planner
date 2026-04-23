"""
astar.py — A* Search Algorithm for Study Session Prioritization
===============================================================
Purpose: Rank and order study sessions so the most URGENT and DIFFICULT
         topics are scheduled first. This is the "smart" part of our planner.

WHAT IS A*?
A* is a best-first search algorithm. It uses a priority queue and scores
each option using:
    f(n) = g(n) + h(n)

In our context:
    g(n) = cost so far (how much time has already been planned for this subject)
    h(n) = heuristic (how urgent is this subject still?)

The heuristic combines:
    1. Deadline proximity — exams soon = higher priority
    2. Difficulty         — harder subjects = higher priority
    3. Remaining hours    — more left to cover = higher priority

HOW IT'S USED HERE:
We run A* to produce a priority score for every session.
The CSP solver then assigns time slots; A* tells it WHICH sessions
to schedule before others on each day.
"""

import heapq
from datetime import date, timedelta
from typing import List, Dict, Tuple
import math


# ------------------------------------------------------------------
# HEURISTIC FUNCTION
# ------------------------------------------------------------------

def compute_heuristic(
    subject_name: str,
    difficulty: int,        # 1–5
    exam_date: str,         # YYYY-MM-DD
    remaining_hours: float, # How many hours of study are left
    current_date: date
) -> float:
    """
    Compute h(n): estimated urgency of studying this subject NOW.

    Formula breakdown:
        urgency_factor  = 10 / days_until_exam   (closer exam → higher urgency)
        difficulty_weight = difficulty / 5         (normalized to 0–1)
        workload_factor = log(remaining_hours + 1) (more to do → higher score)

    Final score = urgency_factor * 0.5 + difficulty_weight * 0.3 + workload_factor * 0.2
    All components are normalized then weighted.
    """
    exam = date.fromisoformat(exam_date)
    days_left = max(1, (exam - current_date).days)  # Avoid division by zero

    # Urgency: inverse of days left, capped to prevent extreme values
    urgency = min(10.0, 10.0 / days_left)

    # Difficulty: normalized to 0.0–1.0
    diff_weight = difficulty / 5.0

    # Workload: logarithmic so 100 hours isn't 100x more urgent than 1 hour
    workload = math.log(remaining_hours + 1)

    # Weighted combination
    score = (urgency * 0.5) + (diff_weight * 3.0 * 0.3) + (workload * 0.2)

    return round(score, 4)


# ------------------------------------------------------------------
# A* STATE NODE
# ------------------------------------------------------------------

class ScheduleNode:
    """
    Represents a state in the A* search.
    Each node = deciding how to spend the next study hour.
    """
    def __init__(
        self,
        subject_name: str,
        session_id: str,
        g_cost: float,      # Hours already planned for this subject
        h_cost: float,      # Heuristic urgency score
        metadata: dict      # Extra info (difficulty, exam_date, etc.)
    ):
        self.subject_name = subject_name
        self.session_id = session_id
        self.g_cost = g_cost
        self.h_cost = h_cost
        self.f_cost = g_cost + h_cost    # Lower f = explored first in min-heap
        self.metadata = metadata

    # Required for Python's heapq (min-heap comparison)
    def __lt__(self, other: "ScheduleNode") -> bool:
        # We want HIGHEST priority first → negate f_cost for max-heap behavior
        return self.f_cost > other.f_cost

    def __repr__(self):
        return f"Node({self.subject_name}, f={self.f_cost:.2f})"


# ------------------------------------------------------------------
# A* SEARCH
# ------------------------------------------------------------------

def astar_prioritize(
    subjects: List[Dict],   # Each dict: {name, difficulty, exam_date, remaining_hours, sessions_needed}
    current_date: date
) -> List[Dict]:
    """
    Run A* to compute a priority-ordered list of all study sessions.

    Returns a list of session dictionaries sorted by priority (most urgent first).
    Each session includes its computed priority_score for display.

    Steps:
      1. Create initial nodes for all subjects (g=0 since nothing planned yet)
      2. Push all into a max-priority heap
      3. Pop the most urgent subject → create session(s) for it
      4. After scheduling some hours, update g_cost and re-insert
      5. Continue until all sessions are created
    """
    # Build the priority queue (heap)
    heap: List[ScheduleNode] = []
    session_list: List[Dict] = []
    session_counter = [0]  # Using list so inner func can modify it

    def make_session_id():
        session_counter[0] += 1
        return f"sess_{session_counter[0]:04d}"

    # Initialize: one node per subject
    for subj in subjects:
        h = compute_heuristic(
            subject_name=subj["name"],
            difficulty=subj["difficulty"],
            exam_date=subj["exam_date"],
            remaining_hours=subj["remaining_hours"],
            current_date=current_date
        )
        node = ScheduleNode(
            subject_name=subj["name"],
            session_id=make_session_id(),
            g_cost=0.0,
            h_cost=h,
            metadata=subj
        )
        heapq.heappush(heap, node)

    # Track how many hours we've "scheduled" per subject
    scheduled_hours: Dict[str, float] = {s["name"]: 0.0 for s in subjects}

    # Each iteration = assign one study session (1-2 hours)
    max_iterations = 500  # Safety cap to prevent infinite loops
    iteration = 0

    while heap and iteration < max_iterations:
        iteration += 1
        node = heapq.heappop(heap)  # Get most urgent subject

        subj_name = node.subject_name
        subj_data = node.metadata
        remaining = subj_data["remaining_hours"] - scheduled_hours[subj_name]

        if remaining <= 0:
            continue  # This subject is fully planned

        # Plan one session: 1 or 2 hours depending on remaining load
        session_hours = min(2.0, remaining) if remaining > 1.0 else remaining

        # Create a session record
        session_list.append({
            "id": make_session_id(),
            "subject": subj_name,
            "duration": session_hours,
            "priority_score": round(node.f_cost, 4),
            "difficulty": subj_data["difficulty"],
            "exam_date": subj_data["exam_date"],
            "note": _generate_note(subj_data["difficulty"], remaining, subj_data["exam_date"], current_date)
        })

        # Update scheduled hours
        scheduled_hours[subj_name] += session_hours
        still_remaining = subj_data["remaining_hours"] - scheduled_hours[subj_name]

        # Re-insert if subject still needs more sessions
        if still_remaining > 0:
            new_g = node.g_cost + session_hours
            new_h = compute_heuristic(
                subject_name=subj_name,
                difficulty=subj_data["difficulty"],
                exam_date=subj_data["exam_date"],
                remaining_hours=still_remaining,
                current_date=current_date
            )
            updated_node = ScheduleNode(
                subject_name=subj_name,
                session_id=make_session_id(),
                g_cost=new_g,
                h_cost=new_h,
                metadata={**subj_data, "remaining_hours": still_remaining}
            )
            heapq.heappush(heap, updated_node)

    return session_list


# ------------------------------------------------------------------
# HELPER: Generate study tip notes
# ------------------------------------------------------------------

def _generate_note(difficulty: int, remaining_hours: float, exam_date: str, today: date) -> str:
    """Generate a helpful tip based on subject context."""
    days_left = (date.fromisoformat(exam_date) - today).days

    if days_left <= 2:
        return "⚠️ Exam very soon! Focus on key formulas and past papers."
    elif days_left <= 5:
        return "📌 Exam approaching — prioritize weak areas."
    elif difficulty >= 4:
        return "🧠 Hard topic — use active recall and spaced repetition."
    elif remaining_hours > 8:
        return "📚 Lots to cover — break into small chunks daily."
    else:
        return "✅ Stay consistent and review notes after each session."
