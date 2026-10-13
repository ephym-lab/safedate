'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api-service'
import { SessionEvent } from '@/lib/types'
import Shell from '@/components/Shell'
import { Bell, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SessionEvent[]>([])

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => {})
  }, [])

  return (
    <Shell>
      <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Bell size={22} color="var(--danger)" />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Security Alerts</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>History of all escalated sessions and emergencies</p>
        </div>

        {alerts.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', marginBottom: 16 }}>
              <Shield size={32} color="#22c55e" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>All clear!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              You haven't had any emergency alerts yet. Stay safe!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((ev, i) => (
              <div key={i} style={{
                background: 'var(--danger-dim)', border: '1px solid var(--danger)',
                borderRadius: 12, padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start'
              }}>
                <div style={{ background: 'var(--danger)', borderRadius: 8, padding: 8, color: '#fff', flexShrink: 0 }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {ev.description}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
                    {new Date(ev.timestamp).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link href={`/session/${ev.session_id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
                      View Session →
                    </Link>
                    {ev.data?.audioUrl && (
                      <a href={ev.data.audioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                        🔊 Listen to Clip
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shield({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
