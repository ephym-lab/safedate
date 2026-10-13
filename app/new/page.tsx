'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-service'
import { EmergencyContact } from '@/lib/types'
import Shell from '@/components/Shell'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function NewSessionPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    matchName: '', platform: '', location: '', date: '', time: '',
    notes: '', duressWord: '', emergencyContacts: [] as string[],
  })

  useEffect(() => { api.getContacts().then(setContacts).catch(() => {}) }, [])

  const field = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleContact = (id: string) =>
    setForm(f => ({
      ...f,
      emergencyContacts: f.emergencyContacts.includes(id)
        ? f.emergencyContacts.filter(c => c !== id)
        : [...f.emergencyContacts, id],
    }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.matchName || !form.date || !form.time || !form.location) return
    setSaving(true)
    try {
      const session = await api.createSession({
        ...form,
        soundDetectionEnabled: false,
      })
      router.push(`/session/${session.id}`)
    } catch {
      alert('Failed to create session. Is Flask running?')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--text-dim)', marginBottom: 6,
  }

  return (
    <Shell>
      <div style={{ padding: '28px 24px', maxWidth: 600, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>New Date Session</h1>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Match Name *</label>
            <input required style={inputStyle} value={form.matchName} placeholder="Who are you meeting?" onChange={e => field('matchName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Platform</label>
            <input style={inputStyle} value={form.platform} placeholder="Tinder, Bumble, Hinge..." onChange={e => field('platform', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input required type="date" style={inputStyle} value={form.date} onChange={e => field('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Time *</label>
              <input required type="time" style={inputStyle} value={form.time} onChange={e => field('time', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location *</label>
            <input required style={inputStyle} value={form.location} placeholder="Where is the date?" onChange={e => field('location', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Duress Word</label>
            <input style={inputStyle} value={form.duressWord} placeholder="Secret word to trigger emergency (e.g. butterfly)" onChange={e => field('duressWord', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.notes} placeholder="Any extra details..." onChange={e => field('notes', e.target.value)} />
          </div>

          {/* Emergency Contacts */}
          <div>
            <label style={labelStyle}>Emergency Contacts</label>
            {contacts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>
                No contacts yet. <Link href="/settings" style={{ color: 'var(--primary)' }}>Add contacts →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contacts.map(c => {
                  const selected = form.emergencyContacts.includes(c.id)
                  return (
                    <button key={c.id} type="button" onClick={() => toggleContact(c.id)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      background: selected ? 'var(--primary-dim)' : 'var(--surface2)',
                      border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      color: 'var(--text)', fontSize: 14, textAlign: 'left',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone} · {c.relationship}</div>
                      </div>
                      {selected && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} style={{
            padding: '14px', borderRadius: 10, background: saving ? 'var(--border)' : 'var(--primary)',
            color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
            border: 'none', marginTop: 4,
          }}>
            {saving ? 'Creating…' : '🛡️ Create Date Session'}
          </button>
        </form>
      </div>
    </Shell>
  )
}
