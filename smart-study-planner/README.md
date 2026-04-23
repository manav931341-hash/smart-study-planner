# 🎓 Smart Study Planner AI

An AI-powered study schedule generator using **Constraint Satisfaction Problem (CSP)** and **A\* Search Algorithm**.

---

## 📁 Folder Structure

```
smart-study-planner/
│
├── backend/
│   ├── main.py                  ← FastAPI app + API endpoints
│   ├── scheduler/
│   │   ├── csp.py               ← CSP backtracking solver
│   │   ├── astar.py             ← A* priority algorithm
│   │   └── optimizer.py         ← Combines CSP + A*, computes metrics
│   ├── models/
│   │   └── schemas.py           ← Pydantic request/response models
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SubjectForm.jsx   ← Add subjects form
│   │   │   ├── SubjectList.jsx   ← Display added subjects
│   │   │   ├── TimetableDisplay.jsx ← Session grid view
│   │   │   └── ProgressTracker.jsx  ← Metrics + per-subject progress
│   │   ├── pages/
│   │   │   ├── Home.jsx          ← Landing page
│   │   │   ├── Planner.jsx       ← Subject input page
│   │   │   └── Schedule.jsx      ← Generated schedule page
│   │   ├── utils/
│   │   │   └── api.js            ← Axios API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed

---

### Step 1: Start the Backend

```bash
# Navigate to backend folder
cd smart-study-planner/backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

✅ Backend runs at: **http://localhost:8000**
📚 API Docs (Swagger UI): **http://localhost:8000/docs**

---

### Step 2: Start the Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd smart-study-planner/frontend

# Install Node modules
npm install

# Start the Vite dev server
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

### Step 3: Use the App

1. Open **http://localhost:5173**
2. Click **"Start Planning"** or go to **/planner**
3. Click **"Load Sample Data"** to auto-fill 4 subjects
4. OR manually add subjects using the form
5. Set your **daily hours** and **start date**
6. Click **"Generate Schedule"**
7. View your AI-generated timetable on the **/schedule** page
8. Mark sessions as ✅ Done or ↩ Skip
9. After a skip, the AI auto-redistributes (Smart Adjust)

---

## 🤖 How the AI Logic Works (For Viva)

### 1. A* Search Algorithm (`astar.py`)

**Purpose:** Decide which subjects to study first.

**How it works:**
- Each subject is a "node" in the search space
- Every node has two costs:
  - `g(n)` = how many hours we've already scheduled for this subject
  - `h(n)` = heuristic urgency score (how badly we NEED to study it now)
- `f(n) = g(n) + h(n)` — lower f means explored first (we use max-priority here)
- Heuristic formula:
  ```
  urgency   = 10 / days_until_exam     (closer exam = more urgent)
  difficulty = difficulty / 5           (harder = more important)
  workload   = log(remaining_hours + 1) (more left = more urgent)
  
  score = urgency * 0.5 + difficulty * 0.3 + workload * 0.2
  ```
- A priority queue (max-heap) always pops the most urgent subject
- Subjects with close exam dates and high difficulty get scheduled first

**Why A\*?** It's optimal — it guarantees that the most critical subjects are always handled before less urgent ones.

---

### 2. Constraint Satisfaction Problem — CSP (`csp.py`)

**Purpose:** Assign actual time slots to sessions without violating any rules.

**Constraints enforced:**
1. No two sessions can occupy the same time slot on the same day
2. Daily study hours cannot exceed the user's daily limit
3. Sessions must be placed before the subject's exam date

**Algorithm: Backtracking Search**
```
backtrack(sessions, index=0, assignment={}):
  if all sessions assigned:
    return assignment         ← SUCCESS

  session = sessions[index]
  for each valid (date, slot) in domain:
    if is_consistent(assignment, session, date, slot):
      assignment[session] = (date, slot)    ← Try this slot
      result = backtrack(sessions, index+1, assignment)
      if result is not None:
        return result         ← Found a full solution!
      del assignment[session]               ← Backtrack
  
  return None                 ← No valid slot found
```

If backtracking takes too long, a greedy fallback fills slots day by day.

---

### 3. Optimizer (`optimizer.py`)

**Purpose:** Combine A* ordering + CSP assignment into final timetable.

**Pipeline:**
```
Input subjects
    ↓
A* → creates prioritized session list (most urgent first)
    ↓
CSP → assigns each session to a valid (date, time_slot)
    ↓
Build StudySession objects with all metadata
    ↓
Compute Stress Score + Efficiency Score
    ↓
Return ScheduleResponse to frontend
```

**Stress Score:** Measures difficulty variance per day. Low variance = sessions spread evenly = lower stress.

**Efficiency Score:** Measures how many high-priority sessions appear early in the schedule. Higher = better.

---

### 4. Smart Adjust (Skip Feature)

When a user skips a session:
1. Backend receives the `skipped` status
2. It adds a 10% buffer to the skipped subject's remaining hours
3. Entire schedule is **regenerated** with A* + CSP
4. The skipped content is redistributed across remaining available days

---

## 🌐 Deployment

### Backend — Render

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your repo, set **Root Directory** to `backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Copy the live URL (e.g., `https://study-planner-api.onrender.com`)

### Frontend — Vercel

1. Go to https://vercel.com → New Project
2. Connect your repo, set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL
4. Deploy! Vercel auto-detects Vite.

---

## 🧪 Sample Test Data

The backend provides sample data at `GET /sample-data`:

```json
{
  "subjects": [
    { "name": "Mathematics", "difficulty": 5, "exam_date": "7 days from now", "remaining_hours": 10 },
    { "name": "Physics",     "difficulty": 4, "exam_date": "10 days from now", "remaining_hours": 8 },
    { "name": "History",     "difficulty": 2, "exam_date": "14 days from now", "remaining_hours": 5 },
    { "name": "English",     "difficulty": 1, "exam_date": "12 days from now", "remaining_hours": 3 }
  ],
  "daily_hours": 4,
  "start_date": "today"
}
```

Expected result: Mathematics and Physics get higher priority scores. Math sessions appear earlier in the schedule. Difficulty is spread across days to minimize stress.

---

## 🛠 Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18 + Vite     |
| Routing   | React Router v6     |
| HTTP      | Axios               |
| Backend   | FastAPI (Python)    |
| Validation| Pydantic v2         |
| Server    | Uvicorn             |
| AI Logic  | Pure Python (CSP + A*) |

---

## 📝 License

MIT — Free to use and modify.
