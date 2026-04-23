/**
 * Home.jsx — Landing page
 * Shows the app's value proposition and key features.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🧩',
    title: 'CSP Scheduling',
    desc: 'Constraint Satisfaction Problem solver ensures no sessions overlap and daily limits are respected.',
    color: 'var(--blue)',
  },
  {
    icon: '⭐',
    title: 'A* Optimization',
    desc: 'A* search algorithm prioritizes sessions by deadline proximity, difficulty, and remaining workload.',
    color: 'var(--accent)',
  },
  {
    icon: '📊',
    title: 'Stress Analysis',
    desc: 'Optimizer spreads difficult subjects evenly to minimize burnout and maximize daily efficiency.',
    color: 'var(--purple)',
  },
  {
    icon: '🔄',
    title: 'Smart Adjust',
    desc: 'Skip a session? The AI automatically redistributes your study time intelligently.',
    color: 'var(--green)',
  },
  {
    icon: '✅',
    title: 'Progress Tracking',
    desc: 'Mark sessions done, track per-subject completion, and see efficiency metrics in real time.',
    color: 'var(--red)',
  },
  {
    icon: '🎯',
    title: 'Priority Scoring',
    desc: 'Every session gets a priority score so you always know what matters most right now.',
    color: '#a78bfa',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 64, animation: 'fadeIn 0.5s ease' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent-border)',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 24,
        }}>
          AI-Powered • CSP + A* Algorithm
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #f0f2f8 30%, var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Study Smarter,<br />Not Harder
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          maxWidth: 520,
          margin: '0 auto 32px',
          lineHeight: 1.7,
        }}>
          Enter your subjects, difficulty levels, and exam dates.
          Our AI builds a personalized, conflict-free study schedule using
          real constraint-solving and search algorithms.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/planner')}
            style={{ padding: '14px 32px', fontSize: 15 }}
          >
            Start Planning →
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate('/schedule')}
            style={{ padding: '14px 24px', fontSize: 15 }}
          >
            View Schedule
          </button>
        </div>
      </div>

      {/* Algorithm explanation banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(96,165,250,0.08))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 48,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24,
      }}>
        {[
          { step: '01', label: 'A* Search', desc: 'Ranks sessions by urgency + difficulty + remaining hours' },
          { step: '02', label: 'CSP Solver', desc: 'Backtracking assigns non-overlapping valid time slots' },
          { step: '03', label: 'Optimizer', desc: 'Spreads difficulty, computes stress & efficiency scores' },
        ].map(item => (
          <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--accent)',
              opacity: 0.4,
              lineHeight: 1,
              flexShrink: 0,
            }}>
              {item.step}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          marginBottom: 24,
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          Everything you need to ace your exams
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card"
              style={{
                animation: `fadeIn 0.4s ease ${i * 0.07}s both`,
                borderLeft: `3px solid ${f.color}`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 64 }}>
        <button
          className="btn-primary"
          onClick={() => navigate('/planner')}
          style={{ padding: '16px 48px', fontSize: 16, borderRadius: 'var(--radius-md)' }}
        >
          Build My Schedule 🚀
        </button>
      </div>
    </main>
  )
}
