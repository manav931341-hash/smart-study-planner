/**
 * TimetableDisplay.jsx — Renders the generated study timetable
 * Groups sessions by day and shows them in a clean grid.
 * Each session has Complete / Skip buttons.
 */

import React, { useMemo } from 'react'

const DIFF_COLORS = ['', 'var(--green)', '#86efac', 'var(--accent)', '#fb923c', 'var(--red)']
const DIFF_LABELS = ['', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']

export default function TimetableDisplay({ sessions, onComplete, onSkip }) {
  // Group sessions by date for display
  const groupedByDay = useMemo(() => {
    const groups = {}
    sessions.forEach(sess => {
      if (!groups[sess.date]) {
        groups[sess.date] = {
          date: sess.date,
          day_label: sess.day_label,
          sessions: [],
        }
      }
      groups[sess.date].sessions.push(sess)
    })
    // Sort days chronologically
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date))
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <p>No sessions scheduled. Generate a schedule first!</p>
      </div>
    )
  }

  const completedCount = sessions.filter(s => s.status === 'completed').length
  const totalCount = sessions.length
  const progressPct = Math.round((completedCount / totalCount) * 100)

  return (
    <div>
      {/* Overall progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            {completedCount} / {totalCount} sessions ({progressPct}%)
          </span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Day cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groupedByDay.map(day => (
          <DayCard
            key={day.date}
            dayLabel={day.day_label}
            sessions={day.sessions}
            onComplete={onComplete}
            onSkip={onSkip}
          />
        ))}
      </div>
    </div>
  )
}

// ---- Single day card ----
function DayCard({ dayLabel, sessions, onComplete, onSkip }) {
  const allDone = sessions.every(s => s.status === 'completed')
  const totalHours = sessions.reduce((sum, s) => sum + s.duration_hours, 0)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${allDone ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Day header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: allDone ? 'rgba(74,222,128,0.05)' : 'var(--bg-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            color: allDone ? 'var(--green)' : 'var(--text-primary)',
          }}>
            {allDone ? '✅ ' : '📅 '}{dayLabel}
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {totalHours.toFixed(1)}h total • {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sessions list */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map(sess => (
          <SessionRow
            key={sess.session_id}
            session={sess}
            onComplete={() => onComplete(sess.session_id)}
            onSkip={() => onSkip(sess.session_id)}
          />
        ))}
      </div>
    </div>
  )
}

// ---- Single session row ----
function SessionRow({ session, onComplete, onSkip }) {
  const isComplete = session.status === 'completed'
  const isSkipped = session.status === 'skipped'
  const isPending = session.status === 'pending'

  const statusColors = {
    completed: { bg: 'rgba(74,222,128,0.07)', border: 'rgba(74,222,128,0.2)' },
    skipped:   { bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.2)' },
    pending:   { bg: 'var(--bg-input)', border: 'var(--border)' },
  }
  const sc = statusColors[session.status] || statusColors.pending

  return (
    <div style={{
      background: sc.bg,
      border: `1px solid ${sc.border}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      opacity: isSkipped ? 0.6 : 1,
      transition: 'all 0.2s ease',
    }}>
      {/* Time column */}
      <div style={{
        flexShrink: 0,
        textAlign: 'center',
        minWidth: 56,
        padding: '4px 8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.3 }}>
          {session.start_time}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {session.end_time}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{
            fontWeight: 600,
            fontSize: 14,
            color: isComplete ? 'var(--green)' : 'var(--text-primary)',
            textDecoration: isSkipped ? 'line-through' : 'none',
          }}>
            {isComplete ? '✅ ' : ''}{session.subject_name}
          </span>

          {/* Difficulty stars */}
          <span style={{
            fontSize: 11,
            color: DIFF_COLORS[session.difficulty],
            letterSpacing: 1,
          }}>
            {DIFF_LABELS[session.difficulty]}
          </span>

          {/* Duration badge */}
          <span style={{
            fontSize: 11, padding: '2px 7px',
            background: 'rgba(96,165,250,0.1)',
            color: 'var(--blue)',
            borderRadius: 10,
            border: '1px solid rgba(96,165,250,0.2)',
          }}>
            {session.duration_hours}h
          </span>

          {/* Priority badge */}
          <span style={{
            fontSize: 11, padding: '2px 7px',
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            borderRadius: 10,
            border: '1px solid var(--accent-border)',
          }}>
            P: {session.priority_score.toFixed(2)}
          </span>
        </div>

        {/* Note */}
        {session.note && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {session.note}
          </p>
        )}
      </div>

      {/* Action buttons — only for pending sessions */}
      {isPending && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn-success"
            onClick={onComplete}
            title="Mark as completed"
          >
            ✓ Done
          </button>
          <button
            className="btn-danger"
            onClick={onSkip}
            title="Skip and reschedule"
          >
            ↩ Skip
          </button>
        </div>
      )}

      {/* Status badge for non-pending */}
      {!isPending && (
        <span className={`badge ${isComplete ? 'badge-green' : 'badge-red'}`}>
          {isComplete ? 'Done' : 'Skipped'}
        </span>
      )}
    </div>
  )
}
