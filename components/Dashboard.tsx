'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-service'
import { DateSession, EmergencyContact } from '@/lib/types'
import { AlertTriangle, Calendar, CheckCircle, Clock, MapPin, Radio, Shield } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'var(--primary-dim)',  color: 'var(--primary)' },
    arrived:   { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    scheduled: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
    completed: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    escalated: { bg: 'var(--danger-dim)',   color: 'var(--danger)' },
    ended_early: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  }
  const c = colors[status] || colors.scheduled
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      background: c.bg, color: c.color,
    }}>{status}</span>
  )
}

function SessionCard({ session }: { session: DateSession }) {
  return (
    <Link href={`/session/${session.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '18px 20px',
        transition: 'border-color 0.15s, transform 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 2 }}>{session.matchName}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{session.platform}</div>
          </div>
          <StatusBadge status={session.status} />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
            <Calendar size={13} /> {session.date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
            <Clock size={13} /> {session.time}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
            <MapPin size={13} /> {session.location}
          </span>
        </div>
        {session.isActive && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)',
              boxShadow: '0 0 0 2px var(--primary-dim)', animation: 'spin 2s linear infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>LIVE</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<DateSession[]>([])
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const [s, c] = await Promise.all([api.getSessions(), api.getContacts()])
      setSessions(s)
      setContacts(c)
      setError('')
    } catch {
      setError('Could not connect to the SafeDate backend. Is Flask running on port 5001?')
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const active = sessions.filter(s => s.isActive)
  const completed = sessions.filter(s => s.status === 'completed').length
  const alerts = sessions.filter(s => s.status === 'escalated').length

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={22} color="var(--primary)" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Overview</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your safety dashboard</p>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-dim)', border: '1px solid var(--danger)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: 'var(--danger)', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard icon={<Radio size={20} color="var(--primary)" />} label="Active sessions" value={active.length} color="var(--primary-dim)" />
        <StatCard icon={<CheckCircle size={20} color="#22c55e" />} label="Completed" value={completed} color="var(--success-dim)" />
        <StatCard icon={<AlertTriangle size={20} color="var(--danger)" />} label="Escalated" value={alerts} color="var(--danger-dim)" />
        <StatCard icon={<Phone size={20} color="var(--warning)" />} label="Contacts" value={contacts.length} color="rgba(245,158,11,0.15)" />
      </div>

      {/* Active sessions */}
      {active.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
            🔴 Live Sessions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}

      {/* All sessions */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
          All Date Sessions
        </h2>
        {sessions.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No date sessions yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Create your first session to stay safe on your next date
            </div>
            <Link href="/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, background: 'var(--primary)',
              color: '#fff', fontWeight: 600, fontSize: 14,
            }}>
              + New Date Session
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </section>
    </div>
  )
}

// Fix missing import
function Phone({ size, color }: { size: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
}
