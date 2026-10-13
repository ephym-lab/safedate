// All types matching the backend models exactly

export interface DateSession {
  id: string
  matchName: string
  platform: string
  location: string
  date: string
  time: string
  notes: string
  isActive: boolean
  startTime: string | null
  endTime: string | null
  createdAt: string
  duressWord: string | null
  soundDetectionEnabled: boolean
  status: 'scheduled' | 'active' | 'arrived' | 'completed' | 'escalated' | 'ended_early'
  emergencyContacts: string[]
  events?: SessionEvent[]
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export interface SessionEvent {
  session_id: string
  timestamp: string
  type: 'started' | 'check_in' | 'ended' | 'alert'
  description: string
  data?: { audioUrl?: string } | null
}

export interface AppSettings {
  duressWord: string
  soundDetectionEnabled: boolean
  userPhone: string
}
