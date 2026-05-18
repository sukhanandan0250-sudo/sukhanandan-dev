import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { path: '/',          icon: '📊', label: 'Dashboard'      },
  { path: '/compose',   icon: '✉️',  label: 'Compose & Send' },
  { path: '/reports',   icon: '📈', label: 'Reports'        },
  { path: '/config',    icon: '⚙️',  label: 'SMTP Config'   },
  { path: '/scheduled', icon: '🗓️', label: 'Scheduled Jobs' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  function handleNav(path: string) {
    navigate(path)
    onClose()
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
    
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>

    
        <div className="sidebar-brand">
          <div className="sidebar-logo">📧</div>
          <div>
            <div className="sidebar-brand-name">Email Sender</div>
            <div className="sidebar-brand-sub">Bulk Campaign Manager</div>
          </div>
        </div>

  
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

       
        <div className="sidebar-profile-wrap">
          <button
            className="sidebar-profile-btn"
            onClick={() => setProfileOpen(p => !p)}
            aria-expanded={profileOpen}
          >
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{user?.name || 'User'}</div>
              <div className="sidebar-profile-email">{user?.email || ''}</div>
            </div>
            <span className="sidebar-profile-chevron" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▾
            </span>
          </button>

         
          {profileOpen && (
            <div className="sidebar-profile-panel">
              
              <div className="spp-header">
                <div className="spp-avatar-lg">{initials}</div>
                <div className="spp-header-info">
                  <div className="spp-name">{user?.name}</div>
                  <div className="spp-email">{user?.email}</div>
                  <span className="spp-badge">✅ Active</span>
                </div>
              </div>

              <div className="spp-divider" />

              
              <div className="spp-rows">
                <div className="spp-row">
                  <span className="spp-row-icon">🆔</span>
                  <div>
                    <div className="spp-row-label">User ID</div>
                    <div className="spp-row-value spp-mono">{user?.id?.slice(0, 18)}…</div>
                  </div>
                </div>
                <div className="spp-row">
                  <span className="spp-row-icon">📧</span>
                  <div>
                    <div className="spp-row-label">Email</div>
                    <div className="spp-row-value">{user?.email}</div>
                  </div>
                </div>
                <div className="spp-row">
                  <span className="spp-row-icon">👤</span>
                  <div>
                    <div className="spp-row-label">Display Name</div>
                    <div className="spp-row-value">{user?.name}</div>
                  </div>
                </div>
                <div className="spp-row">
                  <span className="spp-row-icon">🔒</span>
                  <div>
                    <div className="spp-row-label">Security</div>
                    <div className="spp-row-value">Argon2 hashed</div>
                  </div>
                </div>
                <div className="spp-row">
                  <span className="spp-row-icon">⏱️</span>
                  <div>
                    <div className="spp-row-label">Session</div>
                    <div className="spp-row-value">24h expiry</div>
                  </div>
                </div>
              </div>

              <div className="spp-divider" />

              <div className="spp-actions">
                <button
                  className="spp-action-btn"
                  onClick={() => { handleNav('/config'); setProfileOpen(false) }}
                >
                  <span>⚙️</span> SMTP Settings
                </button>
                <button
                  className="spp-action-btn"
                  onClick={() => { handleNav('/reports'); setProfileOpen(false) }}
                >
                  <span>📈</span> My Reports
                </button>
                <button
                  className="spp-action-btn spp-logout"
                  onClick={() => { logout(); setProfileOpen(false) }}
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

    
        <div className="sidebar-footer">
          v2.0.0 · Node.js + React
        </div>
      </aside>
    </>
  )
}
