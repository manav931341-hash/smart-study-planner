/**
 * Schedule.jsx — Displays the generated study timetable.
 * 
 * Features:
 *   - Shows all sessions grouped by day
 *   - Mark sessions as complete or skip (→ regenerates schedule)
 *   - Progress tracker with metrics
 *   - Tab navigation between Timetable and Progress views
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TimetableDisplay from '../components/TimetableDisplay.jsx'
import ProgressTracker from '../components/ProgressTracker.jsx'
import { updateProgress } from '../utils/api.js'

export default function Schedule({
  scheduleData, setScheduleData,
  subjects, setSubjects,
  dailyHours, startDate
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('timetable')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastAction, setLastAction] = useState(null) // for user feedback

  // ---- Handle session complete ----
  async function handleComplete(sessionId) {
    if (!scheduleData) return
    setLoading(true)
    setError(null)

    // Find which session this is so we can update its subject
    const sess = scheduleData.sessions.find(s => s.session_id === sessionId)
    
    // Update the local subjects state: reduce remaining hours for the subject
    let updatedSubjects = subjects.map(subj => {
      if (subj.name === sess?.subject_name) {
        const newHours = Math.max(0, subj.remaining_hours - (sess.duration_hours || 1))
        return { ...subj, remaining_hours: newHours, completed: newHours === 0 }
      }
      return subj
    })

    setSubjects(updatedSubjects)

    try {
      const result = await updateProgress({
        session_id: sessionId,
        status: 'completed',
        subjects: updatedSubjects,
        daily_hours: dailyHours,
        start_date: startDate || new Date().toISOString().split('T')[0],
      })

      // Preserve 'completed' statuses from old sessions
      const completedIds = new Set(
        scheduleData.sessions
          .filter(s => s.status === 'completed')
          .map(s => s.session_id)
      )
      completedIds.add(sessionId)

      // Merge: mark completed sessions in new schedule
      const merged = result.sessions.map(s =>
        completedIds.has(s.session_id) ? { ...s, status: 'completed' } : s
      )
      setScheduleData({ ...result, sessions: merged })
      setLastAction(`✅ Marked session as complete! ${merged.filter(s=>s.status==='completed').length} done so far.`)
    } catch (err) {
      setError('Failed to update. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---- Handle session skip (Smart Adjust) ----
  async function handleSkip(sessionId) {
    if (!scheduleData) return
    setLoading(true)
    setError(null)

    try {
      const result = await updateProgress({
        session_id: sessionId,
        status: 'skipped',
        subjects,
        daily_hours: dailyHours,
        start_date: startDate || new Date().toISOString().split('T')[0],
      })

      // Preserve completed statuses in the regenerated schedule
      const completedIds = new Set(
        scheduleData.sessions
          .filter(s => s.status === 'completed')
          .map(s => s.session_id)
      )

      const merged = result.sessions.map(s =>
        completedIds.has(s.session_id) ? { ...s, status: 'completed' } : s
      )
      setScheduleData({ ...result, sessions: merged })
      setLastAction('🔄 Schedule regenerated after skip. Time redistributed smartly!')
    } catch (err) {
      setError('Failed to update. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---- No schedule yet ----
  if (!scheduleData) {
    return (
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>
          No Schedule Generated Yet
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Go to the Planner page to add your subjects and generate a personalized schedule.
        </p>
        <button className="btn-primary" onClick={() => navigate('/planner')} style={{ padding: '12px 28px' }}>
          Go to Planner →
        </button>
      </main>
    )
  }

  const pendingCount = scheduleData.sessions.filter(s => s.status === 'pending').length
  const completedCount = scheduleData.sessions.filter(s => s.status === 'completed').length

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 28,
        animation: 'fadeIn 0.4s ease',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6 }}>
            Your Study Schedule
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {scheduleData.sessions.length} sessions • {scheduleData.total_days} days •{' '}
            {scheduleData.total_hours}h total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 13 }}>
              <span className="spinner" />
              Updating...
            </div>
          )}
          <button className="btn-ghost" onClick={() => navigate('/planner')}>
            ← Edit Subjects
          </button>
        </div>
      </div>

      {/* Action feedback banner */}
      {lastAction && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--green-dim)',
          border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--green)',
          fontSize: 13,
          marginBottom: 16,
          animation: 'fadeIn 0.3s ease',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {lastAction}
          <button
            onClick={() => setLastAction(null)}
            style={{ background: 'none', color: 'var(--green)', fontSize: 16, cursor: 'pointer' }}
          >×</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--red)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 4,
        width: 'fit-content',
      }}>
        {[
          { id: 'timetable', label: `📅 Timetable (${pendingCount} pending)` },
          { id: 'progress', label: `📊 Progress (${completedCount} done)` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid var(--accent-border)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'timetable' ? (
          <TimetableDisplay
            sessions={scheduleData.sessions}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        ) : (
          <ProgressTracker scheduleData={scheduleData} subjects={subjects} />
        )}
      </div>
    </main>
  )
}
