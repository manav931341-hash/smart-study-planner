"""
optimizer.py — Schedule Optimizer
==================================
Purpose: Combine the A* priority scores and CSP time-slot assignments
         into a final, human-readable study timetable.

Also computes:
  - Stress Score: measures how concentrated difficult sessions are
                  (lower = better, means difficulty is spread out)
  - Efficiency Score: measures how well urgent subjects are covered early
                  (higher = better)

This module is the "glue" between csp.py and astar.py.
"""

from datetime import date, datetime, timedelta
from typing import List, Dict, Tuple
import sys

sys.path.append("..")
from models.schemas import Subject, StudySession, ScheduleResponse
from scheduler.astar import astar_prioritize
from scheduler.csp import solve_csp, slot_to_time


# ------------------------------------------------------------------
# DAY LABEL FORMATTER
# ------------------------------------------------------------------

def format_day_label(date_str: str) -> str:
    """Convert '2024-01-15' to 'Monday, Jan 15'"""
    d = date.fromisoformat(date_str)
    return d.strftime("%A, %b %d")


# ------------------------------------------------------------------
# STRESS SCORE CALCULATOR
# ------------------------------------------------------------------

def compute_stress_score(sessions: List[StudySession]) -> float:
    """
    Stress score = average difficulty variance per day.
    
    Low variance = difficulty is spread evenly across days = LOW STRESS ✅
    High variance = some days have all hard subjects = HIGH STRESS ❌
    
    Score is normalized 0–10. Lower is better.
    """
    if not sessions:
        return 0.0

    # Group difficulties by date
    day_diffs: Dict[str, List[int]] = {}
    for s in sessions:
        day_diffs.setdefault(s.date, []).append(s.difficulty)

    # Compute variance for each day
    total_variance = 0.0
    for diffs in day_diffs.values():
        if len(diffs) < 2:
            continue
        mean = sum(diffs) / len(diffs)
        variance = sum((d - mean) ** 2 for d in diffs) / len(diffs)
        total_variance += variance

    avg_variance = total_variance / max(1, len(day_diffs))

    # Normalize: max possible variance for difficulty 1–5 is ~4.0
    stress = min(10.0, round(avg_variance * 2.5, 2))
    return stress


# ------------------------------------------------------------------
# EFFICIENCY SCORE CALCULATOR
# ------------------------------------------------------------------

def compute_efficiency_score(
    sessions: List[StudySession],
    subjects: List[Subject],
    start_date: date
) -> float:
    """
    Efficiency score = how well urgent (near-exam) subjects appear early in schedule.
    
    For each subject, we check: are its sessions front-loaded before the exam?
    Score 0–10. Higher is better.
    """
    if not sessions or not subjects:
        return 0.0

    total_score = 0.0

    for subj in subjects:
        exam = date.fromisoformat(subj.exam_date)
        total_days = max(1, (exam - start_date).days)

        # Find sessions for this subject
        subj_sessions = [s for s in sessions if s.subject_name == subj.name]
        if not subj_sessions:
            continue

        # Check fraction of sessions scheduled in first half of available days
        early_sessions = 0
        midpoint = start_date + timedelta(days=total_days // 2)

        for s in subj_sessions:
            s_date = date.fromisoformat(s.date)
            if s_date <= midpoint:
                early_sessions += 1

        fraction_early = early_sessions / len(subj_sessions)

        # Hard subjects should be even more front-loaded
        weight = subj.difficulty / 5.0
        total_score += fraction_early * (0.5 + 0.5 * weight)

    efficiency = min(10.0, round((total_score / len(subjects)) * 10, 2))
    return efficiency


# ------------------------------------------------------------------
# MAIN OPTIMIZER
# ------------------------------------------------------------------

def generate_optimized_schedule(
    subjects: List[Subject],
    daily_hours: float,
    start_date: date
) -> ScheduleResponse:
    """
    Main function: generate a complete optimized study timetable.
    
    Pipeline:
      Step 1: A* — compute priority scores and create session list
      Step 2: CSP — assign valid time slots to each session
      Step 3: Build final StudySession objects
      Step 4: Compute stress and efficiency scores
    """
    # Filter out already-completed subjects
    active_subjects = [s for s in subjects if not s.completed]

    if not active_subjects:
        return ScheduleResponse(
            sessions=[],
            total_days=0,
            total_hours=0.0,
            stress_score=0.0,
            efficiency_score=10.0,
            message="🎉 All subjects are marked complete! Nothing left to schedule."
        )

    # ------ STEP 1: A* Priority Ordering ------
    subject_dicts = [
        {
            "name": s.name,
            "difficulty": s.difficulty,
            "exam_date": s.exam_date,
            "remaining_hours": s.remaining_hours
        }
        for s in active_subjects
    ]

    prioritized_sessions = astar_prioritize(subject_dicts, start_date)

    if not prioritized_sessions:
        return ScheduleResponse(
            sessions=[],
            total_days=0,
            total_hours=0.0,
            stress_score=0.0,
            efficiency_score=0.0,
            message="Could not generate sessions. Please check your inputs."
        )

    # Prepare session list for CSP (add exam_date per session)
    subj_exam_map = {s.name: s.exam_date for s in active_subjects}
    csp_sessions = []
    for ps in prioritized_sessions:
        csp_sessions.append({
            "id": ps["id"],
            "subject": ps["subject"],
            "duration": ps["duration"],
            "exam_date": subj_exam_map.get(ps["subject"], str(start_date + timedelta(days=30))),
        })

    # ------ STEP 2: CSP Time Slot Assignment ------
    assignment = solve_csp(csp_sessions, daily_hours, start_date)

    # ------ STEP 3: Build Final StudySession Objects ------
    study_sessions: List[StudySession] = []

    # Build a lookup from prioritized sessions
    ps_lookup = {ps["id"]: ps for ps in prioritized_sessions}

    for sess_data in csp_sessions:
        sess_id = sess_data["id"]
        if sess_id not in assignment:
            continue

        date_str, slot_idx = assignment[sess_id]
        start_time, end_time = slot_to_time(slot_idx)
        ps = ps_lookup.get(sess_id, {})

        study_sessions.append(StudySession(
            session_id=sess_id,
            subject_name=sess_data["subject"],
            date=date_str,
            day_label=format_day_label(date_str),
            start_time=start_time,
            end_time=end_time,
            duration_hours=sess_data["duration"],
            priority_score=ps.get("priority_score", 0.0),
            difficulty=ps.get("difficulty", 1),
            status="pending",
            note=ps.get("note", "")
        ))

    # Sort by date then start time for clean display
    study_sessions.sort(key=lambda s: (s.date, s.start_time))

    # ------ STEP 4: Compute Metrics ------
    stress = compute_stress_score(study_sessions)
    efficiency = compute_efficiency_score(study_sessions, subjects, start_date)

    total_hours = sum(s.duration_hours for s in study_sessions)
    dates = set(s.date for s in study_sessions)
    total_days = len(dates)

    # Build summary message
    urgent_subj = min(active_subjects, key=lambda s: s.exam_date)
    message = (
        f"Generated {len(study_sessions)} study sessions across {total_days} days. "
        f"Most urgent: {urgent_subj.name} (exam: {urgent_subj.exam_date}). "
        f"Stress index: {stress}/10 — {'Great spread! 🎯' if stress < 4 else 'Consider spreading harder topics. 📊'}"
    )

    return ScheduleResponse(
        sessions=study_sessions,
        total_days=total_days,
        total_hours=round(total_hours, 1),
        stress_score=stress,
        efficiency_score=efficiency,
        message=message
    )


# ------------------------------------------------------------------
# REGENERATE AFTER SKIP
# ------------------------------------------------------------------

def regenerate_after_skip(
    subjects: List[Subject],
    daily_hours: float,
    start_date: date,
    skipped_subject: str
) -> ScheduleResponse:
    """
    When a user skips a session, boost that subject's remaining_hours
    slightly (add 0.5h buffer) and regenerate the entire schedule.
    This ensures skipped content is rescheduled intelligently.
    """
    updated_subjects = []
    for s in subjects:
        if s.name == skipped_subject and not s.completed:
            # Add a buffer for the skipped session
            bumped = Subject(
                name=s.name,
                difficulty=s.difficulty,
                exam_date=s.exam_date,
                remaining_hours=min(s.remaining_hours + 0.5, s.remaining_hours * 1.1),
                completed=s.completed
            )
            updated_subjects.append(bumped)
        else:
            updated_subjects.append(s)

    return generate_optimized_schedule(updated_subjects, daily_hours, start_date)
