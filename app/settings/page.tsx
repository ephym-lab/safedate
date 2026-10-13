'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api-service'
import { AppSettings, EmergencyContact } from '@/lib/types'
import Shell from '@/components/Shell'
import { Phone, Settings2, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])

  const [duressWord, setDuressWord] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' })
  const [addingContact, setAddingContact] = useState(false)

  async function load() {
    try {
      const [s, c] = await Promise.all([api.getSettings(), api.getContacts()])
      setSettings(s)
      setDuressWord(s.duressWord || '')
      setUserPhone(s.userPhone || '')
      setContacts(c)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await api.updateDuressWord(duressWord)
      await api.updateUserPhone(userPhone)
    } finally {
      setSavingSettings(false)
    }
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    if (!newContact.name || !newContact.phone) return
    setAddingContact(true)
    try {
      await api.addContact(newContact)
      setNewContact({ name: '', phone: '', relationship: '' })
      await load()
    } finally {
      setAddingContact(false)
    }
  }

  async function removeContact(id: string) {
    await api.deleteContact(id)
    await load()
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
      <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Settings2 size={22} color="var(--primary)" />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings & Contacts</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your trusted contacts and app preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 24 }}>
          {/* Contacts List */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Emergency Contacts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {contacts.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No contacts added yet.</p>
              ) : contacts.map(c => (
                <div key={c.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.phone} · {c.relationship}</div>
                  </div>
                  <button onClick={() => removeContact(c.id)} style={{
                    background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer',
                    padding: 8, borderRadius: 8
                  }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>Add Contact</h2>
            <form onSubmit={addContact} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input required style={inputStyle} value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input required type="tel" style={inputStyle} value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+254..." />
                </div>
                <div>
                  <label style={labelStyle}>Relationship</label>
                  <input style={inputStyle} value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })} placeholder="Friend, Sister..." />
                </div>
              </div>
              <button type="submit" disabled={addingContact} style={{
                padding: '12px', borderRadius: 8, background: 'var(--primary)', color: '#fff',
                fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 8
              }}>
                {addingContact ? 'Adding...' : 'Add Contact'}
              </button>
            </form>
          </div>

          {/* Settings */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>App Preferences</h2>
            <form onSubmit={saveSettings} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Default Duress Word</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Used across all sessions. If you reply to a check-in SMS with this word, SafeDate will trigger an emergency alert.</p>
                <input style={inputStyle} value={duressWord} onChange={e => setDuressWord(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Your Phone Number</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Where check-in SMS texts will be sent.</p>
                <input type="tel" style={inputStyle} value={userPhone} onChange={e => setUserPhone(e.target.value)} />
              </div>
              <button type="submit" disabled={savingSettings} style={{
                padding: '12px', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)',
                fontWeight: 600, fontSize: 14, border: '1px solid var(--border)', cursor: 'pointer'
              }}>
                {savingSettings ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  )
}
