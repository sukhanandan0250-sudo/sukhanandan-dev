import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ScheduledPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadJobs() {
    try {
      const res = await axios.get('/scheduled-jobs', { withCredentials: true })
      if (res.data.success) setJobs(res.data.data || [])
    } catch { toast.error('Failed to load scheduled jobs') }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this scheduled job?')) return
    try {
      await axios.delete(`/scheduled-jobs/${id}`, { withCredentials: true })
      toast.success('Job cancelled')
      loadJobs()
    } catch { toast.error('Failed to cancel job') }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: 'badge-primary',
      running: 'badge-success',
      completed: 'badge-muted',
      failed: 'badge-danger',
      cancelled: 'badge-warning',
    }
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>
  }

  return (
    <div>
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h2>🗓️ Scheduled Jobs</h2>
          <p>Manage your scheduled email campaigns</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadJobs}>
          🔄 Refresh
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          📋 Scheduled Campaigns ({jobs.length})
        </div>
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner" style={{ width: 32, height: 32 }}></span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h5>No scheduled jobs</h5>
              <p>Schedule a campaign from the Compose page</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Scheduled Time</th>
                  <th>Contacts</th>
                  <th>Mode</th>
                  <th>Config</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td className="fw-600">{job.subject || 'Email Campaign'}</td>
                    <td className="fs-sm" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(job.scheduled_time).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-muted">{job.contact_count}</span>
                    </td>
                    <td>
                      <span className={`badge ${job.use_batch ? 'badge-warning' : 'badge-info'}`}>
                        {job.use_batch ? 'Batch' : 'Bulk'}
                      </span>
                    </td>
                    <td className="fs-sm text-muted">{job.config_name || '—'}</td>
                    <td>{statusBadge(job.status)}</td>
                    <td>
                      {job.status === 'scheduled' && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleCancel(job.id)}
                        >
                          ✕ Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
