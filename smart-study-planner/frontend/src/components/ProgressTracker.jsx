/**
 * ProgressTracker.jsx — Shows per-subject completion progress
 * and overall schedule metrics (stress score, efficiency score).
 */

import React, { useMemo } from 'react'

export default function ProgressTracker({ scheduleData, subjects }) {
  if (!scheduleData || !scheduleData.sessions.length) return null

  const { sessions, stress_score, efficiency_score, total_hours, total_days, message } = scheduleData

  // Compute per-subject stats from sessions
  const subjectStats = useMemo(() => {
    const stats = {}
    sessions.forEach(sess => {
      if (!stats[sess.subject_name]) {
        stats[sess.subject_name] = {
          total: 0, completed: 0, skipped: 0, pending: 0,
          difficulty: sess.difficulty,
        }
      }
      stats[sess.subject_name].total++
      stats[sess.subject_name][sess.status]++
    })
    return stats
  }, [sessions])

  // Score color helpers
  const stressColor = stress_score < 4 ? 'var(--green)' : stress_score < 7 ? 'var(--accent)' : 'var(--red)'
  const efficiencyColor = efficiency_score > 7 ? 'var(--green)' : efficiency_score > 4 ? 'var(--accent)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary message */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(245,166,35,0.07)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
      }}>
        {message}
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <MetricCard label="Total Sessions" value={sessions.length} icon="📋" color="var(--blue)" />
        <MetricCard label="Study Days" value={total_days} icon="📅" color="var(--purple)" />
        <MetricCard label="Total Hours" value={`${total_hours}h`} icon="🕐" color="var(--accent)" />
        <MetricCard
          label="Stress Index"
          value={`${stress_score}/10`}
          icon="💆"
          color={stressColor}
          subtitle={stress_score < 4 ? 'Well spread!' : 'High load days'}
        />
        <MetricCard
          label="Efficiency"
          value={`${efficiency_score}/10`}
          icon="⚡"
          color={efficiencyColor}
          subtitle={efficiency_score > 7 ? 'Optimized!' : 'Could improve'}
        />
      </div>

      {/* Per-subject breakdown */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Subject Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(subjectStats).map(([name, stats]) => {
            const completePct = Math.round((stats.completed / stats.total) * 100)
            return (
              <SubjectProgress key={name} name={name} stats={stats} completePct={completePct} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Metric card ----
function MetricCard({ label, value, icon, color, subtitle }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  )
}

// ---- Per-subject progress bar ----
function SubjectProgress({ name, stats, completePct }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>
        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--green)' }}>✓ {stats.completed}</span>
          <span style={{ color: 'var(--red)' }}>↩ {stats.skipped}</span>
          <span>⏳ {stats.pending}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{completePct}%</span>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${completePct}%` }} />
      </div>
    </div>
  )
}
