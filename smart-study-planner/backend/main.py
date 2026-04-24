"""
main.py — FastAPI Backend Entry Point
======================================
This file starts the web server and defines all API endpoints.

To run: uvicorn main:app --reload --port 8000
Docs:   http://https://smart-study-planner-4-w1ih.onrender.com:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import sys
import os

# Make sure Python can find our modules
sys.path.insert(0, os.path.dirname(__file__))

from models.schemas import (
    GenerateScheduleRequest,
    UpdateProgressRequest,
    ScheduleResponse
)
from scheduler.optimizer import generate_optimized_schedule, regenerate_after_skip

# ------------------------------------------------------------------
# CREATE FASTAPI APP
# ------------------------------------------------------------------

app = FastAPI(
    title="Smart Study Planner API",
    description="AI-powered study schedule generator using CSP + A* algorithms",
    version="1.0.0"
)

# ------------------------------------------------------------------
# CORS MIDDLEWARE
# Allow the React frontend (running on https://smart-study-planner-4-w1ih.onrender.com:5173) to call this API
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------------

@app.get("/")
def root():
    """Simple health check endpoint."""
    return {
        "status": "running",
        "message": "Smart Study Planner API is live 🎓",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------------------------------------------------------
# ENDPOINT 1: Generate Study Schedule
# POST /generate-schedule
# ------------------------------------------------------------------

@app.post("/generate-schedule", response_model=ScheduleResponse)
def generate_schedule(request: GenerateScheduleRequest):
    """
    Generate an AI-optimized study schedule.
    
    Uses:
      - A* algorithm to prioritize sessions by urgency + difficulty
      - CSP backtracking to assign valid non-overlapping time slots
      - Optimizer to compute stress and efficiency metrics
    
    Input: list of subjects with difficulty, exam date, hours needed
    Output: complete timetable with sessions per day
    """
    try:
        # Parse start date from string
        start = date.fromisoformat(request.start_date)

        # Validate: start date must not be in the past
        if start < date.today():
            start = date.today()  # Use today if past date given

        # Validate: each subject must have an exam date after start
        for subj in request.subjects:
            exam = date.fromisoformat(subj.exam_date)
            if exam < start:
                raise HTTPException(
                    status_code=400,
                    detail=f"Exam date for '{subj.name}' is before the start date."
                )

        # Run the optimizer
        result = generate_optimized_schedule(
            subjects=request.subjects,
            daily_hours=request.daily_hours,
            start_date=start
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduling error: {str(e)}")


# ------------------------------------------------------------------
# ENDPOINT 2: Update Progress (Mark Complete / Handle Skip)
# POST /update-progress
# ------------------------------------------------------------------

@app.post("/update-progress", response_model=ScheduleResponse)
def update_progress(request: UpdateProgressRequest):
    """
    Update a study session's status and regenerate the schedule.
    
    - If status = 'completed': mark as done, regenerate without it
    - If status = 'skipped':   add buffer to subject, regenerate (Smart Adjust)
    
    This endpoint powers the "Smart Adjust" feature:
    When you skip a session, the AI redistributes that study time
    across remaining days automatically.
    """
    try:
        start = date.fromisoformat(request.start_date)
        if start < date.today():
            start = date.today()

        if request.status == "skipped":
            # Find which subject the skipped session belonged to
            # We regenerate with a slight boost for that subject
            # The session_id format is "sess_XXXX" — we look at subjects that aren't complete
            
            # For simplicity: find the highest-priority incomplete subject and boost it
            # In a real app, you'd look up session_id → subject in a database
            incomplete = [s for s in request.subjects if not s.completed]
            skip_subject = incomplete[0].name if incomplete else ""

            result = regenerate_after_skip(
                subjects=request.subjects,
                daily_hours=request.daily_hours,
                start_date=start,
                skipped_subject=skip_subject
            )
        else:
            # For 'completed' status: just regenerate normally with updated subject list
            result = generate_optimized_schedule(
                subjects=request.subjects,
                daily_hours=request.daily_hours,
                start_date=start
            )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update error: {str(e)}")


# ------------------------------------------------------------------
# ENDPOINT 3: Sample Data (for testing)
# GET /sample-data
# ------------------------------------------------------------------

@app.get("/sample-data")
def get_sample_data():
    """
    Returns sample input data so you can test the API quickly.
    Hit this in the browser or Swagger UI to see example payloads.
    """
    from datetime import timedelta
    today = date.today()

    return {
        "subjects": [
            {
                "name": "Mathematics",
                "difficulty": 5,
                "exam_date": str(today + timedelta(days=7)),
                "remaining_hours": 10.0,
                "completed": False
            },
            {
                "name": "Physics",
                "difficulty": 4,
                "exam_date": str(today + timedelta(days=10)),
                "remaining_hours": 8.0,
                "completed": False
            },
            {
                "name": "History",
                "difficulty": 2,
                "exam_date": str(today + timedelta(days=14)),
                "remaining_hours": 5.0,
                "completed": False
            },
            {
                "name": "English",
                "difficulty": 1,
                "exam_date": str(today + timedelta(days=12)),
                "remaining_hours": 3.0,
                "completed": False
            }
        ],
        "daily_hours": 4.0,
        "start_date": str(today)
    }


# ------------------------------------------------------------------
# RUN DIRECTLY (python main.py)
# ------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
