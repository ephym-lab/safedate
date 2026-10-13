'use client'
import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-service'
import { DateSession, SessionEvent } from '@/lib/types'
import Shell from '@/components/Shell'
import { ArrowLeft, Clock, MapPin, Mic, MicOff, Upload } from 'lucide-react'

import { YamnetAudioDetector } from '@/lib/audio-detector'

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<DateSession | null>(null)
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [fakeCallSent, setFakeCallSent] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Audio Detection State
  const [micActive, setMicActive] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)
  const detectorRef = useRef<YamnetAudioDetector | null>(null)

  async function load() {
    try {
      const s = await api.getSession(id)
      setSession(s)
      setEvents(s.events || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [id])

  useEffect(() => {
    if (session?.isActive) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session?.isActive])

  useEffect(() => {
    if (!session?.isActive) return
    if (!('geolocation' in navigator)) return
    const wid = navigator.geolocation.watchPosition(
      pos => api.sendLocation(id, pos.coords.latitude, pos.coords.longitude).catch(() => {}),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    return () => navigator.geolocation.clearWatch(wid)
  }, [session?.isActive, id])

  useEffect(() => {
    return () => {
      if (detectorRef.current) detectorRef.current.stop()
    }
  }, [])

  const initDetector = () => {
    if (!detectorRef.current) {
      detectorRef.current = new YamnetAudioDetector((cls, conf, blob) => {
        api.soundAlert(id, cls, conf, blob).then(load).catch(console.error)
      })
    }
    return detectorRef.current
  }

  async function toggleMic() {
    try {
      const d = initDetector()
      if (micActive) {
        d.stop()
        setMicActive(false)
      } else {
        await d.start()
        setMicActive(true)
      }
    } catch (e) {
      alert('Could not start microphone')
      setMicActive(false)
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setProcessingFile(true)
    try {
      const d = initDetector()
      await d.processAudioFile(file)
      alert('File processing complete. Check event log for alerts.')
    } catch (err) {
      alert('Error processing file')
    } finally {
      setProcessingFile(false)
      e.target.value = ''
    }
  }

  async function endSession() { await api.updateSession(id, { isActive: false, status: 'completed' }); await load() }
  async function startSession() { await api.updateSession(id, { isActive: true, status: 'active' }); await load() }
  async function emergency() { await api.escalateSession(id, 'Emergency button pressed'); await load() }
  async function checkIn() { await api.checkIn(id) }
  async function fakeCall() { await api.scheduleFakeCall(id, 1); setFakeCallSent(true); setTimeout(() => setFakeCallSent(false), 60000) }
  async function simulateArrival() { await api.simulateArrival(id); await load() }
  async function deleteSession() { await api.deleteSession(id); router.push('/') }

  if (!session) return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading session…</div>
      </div>
    </Shell>
  )

  const statusColor: Record<string, string> = {
    active: 'var(--primary)', arrived: '#22c55e', completed: '#22c55e',
    escalated: 'var(--danger)', scheduled: 'var(--text-muted)', ended_early: 'var(--text-muted)',
  }
  const sColor = statusColor[session.status] || 'var(--text-muted)'

  return (
    <Shell>
      <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Hero */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {session.isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: sColor, display: 'inline-block', boxShadow: `0 0 0 3px ${sColor}30` }} />}
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: sColor }}>{session.status}</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}>{session.matchName}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{session.platform}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-dim)' }}><MapPin size={14} />{session.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-dim)' }}><Clock size={14} />{session.date} · {session.time}</span>
              </div>
            </div>
            {session.isActive && (
              <div style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 12, padding: '12px 20px', flexShrink: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{fmt(elapsed)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Elapsed</div>
              </div>
            )}
          </div>
        </div>

        {/* Emergency */}
        {session.isActive && session.status !== 'escalated' && (
          <button onClick={emergency} style={{
            width: '100%', padding: '18px', borderRadius: 'var(--radius)',
            background: 'var(--danger)', color: '#fff', fontWeight: 800, fontSize: 16,
            border: '2px solid #f87171', cursor: 'pointer', marginBottom: 16,
            boxShadow: '0 0 30px rgba(239,68,68,0.3)',
          }}>🚨 EMERGENCY — ALERT ALL CONTACTS</button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 16 }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>Controls</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!session.isActive ? (
                  <button onClick={startSession} style={{ padding: '12px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>▶ Start Live Session</button>
                ) : (
                  <>
                    <button onClick={checkIn} style={{ padding: '11px', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer' }}>📱 Send Check-In SMS</button>
                    <button onClick={fakeCall} disabled={fakeCallSent} style={{ padding: '11px', borderRadius: 10, background: 'var(--surface2)', color: fakeCallSent ? '#22c55e' : 'var(--text)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', cursor: fakeCallSent ? 'not-allowed' : 'pointer', opacity: fakeCallSent ? 0.7 : 1 }}>
                      {fakeCallSent ? '✓ Call Coming in ~1min' : '📞 Fake Call Bailout'}
                    </button>
                    {session.status !== 'arrived' && (
                      <button onClick={simulateArrival} style={{ padding: '11px', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer' }}>📍 Mark as Arrived</button>
                    )}
                    <button onClick={endSession} style={{ padding: '11px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600, fontSize: 13, border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}>✓ End Session</button>
                  </>
                )}
              </div>
            </div>

            {/* Audio Detection */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>Audio Detection</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {micActive ? <Mic color="var(--primary)" size={18} /> : <MicOff color="var(--text-muted)" size={18} />}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Live Mic</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time distress detection</div>
                    </div>
                  </div>
                  <button onClick={toggleMic} style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: micActive ? 'var(--primary)' : 'var(--border)',
                    position: 'relative', transition: '0.2s'
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2, left: micActive ? 22 : 2, transition: '0.2s'
                    }} />
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={processingFile} style={{
                    position: 'absolute', inset: 0, opacity: 0, cursor: processingFile ? 'not-allowed' : 'pointer'
                  }} />
                  <div style={{
                    padding: '12px', background: 'var(--surface2)', borderRadius: 10, border: '1px dashed var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text)',
                    fontSize: 13, fontWeight: 600, opacity: processingFile ? 0.6 : 1
                  }}>
                    <Upload size={16} />
                    {processingFile ? 'Processing File...' : 'Upload Audio File'}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            {(session.notes || session.duressWord) && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>Details</p>
                {session.notes && <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>{session.notes}</p>}
                {session.duressWord && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Duress Word</p>
                    <code style={{ fontSize: 13, background: 'var(--surface2)', padding: '4px 8px', borderRadius: 6, color: 'var(--primary)' }}>{session.duressWord}</code>
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' }}>
              {confirmDelete ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>Permanently delete this session?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)', border: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                    <button onClick={deleteSession} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger-dim)', cursor: 'pointer', fontSize: 13 }}>🗑 Delete Session</button>
              )}
            </div>
          </div>

          {/* Event log */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>Event Log</p>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No events yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                {[...events].reverse().map((ev, i) => {
                  const icons: Record<string, string> = { started: '🚀', check_in: '📱', ended: '✅', alert: '🚨' }
                  const colors: Record<string, string> = { alert: 'var(--danger)', ended: '#22c55e', check_in: 'var(--primary)', started: '#94a3b8' }
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{icons[ev.type] || '•'}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: colors[ev.type] || 'var(--text)' }}>{ev.description}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(ev.timestamp).toLocaleString()}</p>
                        {ev.data?.audioUrl && <a href={ev.data.audioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4, display: 'block' }}>🔊 Listen to audio clip</a>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
