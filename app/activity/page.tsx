'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api-service'
import { DateSession, SessionEvent } from '@/lib/types'
import Shell from '@/components/Shell'
import { Activity, Calendar, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ActivityPage() {
  const [sessions, setSessions] = useState<DateSession[]>([])
  const [events, setEvents] = useState<SessionEvent[]>([])

  useEffect(() => {
    api.getSessions().then(setSessions).catch(() => {})
    api.getEvents().then(setEvents).catch(() => {})
  }, [])

  const past = sessions.filter(s => s.status === 'completed' || s.status === 'escalated' || s.status === 'ended_early')

  return (
    <Shell>
      <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Activity size={22} color="var(--primary)" />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Activity History</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Past dates and event log</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>
          {/* Past Sessions */}
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Past Dates</h2>
            {past.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No past dates recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map(s => (
                  <Link key={s.id} href={`/session/${s.id}`} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '16px', display: 'block',
                    transition: 'border-color 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{s.matchName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: s.status === 'escalated' ? 'var(--danger)' : '#22c55e' }}>{s.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {s.date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {s.location}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* System Events */}
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>System Log</h2>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No events recorded yet.</p>
            ) : (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px', maxHeight: 600, overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {events.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        background: ev.type === 'alert' ? 'var(--danger)' : ev.type === 'check_in' ? 'var(--primary)' : '#64748b'
                      }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{ev.description}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(ev.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Shell>
  )
}
