import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SMTPConfig {
  id: string; name: string; host: string; port: number; secure: boolean
  user: string; fromEmail: string; fromName: string; isDefault: boolean; createdAt: string
}
interface FormErrors {
  name?: string; host?: string; port?: string; user?: string
  pass?: string; fromEmail?: string
}

const emptyForm = {
  name: '', host: '', port: 587, secure: false,
  user: '', pass: '', fromEmail: '', fromName: '', isDefault: false
}

const providerPresets = [
  { label: '📧 Gmail', host: 'smtp.gmail.com', port: 465, secure: true },
  { label: '📨 Outlook', host: 'smtp-mail.outlook.com', port: 587, secure: false },
  { label: '📬 Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  { label: '📮 SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
]

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<SMTPConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => { loadConfigs() }, [])

  async function loadConfigs() {
    setLoading(true)
    try {
      const res = await axios.get('/config/smtp', { withCredentials: true })
      if (res.data.success) setConfigs(res.data.userConfigs || [])
    } catch { toast.error('Failed to load configurations') }
    setLoading(false)
  }

  function openAdd() {
    setForm({ ...emptyForm }); setEditId(null)
    setErrors({}); setTouched({}); setShowPass(false); setShowForm(true)
  }

  function openEdit(cfg: SMTPConfig) {
    setForm({
      name: cfg.name, host: cfg.host, port: cfg.port, secure: cfg.secure,
      user: cfg.user, pass: '', fromEmail: cfg.fromEmail, fromName: cfg.fromName || '',
      isDefault: cfg.isDefault
    })
    setEditId(cfg.id); setErrors({}); setTouched({}); setShowPass(false); setShowForm(true)
  }

  function validate(isEdit: boolean): FormErrors {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Configuration name is required'
    if (!form.host.trim()) errs.host = 'SMTP host is required'
    else if (form.host.includes(' ')) errs.host = 'Host cannot contain spaces'
    if (!form.port || form.port < 1 || form.port > 65535) errs.port = 'Port must be between 1 and 65535'
    if (!form.user.trim()) errs.user = 'Username / email is required'
    else if (!validateEmail(form.user)) errs.user = 'Enter a valid email address'
    if (!isEdit && !form.pass.trim()) errs.pass = 'Password is required'
    else if (!isEdit && form.pass.length < 4) errs.pass = 'Password seems too short'
    if (!form.fromEmail.trim()) errs.fromEmail = 'From email is required'
    else if (!validateEmail(form.fromEmail)) errs.fromEmail = 'Enter a valid from email address'
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function touch(field: string) {
    setTouched(p => ({ ...p, [field]: true }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const allTouched: Record<string, boolean> = {}
    ;['name','host','port','user','pass','fromEmail'].forEach(k => allTouched[k] = true)
    setTouched(allTouched)
    const errs = validate(!!editId)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors in the form')
      return
    }
    setSaving(true)
    try {
      if (editId) {
        await axios.put(`/config/smtp/${editId}`, form, { withCredentials: true })
        toast.success('✅ Configuration updated!')
      } else {
        await axios.post('/config/smtp', form, { withCredentials: true })
        toast.success('✅ Configuration saved!')
      }
      setShowForm(false); loadConfigs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this SMTP configuration? This cannot be undone.')) return
    try {
      await axios.delete(`/config/smtp/${id}`, { withCredentials: true })
      toast.success('Configuration deleted')
      loadConfigs()
    } catch { toast.error('Failed to delete configuration') }
  }

  async function handleSetDefault(id: string) {
    try {
      await axios.post(`/config/smtp/${id}/default`, {}, { withCredentials: true })
      toast.success('Default configuration updated')
      loadConfigs()
    } catch { toast.error('Failed to set default') }
  }

  async function handleTest() {
    const errs = validate(!!editId)
    if (errs.host || errs.user || errs.pass) {
      toast.error('Fill in host, username, and password first')
      setErrors(errs)
      setTouched({ host: true, user: true, pass: true })
      return
    }
    setTesting(true)
    try {
      const res = await axios.post('/config/smtp/test', form, { withCredentials: true })
      if (res.data.success) toast.success('✅ SMTP connection successful!')
      else toast.error('❌ SMTP connection failed — check your credentials')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Connection test failed')
    }
    setTesting(false)
  }

  function FieldError({ field }: { field: keyof FormErrors }) {
    if (!touched[field] || !errors[field]) return null
    return <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors[field]}</div>
  }

  return (
    <div>
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h2>⚙️ SMTP Configurations</h2>
          <p>Manage your email sending accounts</p>
        </div>
        <button className="btn btn-gradient" onClick={openAdd}>＋ Add Configuration</button>
      </div>

     
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            {editId ? '✏️ Edit Configuration' : '➕ New SMTP Configuration'}
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <div className="card-body">
         
            <div className="mb-4">
              <div className="section-title">Quick Presets</div>
              <div className="d-flex gap-2 flex-wrap">
                {providerPresets.map(p => (
                  <button key={p.label} type="button" className="btn btn-outline btn-sm"
                    onClick={() => { setForm(f => ({ ...f, host: p.host, port: p.port, secure: p.secure })); clearError('host'); clearError('port') }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} noValidate>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Config Name *</label>
                    <input className={`form-control ${touched.name && errors.name ? 'input-error' : ''}`}
                      placeholder="e.g., My Gmail Account"
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); clearError('name') }}
                      onBlur={() => touch('name')} />
                    <FieldError field="name" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">SMTP Host *</label>
                    <input className={`form-control ${touched.host && errors.host ? 'input-error' : ''}`}
                      placeholder="smtp.gmail.com"
                      value={form.host}
                      onChange={e => { setForm(f => ({ ...f, host: e.target.value.trim() })); clearError('host') }}
                      onBlur={() => touch('host')} />
                    <FieldError field="host" />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label className="form-label">Port *</label>
                    <input type="number" className={`form-control ${touched.port && errors.port ? 'input-error' : ''}`}
                      value={form.port}
                      onChange={e => { setForm(f => ({ ...f, port: parseInt(e.target.value) || 587 })); clearError('port') }}
                      onBlur={() => touch('port')} />
                    <FieldError field="port" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Username (Email) *</label>
                    <input className={`form-control ${touched.user && errors.user ? 'input-error' : ''}`}
                      placeholder="your@email.com" type="email"
                      value={form.user}
                      onChange={e => { setForm(f => ({ ...f, user: e.target.value.trim() })); clearError('user') }}
                      onBlur={() => touch('user')} />
                    <FieldError field="user" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      Password {editId ? '' : '*'}{' '}
                      {editId && <span className="text-dim fs-xs">(leave blank to keep current)</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={showPass ? 'text' : 'password'}
                        className={`form-control ${touched.pass && errors.pass ? 'input-error' : ''}`}
                        placeholder={editId ? 'Leave blank to keep current' : 'App password or SMTP password'}
                        value={form.pass}
                        onChange={e => { setForm(f => ({ ...f, pass: e.target.value })); clearError('pass') }}
                        onBlur={() => touch('pass')} />
                      <button type="button" className="btn btn-outline" onClick={() => setShowPass(!showPass)}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <FieldError field="pass" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">From Email *</label>
                    <input type="email" className={`form-control ${touched.fromEmail && errors.fromEmail ? 'input-error' : ''}`}
                      placeholder="sender@example.com"
                      value={form.fromEmail}
                      onChange={e => { setForm(f => ({ ...f, fromEmail: e.target.value.trim() })); clearError('fromEmail') }}
                      onBlur={() => touch('fromEmail')} />
                    <FieldError field="fromEmail" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">From Name <span className="text-dim fs-xs">(optional)</span></label>
                    <input className="form-control" placeholder="Your Name or Company"
                      value={form.fromName}
                      onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} />
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex gap-4 flex-wrap">
                    <label className="form-check">
                      <input type="checkbox" className="form-check-input" checked={form.secure}
                        onChange={e => setForm(f => ({ ...f, secure: e.target.checked }))} />
                      <span className="form-check-label">Use SSL/TLS (port 465)</span>
                    </label>
                    <label className="form-check">
                      <input type="checkbox" className="form-check-input" checked={form.isDefault}
                        onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                      <span className="form-check-label">Set as default configuration</span>
                    </label>
                  </div>
                </div>
              </div>

              {form.host?.includes('gmail') && (
                <div className="alert alert-info mt-3">
                  <strong>📌 Gmail tip:</strong> You must use an <strong>App Password</strong>, not your regular Gmail password.
                  Enable 2-Factor Authentication first, then generate at{' '}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>
                    myaccount.google.com/apppasswords
                  </a>
                </div>
              )}
              {form.host?.includes('outlook') && (
                <div className="alert alert-info mt-3">
                  <strong>📌 Outlook tip:</strong> Use your regular Outlook password. Host: smtp-mail.outlook.com, Port: 587, TLS (no SSL).
                </div>
              )}

              <div className="d-flex gap-2 mt-4 flex-wrap">
                <button type="submit" className="btn btn-gradient" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm"></span>&nbsp; Saving...</> : '💾 Save Configuration'}
                </button>
                <button type="button" className="btn btn-outline-info" onClick={handleTest} disabled={testing}>
                  {testing ? <><span className="spinner spinner-sm"></span>&nbsp; Testing...</> : '🔌 Test Connection'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

   
      {loading ? (
        <div className="text-center py-5"><span className="spinner" style={{ width: 32, height: 32 }}></span></div>
      ) : configs.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">⚙️</div>
              <h5>No SMTP configurations yet</h5>
              <p>Add your first SMTP configuration to start sending emails</p>
              <button className="btn btn-gradient mt-3" onClick={openAdd}>＋ Add Configuration</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          {configs.map(cfg => (
            <div key={cfg.id} className="col-md-6">
              <div className={`config-card mb-3 ${cfg.isDefault ? 'is-default' : ''}`}>
                <div className="d-flex justify-between align-center mb-3">
                  <div>
                    <div className="fw-bold">{cfg.name}</div>
                    {cfg.isDefault && <span className="badge badge-success mt-1">⭐ Default</span>}
                  </div>
                  <div className="d-flex gap-1">
                    {!cfg.isDefault && (
                      <button className="btn btn-outline-success btn-sm" onClick={() => handleSetDefault(cfg.id)} title="Set as default">⭐</button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(cfg)} title="Edit">✏️</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(cfg.id)} title="Delete">🗑️</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div className="fs-sm text-muted">🖥️ <strong>{cfg.host}</strong>:{cfg.port} {cfg.secure ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>SSL</span> : <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>TLS</span>}</div>
                  <div className="fs-sm text-muted">👤 {cfg.user}</div>
                  <div className="fs-sm text-muted">📧 {cfg.fromEmail}{cfg.fromName && ` (${cfg.fromName})`}</div>
                  <div className="fs-xs text-dim">Added {new Date(cfg.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
