'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Activity, Bell, Phone, Plus } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Overview', Icon: LayoutGrid },
  { href: '/activity', label: 'Activity', Icon: Activity },
  { href: '/alerts', label: 'Alerts', Icon: Bell },
  { href: '/settings', label: 'Contacts', Icon: Phone },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar (desktop) */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', padding: '28px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }} className="hidden-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🛡️</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>SafeDate</span>
        </div>
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10, fontWeight: 500, fontSize: 14,
              color: active ? 'var(--primary)' : 'var(--text-dim)',
              background: active ? 'var(--primary-dim)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <Link href="/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14,
            background: 'var(--primary)', color: '#fff',
          }}>
            <Plus size={16} /> New Date
          </Link>
        </div>
      </aside>

      {/* Page content */}
      <main style={{ flex: 1, minHeight: '100vh', overflowY: 'auto', paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch',
      }} className="mobile-only">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, padding: '10px 0',
              color: active ? 'var(--primary)' : 'var(--text-muted)', fontSize: 10, fontWeight: 600,
            }}>
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
        <Link href="/new" style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4, padding: '10px 0',
          color: 'var(--text-muted)', fontSize: 10, fontWeight: 600,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -8,
            boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
          }}>
            <Plus size={18} color="#fff" />
          </div>
          New
        </Link>
      </nav>

      <style>{`
        @media (min-width: 768px) { .hidden-mobile { display: flex !important; } .mobile-only { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } .mobile-only { display: flex !important; } }
      `}</style>
    </div>
  )
}
