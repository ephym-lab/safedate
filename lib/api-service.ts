import { DateSession, EmergencyContact, AppSettings, SessionEvent } from './types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

async function apiFetch(path: string, options?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${API}${path}`, { ...options, signal: controller.signal })
    if (!res.ok && res.status !== 204) throw new Error(`API error ${res.status}: ${path}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  // Sessions
  getSessions: async (): Promise<DateSession[]> => {
    const res = await apiFetch('/sessions')
    return res.json()
  },
  getSession: async (id: string): Promise<DateSession> => {
    const res = await apiFetch(`/sessions/${id}`)
    return res.json()
  },
  createSession: async (data: Omit<DateSession, 'id' | 'createdAt' | 'status' | 'startTime' | 'endTime' | 'isActive' | 'events'>): Promise<DateSession> => {
    const res = await apiFetch('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  updateSession: async (id: string, data: Partial<{ isActive: boolean; status: string }>): Promise<DateSession> => {
    const res = await apiFetch(`/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  deleteSession: async (id: string): Promise<void> => {
    await apiFetch(`/sessions/${id}`, { method: 'DELETE' })
  },
  escalateSession: async (id: string, reason: string): Promise<void> => {
    await apiFetch(`/sessions/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
  },
  checkIn: async (id: string): Promise<void> => {
    await apiFetch(`/sessions/${id}/check-in`, { method: 'POST' })
  },
  scheduleFakeCall: async (id: string, delayMinutes = 1): Promise<void> => {
    await apiFetch(`/sessions/${id}/fake-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delayMinutes }),
    })
  },
  simulateArrival: async (id: string): Promise<void> => {
    await apiFetch(`/sessions/${id}/simulate-arrival`, { method: 'POST' })
  },
  sendLocation: async (id: string, lat: number, lng: number): Promise<void> => {
    await apiFetch(`/sessions/${id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
  },
  soundAlert: async (id: string, detectedClass: string, confidence: number, audioBlob?: Blob): Promise<void> => {
    const form = new FormData()
    form.append('detected_class', detectedClass)
    form.append('confidence', confidence.toString())
    if (audioBlob) form.append('audio', audioBlob, 'distress.webm')
    await apiFetch(`/sessions/${id}/sound-alert`, { method: 'POST', body: form })
  },

  // Contacts
  getContacts: async (): Promise<EmergencyContact[]> => {
    const res = await apiFetch('/contacts')
    return res.json()
  },
  addContact: async (data: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> => {
    const res = await apiFetch('/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  updateContact: async (id: string, data: Partial<EmergencyContact>): Promise<EmergencyContact> => {
    const res = await apiFetch(`/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  deleteContact: async (id: string): Promise<void> => {
    await apiFetch(`/contacts/${id}`, { method: 'DELETE' })
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await apiFetch('/settings')
    return res.json()
  },
  updateDuressWord: async (word: string): Promise<void> => {
    await apiFetch('/settings/duress-word', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duressWord: word }),
    })
  },
  updateUserPhone: async (phone: string): Promise<void> => {
    await apiFetch('/settings/user-phone', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPhone: phone }),
    })
  },

  // Events
  getEvents: async (sessionId?: string): Promise<SessionEvent[]> => {
    const qs = sessionId ? `?session_id=${sessionId}` : ''
    const res = await apiFetch(`/events${qs}`)
    return res.json()
  },
  getAlerts: async (): Promise<SessionEvent[]> => {
    const res = await apiFetch('/events?type=alert')
    return res.json()
  },
}
