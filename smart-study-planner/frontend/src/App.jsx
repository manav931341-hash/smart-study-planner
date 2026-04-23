/**
 * App.jsx — Root component with routing and global state
 * 
 * Pages:
 *   /          → Home (landing)
 *   /planner   → Subject input form
 *   /schedule  → Generated timetable + progress tracking
 */

import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Planner from './pages/Planner.jsx'
import Schedule from './pages/Schedule.jsx'
import Navbar from './components/Navbar.jsx'

// ---- Global State Container ----
// We pass schedule data down via props so all pages share it.
// In a larger app you'd use Context or Zustand, but props work great here.

function AppContent() {
  // The generated schedule returned by the backend
  const [scheduleData, setScheduleData] = useState(null)

  // The subjects the user entered (kept so we can re-generate)
  const [subjects, setSubjects] = useState([])

  // Daily study hours
  const [dailyHours, setDailyHours] = useState(4)

  // Start date for scheduling
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/planner"
          element={
            <Planner
              subjects={subjects}
              setSubjects={setSubjects}
              dailyHours={dailyHours}
              setDailyHours={setDailyHours}
              startDate={startDate}
              setStartDate={setStartDate}
              setScheduleData={setScheduleData}
            />
          }
        />
        <Route
          path="/schedule"
          element={
            <Schedule
              scheduleData={scheduleData}
              setScheduleData={setScheduleData}
              subjects={subjects}
              setSubjects={setSubjects}
              dailyHours={dailyHours}
              startDate={startDate}
            />
          }
        />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
