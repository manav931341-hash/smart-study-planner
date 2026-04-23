/**
 * Planner.jsx — Page where users enter their subjects and preferences.
 * 
 * Sections:
 *   1. Subject input form (add subjects)
 *   2. Subject list (shows what's been added)
 *   3. Daily hours + start date config
 *   4. Generate button (calls backend)
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubjectForm from '../components/SubjectForm.jsx'
import SubjectList from '../components/SubjectList.jsx'
import { generateSchedule, getSampleData } from '../utils/api.js'

export default function Planner({
  subjects, setSubjects,
  dailyHours, setDailyHours,
  startDate, setStartDate,
  setScheduleData,
}) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  // Add a new subject
  function handleAddSubject(subj) {
    // Prevent duplicates
    if (subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase())) {
      alert(`"${subj.name}" is already in your list. Use a different name.`)
      return
    }
    setSubjects(prev => [...prev, subj])
  }

  // Remove a subject by index
  function handleRemoveSubject(index) {
    setSubjects(prev => prev.filter((_, i) => i !== index))
  }

  // Load sample data from API for quick testing
  async function handleLoadSample() {
    setLoadingSample(true)
    setError(null)
    try {
      const data = await getSampleData()
      setSubjects(data.subjects)
      setDailyHours(data.daily_hours)
      setStartDate(data.start_date)
    } catch (err) {
      setError('Could not load sample data. Is the backend running?')
    } finally {
      setLoadingSample(false)
    }
  }

  // Generate schedule: send data to backend and navigate to schedule page
  async function handleGenerate() {
    if (subjects.length === 0) {
      setError('Please add at least one subject before generating a schedule.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const payload = {
        subjects,
        daily_hours: Number(dailyHours),
        start_date: startDate,
      }
      const result = await generateSchedule(payload)
      setScheduleData(result)
      navigate('/schedule')
    } catch (err) {
      setError(`Error: ${err.message}. Make sure the backend is running on port 8000.`)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6 }}>
              Study Planner
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Add your subjects and let the AI build your optimal schedule.
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={handleLoadSample}
            disabled={loadingSample}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loadingSample ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🧪'}
            Load Sample Data
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 24,
      }}
        className="planner-grid"
      >
        {/* LEFT: Add subject form */}
        <div className="card" style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>
            ➕ Add Subject
          </h2>
          <SubjectForm onAdd={handleAddSubject} />
        </div>

        {/* RIGHT: Subject list */}
        <div className="card" style={{ animation: 'fadeIn 0.4s ease 0.2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
              📚 My Subjects
            </h2>
            <span className="badge badge-amber">
              {subjects.length} added
            </span>
          </div>
          <SubjectList subjects={subjects} onRemove={handleRemoveSubject} />
        </div>
      </div>

      {/* Schedule settings */}
      <div className="card" style={{ marginTop: 24, animation: 'fadeIn 0.4s ease 0.3s both' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>
          ⚙️ Schedule Settings
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <label style={labelStyle}>Daily Study Hours</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={dailyHours}
                onChange={e => setDailyHours(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span style={{
                minWidth: 48,
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--accent)',
              }}>
                {dailyHours}h
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {dailyHours <= 3 ? 'Light schedule' : dailyHours <= 6 ? 'Moderate' : dailyHours <= 9 ? 'Intensive' : '⚠️ Very intensive'}
            </p>
          </div>

          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Schedule begins on this date
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--red)',
          fontSize: 13,
          animation: 'fadeIn 0.2s ease',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Generate button */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading || subjects.length === 0}
          style={{
            padding: '14px 36px',
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Generating with AI...
            </>
          ) : (
            <>🤖 Generate Schedule</>
          )}
        </button>
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 680px) {
          .planner-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
}
