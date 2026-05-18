import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Stats { total: number; sent: number; failed: number; errors: number }
interface BatchJob {
  id: string; totalContacts: number; emailsSent: number; emailsFailed: number
  status: string; currentBatch: number; totalBatches: number; nextBatchTime?: string
}
interface BatchStatus { isRunning: boolean; currentJob: BatchJob | null; totalJobs: number; completedJobs: number }

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, errors: 0 })
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [reportRes, batchRes, schedRes] = await Promise.all([
        axios.get('/report', { withCredentials: true }),
        axios.get('/batch-status', { withCredentials: true }),
        axios.get('/scheduled-jobs', { withCredentials: true }),
      ])
      if (reportRes.data.success) setStats(reportRes.data.data.stats)
      if (batchRes.data.success) setBatchStatus(batchRes.data.data)
      if (schedRes.data.success) setScheduledJobs(schedRes.data.data || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  async function pauseBatch() {
    try { await axios.post('/batch-pause', {}, { withCredentials: true }); loadData() }
    catch { toast.error('Failed to pause') }
  }
  async function resumeBatch() {
    try { await axios.post('/batch-resume', {}, { withCredentials: true }); loadData() }
    catch { toast.error('Failed to resume') }
  }
  async function cancelBatch() {
    if (!confirm('Cancel the active batch job?')) return
    try { await axios.delete('/batch-cancel', { withCredentials: true }); loadData() }
    catch { toast.error('Failed to cancel') }
  }

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0
  const batchProgress = batchStatus?.currentJob
    ? Math.round((batchStatus.currentJob.emailsSent / batchStatus.currentJob.totalContacts) * 100)
    : 0

  const statCards = [
    { label: 'Total Sent', value: stats.total, icon: '📧', color: 'var(--primary-light)', bg: 'var(--primary-bg)' },
    { label: 'Delivered', value: stats.sent, icon: '✅', color: 'var(--success)', bg: 'var(--success-bg)' },
    { label: 'Failed', value: stats.failed, icon: '❌', color: 'var(--danger)', bg: 'var(--danger-bg)' },
    { label: 'Success Rate', value: `${successRate}%`, icon: '📊', color: 'var(--info)', bg: 'var(--info-bg)' },
  ]

  return (
    <div>
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your email campaigns</p>
        </div>
        <button className="btn btn-gradient" onClick={() => navigate('/compose')}>
          ✉️ New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="row mb-6">
        {statCards.map(card => (
          <div key={card.label} className="col-md-3 col-6">
            <div className="stat-card">
              <div className="d-flex justify-between align-center mb-2">
                <div className="stat-label">{card.label}</div>
                <div className="stat-icon" style={{ background: card.bg }}>
                  <span>{card.icon}</span>
                </div>
              </div>
              <div className="stat-value" style={{ color: card.color }}>
                {loading ? '—' : card.value}
              </div>
              {card.label === 'Success Rate' && (
                <div className="progress mt-2">
                  <div className="progress-bar" style={{ width: `${successRate}%` }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="row">
       
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              ⚡ Active Batch Job
              {batchStatus?.isRunning && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Running</span>}
            </div>
            <div className="card-body">
              {batchStatus?.isRunning && batchStatus.currentJob ? (
                <div>
                  <div className="d-flex justify-between mb-2">
                    <span className="text-muted fs-sm">Progress</span>
                    <span className="fw-600 fs-sm">
                      {batchStatus.currentJob.emailsSent} / {batchStatus.currentJob.totalContacts}
                    </span>
                  </div>
                  <div className="progress mb-4">
                    <div className="progress-bar" style={{ width: `${batchProgress}%` }}></div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <div style={{ background: 'var(--success-bg)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div className="fw-bold text-success">{batchStatus.currentJob.emailsSent}</div>
                        <div className="fs-xs text-dim">Sent</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: 'var(--danger-bg)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div className="fw-bold text-danger">{batchStatus.currentJob.emailsFailed}</div>
                        <div className="fs-xs text-dim">Failed</div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-warning btn-sm" onClick={pauseBatch}>⏸ Pause</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={cancelBatch}>⏹ Cancel</button>
                  </div>
                </div>
              ) : batchStatus?.currentJob?.status === 'Paused' ? (
                <div>
                  <div className="alert alert-warning mb-3">⏸ Batch job is paused</div>
                  <button className="btn btn-outline-success btn-sm" onClick={resumeBatch}>▶ Resume</button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h5>No active batch jobs</h5>
                  <p>Start a campaign to see progress here</p>
                  <button className="btn btn-gradient btn-sm mt-3" onClick={() => navigate('/compose')}>
                    Start Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

       
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              🗓️ Upcoming Scheduled Jobs
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/scheduled')}>
                View All
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {scheduledJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h5>No scheduled jobs</h5>
                  <p>Schedule a campaign from Compose</p>
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {scheduledJobs.slice(0, 5).map((job: any) => (
                    <div key={job.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div className="d-flex justify-between align-center">
                        <div>
                          <div className="fw-600 fs-sm">{job.subject || 'Email Campaign'}</div>
                          <div className="fs-xs text-dim mt-1">
                            {new Date(job.scheduled_time).toLocaleString()} · {job.contact_count} contacts
                          </div>
                        </div>
                        <span className={`badge ${job.status === 'running' ? 'badge-success' : 'badge-primary'}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      
        <div className="col-12">
          <div className="card">
            <div className="card-header">⚡ Quick Actions</div>
            <div className="card-body">
              <div className="row">
                {[
                  { icon: '✉️', label: 'New Campaign', path: '/compose', color: 'var(--primary)' },
                  { icon: '⚙️', label: 'SMTP Config', path: '/config', color: 'var(--success)' },
                  { icon: '📈', label: 'View Reports', path: '/reports', color: 'var(--info)' },
                  { icon: '🗓️', label: 'Scheduled Jobs', path: '/scheduled', color: 'var(--warning)' },
                ].map(action => (
                  <div key={action.path} className="col-md-3 col-6">
                    <button
                      className="btn btn-outline btn-block"
                      style={{ padding: '20px 12px', flexDirection: 'column', gap: 8, height: '100%' }}
                      onClick={() => navigate(action.path)}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                      <span style={{ color: action.color, fontWeight: 600 }}>{action.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
