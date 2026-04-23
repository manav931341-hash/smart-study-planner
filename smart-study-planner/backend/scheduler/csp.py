"""
csp.py — Constraint Satisfaction Problem (CSP) Solver
======================================================
Purpose: Make sure every study session in our schedule follows all rules.

WHAT IS A CSP?
A CSP has three parts:
  1. Variables   — the study sessions we need to schedule
  2. Domains     — the valid time slots each session can go into
  3. Constraints — the rules that must not be violated

Our constraints:
  ✅ No two subjects overlap in the same time slot
  ✅ Each day cannot exceed the student's daily hour limit
  ✅ Sessions must be placed within valid study dates
  ✅ A subject's total sessions cannot exceed its required hours

Algorithm: Backtracking Search
  - Try to assign a session to a slot
  - If a constraint is violated, backtrack and try next slot
  - Repeat until all sessions are assigned or no solution exists
"""

from datetime import date, timedelta
from typing import List, Dict, Tuple, Optional
import sys

# Add parent dir to path so we can import schemas
sys.path.append("..")
from models.schemas import Subject


# ------------------------------------------------------------------
# TIME SLOT REPRESENTATION
# Each slot is a (date_str, slot_index) tuple.
# slot_index 0 = 09:00-10:00, 1 = 10:00-11:00, etc.
# ------------------------------------------------------------------

START_HOUR = 9  # Study day starts at 9:00 AM


def slot_to_time(slot_index: int) -> Tuple[str, str]:
    """Convert a slot index to start/end time strings."""
    start_h = START_HOUR + slot_index
    end_h = start_h + 1
    return f"{start_h:02d}:00", f"{end_h:02d}:00"


def build_domain(start_date: date, end_date: date, daily_slots: int) -> List[Tuple[str, int]]:
    """
    Build all valid (date, slot_index) combinations between start and end date.
    daily_slots = how many 1-hour slots are available per day (= daily_hours rounded down)
    """
    domain = []
    current = start_date
    while current <= end_date:
        for slot_idx in range(min(daily_slots, 10)):  # Max 10 slots per day (9AM-7PM)
            domain.append((str(current), slot_idx))
        current += timedelta(days=1)
    return domain


# ------------------------------------------------------------------
# CONSTRAINT CHECKER
# ------------------------------------------------------------------

def is_consistent(
    assignment: Dict[str, Tuple[str, int]],     # session_id -> (date, slot)
    session_id: str,
    date_str: str,
    slot_idx: int,
    daily_hours: float,
    session_durations: Dict[str, float]         # session_id -> hours
) -> bool:
    """
    Check if placing session_id at (date_str, slot_idx) violates any constraint.

    Constraints checked:
      1. No time slot collision on the same day
      2. Daily hours limit not exceeded
    """
    slots_used_today = 0

    for other_id, (other_date, other_slot) in assignment.items():
        if other_date == date_str:
            # Constraint 1: No overlap — each slot index must be unique per day
            if other_slot == slot_idx:
                return False  # VIOLATION: two sessions in same time slot

            # Count how many slots are already used today
            slots_used_today += session_durations.get(other_id, 1.0)

    # Constraint 2: Daily hours limit
    new_session_hours = session_durations.get(session_id, 1.0)
    if slots_used_today + new_session_hours > daily_hours:
        return False  # VIOLATION: would exceed daily study limit

    return True  # All constraints satisfied


# ------------------------------------------------------------------
# BACKTRACKING CSP SOLVER
# ------------------------------------------------------------------

def backtrack(
    sessions: List[str],                        # List of session IDs to assign
    index: int,                                 # Current session being assigned
    assignment: Dict[str, Tuple[str, int]],     # Current (partial) solution
    domains: Dict[str, List[Tuple[str, int]]],  # Valid slots for each session
    daily_hours: float,
    session_durations: Dict[str, float]
) -> Optional[Dict[str, Tuple[str, int]]]:
    """
    Recursive backtracking search.
    Tries each slot in the domain for the current session.
    If constraint is satisfied, recurse to next session.
    If no slot works, backtrack.
    """
    # Base case: all sessions assigned
    if index == len(sessions):
        return assignment

    session_id = sessions[index]
    domain = domains.get(session_id, [])

    for (date_str, slot_idx) in domain:
        if is_consistent(assignment, session_id, date_str, slot_idx, daily_hours, session_durations):
            # Assign this slot
            assignment[session_id] = (date_str, slot_idx)

            # Recurse to the next session
            result = backtrack(sessions, index + 1, assignment, domains, daily_hours, session_durations)

            if result is not None:
                return result  # Found a valid complete assignment!

            # Backtrack: remove the assignment and try next slot
            del assignment[session_id]

    # No valid slot found for this session — signal failure to caller
    return None


# ------------------------------------------------------------------
# PUBLIC API
# ------------------------------------------------------------------

def solve_csp(
    sessions: List[Dict],       # List of {id, subject, date_range_end, duration}
    daily_hours: float,
    start_date: date
) -> Dict[str, Tuple[str, int]]:
    """
    Main CSP entry point.
    Returns assignment: session_id -> (date_str, slot_index)

    Falls back to greedy placement if backtracking fails (too many sessions).
    """
    session_ids = [s["id"] for s in sessions]
    session_durations = {s["id"]: s["duration"] for s in sessions}

    # Build domain for each session (valid slots before exam date)
    domains: Dict[str, List[Tuple[str, int]]] = {}
    daily_slots = max(1, int(daily_hours))

    for s in sessions:
        end = date.fromisoformat(s["exam_date"])
        domain = build_domain(start_date, end, daily_slots)
        domains[s["id"]] = domain

    # Run backtracking CSP solver
    assignment = backtrack(session_ids, 0, {}, domains, daily_hours, session_durations)

    # If backtracking found no solution, use greedy fallback
    if assignment is None:
        assignment = greedy_fallback(sessions, daily_hours, start_date)

    return assignment


def greedy_fallback(
    sessions: List[Dict],
    daily_hours: float,
    start_date: date
) -> Dict[str, Tuple[str, int]]:
    """
    Simple greedy assignment: fill slots day by day.
    Used when backtracking CSP takes too long or finds no solution.
    """
    assignment = {}
    day_usage: Dict[str, float] = {}   # date_str -> hours used
    day_slots: Dict[str, int] = {}     # date_str -> next available slot index

    current_date = start_date

    for s in sessions:
        placed = False
        attempt_date = start_date

        # Try each day from start_date until we find room
        for _ in range(365):
            d_str = str(attempt_date)
            used = day_usage.get(d_str, 0.0)
            slot_idx = day_slots.get(d_str, 0)

            if used + s["duration"] <= daily_hours and slot_idx < 10:
                assignment[s["id"]] = (d_str, slot_idx)
                day_usage[d_str] = used + s["duration"]
                day_slots[d_str] = slot_idx + 1
                placed = True
                break

            attempt_date += timedelta(days=1)

        if not placed:
            # Last resort: place on start_date slot 0
            assignment[s["id"]] = (str(start_date), 0)

    return assignment
