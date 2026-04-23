/**
 * SubjectList.jsx — Displays the list of subjects user has added
 * Shows each subject as a card with its details and a delete button.
 */

import React from 'react'

const DIFF_LABELS = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']
const DIFF_COLORS = ['', 'var(--green)', '#86efac', 'var(--accent)', '#fb923c', 'var(--red)']

export default function SubjectList({ subjects, onRemove }) {
  if (subjects.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 16px',
        color: 'var(--text-muted)',
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
        <p style={{ fontSize: 13 }}>No subjects added yet. Fill in the form above!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {subjects.map((subj, index) => {
        const daysLeft = Math.ceil(
          (new Date(subj.exam_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
        const urgency = daysLeft <= 5 ? 'var(--red)' : daysLeft <= 10 ? 'var(--accent)' : 'var(--green)'

        return (
          <div
            key={index}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {/* Left: Subject info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {subj.name}
                </span>
                <span className="badge" style={{
                  background: `${DIFF_COLORS[subj.difficulty]}20`,
                  color: DIFF_COLORS[subj.difficulty],
                  border: `1px solid ${DIFF_COLORS[subj.difficulty]}40`,
                }}>
                  {DIFF_LABELS[subj.difficulty]}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>📅 {subj.exam_date}</span>
                <span style={{ color: urgency }}>⏰ {daysLeft}d left</span>
                <span>🕐 {subj.remaining_hours}h needed</span>
              </div>
            </div>

            {/* Right: Delete button */}
            <button
              onClick={() => onRemove(index)}
              style={{
                background: 'var(--red-dim)',
                color: 'var(--red)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 13,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(248,113,113,0.25)'}
              onMouseLeave={e => e.target.style.background = 'var(--red-dim)'}
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
