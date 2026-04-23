"""
schemas.py — Pydantic data models for request/response validation.
These define the exact shape of data sent to and from the API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


# ------------------------------------------------------------------
# INPUT MODELS (what the frontend sends to the backend)
# ------------------------------------------------------------------

class Subject(BaseModel):
    """Represents one subject the student wants to study."""
    name: str = Field(..., description="Name of the subject, e.g. 'Mathematics'")
    difficulty: int = Field(..., ge=1, le=5, description="Difficulty from 1 (easy) to 5 (hard)")
    exam_date: str = Field(..., description="Exam date in YYYY-MM-DD format")
    remaining_hours: float = Field(..., gt=0, description="Total hours of study still needed")
    completed: bool = Field(default=False, description="Has the student finished this subject?")


class GenerateScheduleRequest(BaseModel):
    """Full request body for generating a study schedule."""
    subjects: List[Subject] = Field(..., min_items=1)
    daily_hours: float = Field(..., gt=0, le=16, description="How many hours per day student can study")
    start_date: str = Field(..., description="Start date for schedule in YYYY-MM-DD format")


class UpdateProgressRequest(BaseModel):
    """Request body for marking a session as done or skipped."""
    session_id: str = Field(..., description="Unique ID of the study session")
    status: str = Field(..., description="Either 'completed' or 'skipped'")
    subjects: List[Subject] = Field(..., description="Updated subject list with current progress")
    daily_hours: float = Field(..., gt=0, le=16)
    start_date: str = Field(..., description="Today's date in YYYY-MM-DD format")


# ------------------------------------------------------------------
# OUTPUT MODELS (what the backend sends back to the frontend)
# ------------------------------------------------------------------

class StudySession(BaseModel):
    """One block of study time in the generated timetable."""
    session_id: str
    subject_name: str
    date: str                      # YYYY-MM-DD
    day_label: str                 # e.g. "Monday, Jan 5"
    start_time: str                # e.g. "09:00"
    end_time: str                  # e.g. "11:00"
    duration_hours: float
    priority_score: float          # Higher = more urgent (from A*)
    difficulty: int
    status: str                    # "pending", "completed", "skipped"
    note: str = ""                 # Optional tip like "Focus on hard topics first"


class ScheduleResponse(BaseModel):
    """Full schedule returned to the frontend."""
    sessions: List[StudySession]
    total_days: int
    total_hours: float
    stress_score: float            # Lower is better — measures schedule difficulty
    efficiency_score: float        # Higher is better — urgency coverage
    message: str                   # Human-readable summary
