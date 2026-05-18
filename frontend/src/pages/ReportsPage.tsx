import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface EmailLog {
  id: string; email: string; status: 'Sent' | 'Failed' | 'Error'
  message?: string; timestamp: string; firstName?: string; subject?: string
}
interface Stats { total: number; sent: number; failed: number; errors: number }

export default function ReportsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, errors: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadReport() }, [])

  async function loadReport() {
    setLoading(true)
    try {
      const res = await axios.get('/report', { withCredentials: true })
      if (res.data.success) {
        setLogs(res.data.data.logs || [])
        setStats(res.data.data.stats || { total: 0, sent: 0, failed: 0, errors: 0 })
      }
    } catch { toast.error('Failed to load report') }
    setLoading(false)
  }

  async function handleClear() {
    if (!confirm('Clear all email logs? This cannot be undone.')) return
    try {
      await axios.delete('/report/clear', { withCredentials: true })
      toast.success('Logs cleared')
      loadReport()
    } catch { toast.error('Failed to clear logs') }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filter ||
      log.email.toLowerCase().includes(filter.toLowerCase()) ||
      (log.subject || '').toLowerCase().includes(filter.toLowerCase()) ||
      (log.firstName || '').toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0

  const statusBadge = (status: string) => {
    if (status === 'Sent') return <span className="badge badge-success">Sent</span>
    if (status === 'Failed') return <span className="badge badge-danger">Failed</span>
    return <span className="badge badge-warning">Error</span>
  }

  return (
    <div>
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h2>📈 Reports & Analytics</h2>
          <p>Email delivery logs and statistics</p>
        </div>
        <div className="d-flex gap-2">
          <a href="/report/export/csv" target="_blank" className="btn btn-outline-success btn-sm">
            📊 CSV
          </a>
          <a href="/report/export/json" target="_blank" className="btn btn-outline-info btn-sm">
            📄 JSON
          </a>
          <button className="btn btn-outline-danger btn-sm" onClick={handleClear}>
            🗑️ Clear
          </button>
          <button className="btn btn-outline btn-sm" onClick={loadReport}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: 'Total Emails', value: stats.total, color: 'var(--text)' },
          { label: 'Delivered', value: stats.sent, color: 'var(--success)' },
          { label: 'Failed', value: stats.failed, color: 'var(--danger)' },
          { label: 'Success Rate', value: `${successRate}%`, color: 'var(--primary-light)' },
        ].map(s => (
          <div key={s.label} className="col-md-3 col-6">
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label mt-1">{s.label}</div>
              {s.label === 'Success Rate' && (
                <div className="progress mt-2">
                  <div className="progress-bar" style={{ width: `${successRate}%` }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

  
      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <input
                className="form-control"
                placeholder="🔍 Search by email, subject, or name..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Sent">Sent</option>
                <option value="Failed">Failed</option>
                <option value="Error">Error</option>
              </select>
            </div>
          </div>
        </div>
      </div>

    
      <div className="card">
        <div className="card-header">
          📋 Email Logs ({filteredLogs.length})
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner" style={{ width: 32, height: 32 }}></span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h5>No logs found</h5>
              <p>Send some emails to see delivery logs here</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{log.email}</td>
                    <td>{log.firstName || '—'}</td>
                    <td className="truncate" style={{ maxWidth: 180 }}>{log.subject || '—'}</td>
                    <td>{statusBadge(log.status)}</td>
                    <td className="fs-xs text-dim" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="fs-xs text-danger truncate" style={{ maxWidth: 180 }}>
                      {log.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
