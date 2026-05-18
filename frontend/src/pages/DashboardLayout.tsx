import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import DashboardPage from './DashboardPage'
import ComposePage from './ComposePage'
import ReportsPage from './ReportsPage'
import ConfigPage from './ConfigPage'
import ScheduledPage from './ScheduledPage'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
     
        <div className="topbar">

          <div className="d-flex align-center gap-3">
            <button
              className="topbar-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
            <span className="topbar-title">📧 Bulk Email Sender</span>
          </div>

         
          <div className="d-flex align-center gap-3 topbar-user-info">
            <div className="d-flex align-center gap-2">
              <div className="avatar">
                {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>

      
        <div className="page-content">
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/compose"   element={<ComposePage />} />
            <Route path="/reports"   element={<ReportsPage />} />
            <Route path="/config"    element={<ConfigPage />} />
            <Route path="/scheduled" element={<ScheduledPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
