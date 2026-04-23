/**
 * SubjectForm.jsx — Input form for adding study subjects
 * 
 * Fields:
 *   - Subject name
 *   - Difficulty (1–5 star selector)
 *   - Exam date picker
 *   - Remaining study hours
 */

import React, { useState } from 'react'

// Difficulty label helper
const DIFF_LABELS = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']
const DIFF_COLORS = ['', 'var(--green)', '#86efac', 'var(--accent)', '#fb923c', 'var(--red)']

export default function SubjectForm({ onAdd }) {
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [examDate, setExamDate] = useState('')
  const [hours, setHours] = useState('')
  const [errors, setErrors] = useState({})

  // Get today's date as minimum for exam date picker
  const today = new Date().toISOString().split('T')[0]

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Subject name is required'
    if (!examDate) errs.examDate = 'Exam date is required'
    if (!hours || Number(hours) <= 0) errs.hours = 'Enter a valid number of hours'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    // Call parent handler with new subject
    onAdd({
      name: name.trim(),
      difficulty: Number(difficulty),
      exam_date: examDate,
      remaining_hours: Number(hours),
      completed: false,
    })
    // Reset form
    setName('')
    setDifficulty(3)
    setExamDate('')
    setHours('')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Subject Name */}
      <div>
        <label style={labelStyle}>Subject Name</label>
        <input
          type="text"
          placeholder="e.g. Mathematics, Physics..."
          value={name}
          onChange={e => setName(e.target.value)}
          style={errors.name ? { ...inputErrStyle } : {}}
        />
        {errors.name && <p style={errTextStyle}>{errors.name}</p>}
      </div>

      {/* Difficulty Selector */}
      <div>
        <label style={labelStyle}>
          Difficulty Level
          <span style={{ color: DIFF_COLORS[difficulty], marginLeft: 8, fontWeight: 600 }}>
            {DIFF_LABELS[difficulty]}
          </span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${difficulty >= d ? DIFF_COLORS[d] : 'var(--border)'}`,
                background: difficulty >= d ? `${DIFF_COLORS[d]}20` : 'var(--bg-input)',
                color: difficulty >= d ? DIFF_COLORS[d] : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Two columns: Exam Date + Hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Exam Date</label>
          <input
            type="date"
            value={examDate}
            min={today}
            onChange={e => setExamDate(e.target.value)}
            style={errors.examDate ? { ...inputErrStyle } : {}}
          />
          {errors.examDate && <p style={errTextStyle}>{errors.examDate}</p>}
        </div>

        <div>
          <label style={labelStyle}>Study Hours Needed</label>
          <input
            type="number"
            placeholder="e.g. 12"
            value={hours}
            min="0.5"
            max="200"
            step="0.5"
            onChange={e => setHours(e.target.value)}
            style={errors.hours ? { ...inputErrStyle } : {}}
          />
          {errors.hours && <p style={errTextStyle}>{errors.hours}</p>}
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="btn-primary" style={{ width: '100%' }}>
        + Add Subject
      </button>
    </form>
  )
}

// Shared styles
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}

const inputErrStyle = {
  borderColor: 'var(--red)',
  boxShadow: '0 0 0 3px var(--red-dim)',
}

const errTextStyle = {
  fontSize: 11,
  color: 'var(--red)',
  marginTop: 4,
}
