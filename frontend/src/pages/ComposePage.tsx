import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface SMTPConfig { id: string; name: string; host: string; port: number; secure: boolean; isDefault: boolean }
interface Contact { Email: string; FirstName?: string; LastName?: string; Company?: string; [key: string]: any }
interface FormErrors {
  configId?: string; subject?: string; htmlContent?: string
  excelFile?: string; scheduledTime?: string; batchSize?: string
  emailDelay?: string; batchDelay?: string; delay?: string
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ComposePage() {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState<SMTPConfig[]>([])
  const [configsLoading, setConfigsLoading] = useState(true)
  const [selectedConfig, setSelectedConfig] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [totalContacts, setTotalContacts] = useState(0)
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeCount, setRangeCount] = useState(0)
  const [parsedPreview, setParsedPreview] = useState<Contact[]>([])
  const [mode, setMode] = useState<'immediate' | 'batch' | 'scheduled'>('immediate')
  const [delay, setDelay] = useState(20)
  const [batchSize, setBatchSize] = useState(20)
  const [batchDelay, setBatchDelay] = useState(60)
  const [emailDelay, setEmailDelay] = useState(45)
  const [scheduledTime, setScheduledTime] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [providerInfo, setProviderInfo] = useState<any>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const excelInputRef = useRef<HTMLInputElement>(null)
  const htmlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadConfigs() }, [])

  async function loadConfigs() {
    setConfigsLoading(true)
    try {
      const res = await axios.get('/config/smtp', { withCredentials: true })
      if (res.data.success) {
        const cfgs = res.data.userConfigs || []
        setConfigs(cfgs)
        const def = cfgs.find((c: SMTPConfig) => c.isDefault)
        if (def) { setSelectedConfig(def.id); fetchProviderInfo(def.host) }
        else if (cfgs.length > 0) { setSelectedConfig(cfgs[0].id); fetchProviderInfo(cfgs[0].host) }
      }
    } catch { toast.error('Failed to load SMTP configurations') }
    setConfigsLoading(false)
  }

  async function fetchProviderInfo(host: string) {
    try {
      const fd = new FormData()
      fd.append('smtpHost', host)
      fd.append('hasNotification', notifyEmail ? 'true' : 'false')
      const res = await axios.post('/provider-info', fd, { withCredentials: true })
      if (res.data.success) setProviderInfo(res.data.data)
    } catch { /* silent */ }
  }

  function handleConfigChange(id: string) {
    setSelectedConfig(id)
    clearError('configId')
    const cfg = configs.find(c => c.id === id)
    if (cfg) fetchProviderInfo(cfg.host)
  }

  function clearError(field: string) {
    setErrors(prev => { const n = { ...prev }; delete n[field as keyof FormErrors]; return n })
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!selectedConfig) errs.configId = 'Please select an SMTP configuration'
    if (!excelFile) errs.excelFile = 'Contact list (Excel file) is required'
    if (!subject.trim()) errs.subject = 'Email subject is required'
    else if (subject.trim().length < 3) errs.subject = 'Subject must be at least 3 characters'
    if (!htmlContent.trim() && !htmlFile) errs.htmlContent = 'Email content is required — write HTML or upload a template'
    if (mode === 'scheduled') {
      if (!scheduledTime) errs.scheduledTime = 'Please select a scheduled date and time'
      else if (new Date(scheduledTime) <= new Date()) errs.scheduledTime = 'Scheduled time must be in the future'
    }
    if (mode === 'batch') {
      if (!batchSize || batchSize < 1) errs.batchSize = 'Batch size must be at least 1'
      if (!emailDelay || emailDelay < 1) errs.emailDelay = 'Email delay must be at least 1 second'
      if (!batchDelay || batchDelay < 1) errs.batchDelay = 'Batch delay must be at least 1 minute'
    }
    if (mode === 'immediate') {
      if (!delay || delay < 1) errs.delay = 'Delay must be at least 1 second'
    }
    if (notifyEmail && !validateEmail(notifyEmail)) {
      toast.error('Notification email address is invalid')
    }
    return errs
  }

  async function handleExcelFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }
    setExcelFile(file)
    clearError('excelFile')
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('excelFile', file)
      const res = await axios.post('/parse-excel', fd, { withCredentials: true })
      if (res.data.success) {
        setParsedPreview(res.data.contacts || [])
        setTotalContacts(res.data.totalCount || 0)
        setRangeCount(res.data.totalCount || 0)
        toast.success(`✅ Loaded ${res.data.totalCount} contacts`)
      } else {
        toast.error(res.data.message || 'Failed to parse file')
        setExcelFile(null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse Excel file')
      setExcelFile(null)
    }
    setParsing(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleExcelFile(file)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const allTouched: Record<string, boolean> = {}
    ;['configId','subject','htmlContent','excelFile','scheduledTime','batchSize','emailDelay','batchDelay','delay'].forEach(k => allTouched[k] = true)
    setTouched(allTouched)
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before sending')
      return
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('configId', selectedConfig)
      fd.append('subject', subject.trim())
      fd.append('htmlContent', htmlContent)
      fd.append('delay', String(delay))
      fd.append('excelFile', excelFile!)
      if (htmlFile) fd.append('htmlTemplate', htmlFile)
      if (rangeStart > 0) fd.append('emailRangeStart', String(rangeStart))
      if (rangeCount > 0 && rangeCount < totalContacts) fd.append('emailRangeCount', String(rangeCount))
      if (notifyEmail.trim()) fd.append('notifyEmail', notifyEmail.trim())
      if (mode === 'batch') {
        fd.append('useBatch', 'on')
        fd.append('batchSize', String(batchSize))
        fd.append('batchDelay', String(batchDelay))
        fd.append('emailDelay', String(emailDelay))
      }
      if (mode === 'scheduled') {
        fd.append('scheduleEmail', 'on')
        fd.append('scheduledTime', new Date(scheduledTime).toISOString())
      }
      const res = await axios.post('/send', fd, { withCredentials: true })
      if (res.data.success) {
        toast.success(res.data.message || '🚀 Campaign started successfully!')
        setSubject(''); setHtmlContent(''); setHtmlFile(null)
        setExcelFile(null); setParsedPreview([]); setTotalContacts(0)
        setScheduledTime(''); setNotifyEmail(''); setErrors({}); setTouched({})
        if (mode === 'batch' || mode === 'immediate') navigate('/')
      } else {
        toast.error(res.data.message || 'Failed to send campaign')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send campaign'
      toast.error(msg)
    }
    setSending(false)
  }

  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)
  const effectiveCount = rangeCount > 0 && rangeCount < totalContacts ? rangeCount : totalContacts
  const selectedCfg = configs.find(c => c.id === selectedConfig)

  function FieldError({ field }: { field: keyof FormErrors }) {
    if (!touched[field] || !errors[field]) return null
    return <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors[field]}</div>
  }

  return (
    <div>
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h2>✉️ Compose & Send</h2>
          <p>Create and send bulk email campaigns</p>
        </div>
      </div>

      {configs.length === 0 && !configsLoading && (
        <div className="alert alert-warning mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚠️ No SMTP configuration found.</span>
          <button className="btn btn-outline-warning btn-sm" onClick={() => navigate('/config')}>
            Add SMTP Config →
          </button>
        </div>
      )}

      <form onSubmit={handleSend} noValidate>
        <div className="row">
         
          <div className="col-md-8">

       
            <div className="card mb-4">
              <div className="card-header">⚙️ SMTP Configuration</div>
              <div className="card-body">
                {configsLoading ? (
                  <div className="d-flex align-center gap-2 text-muted"><span className="spinner spinner-sm"></span> Loading configs...</div>
                ) : configs.length === 0 ? (
                  <div className="d-flex align-center gap-3">
                    <span className="text-dim fs-sm">No configurations available.</span>
                    <button type="button" className="btn btn-gradient btn-sm" onClick={() => navigate('/config')}>+ Add SMTP Config</button>
                  </div>
                ) : (
                  <div className="row">
                    <div className={providerInfo ? 'col-md-7' : 'col-md-12'}>
                      <div className="form-group mb-0">
                        <label className="form-label">Select Account *</label>
                        <select
                          className={`form-select ${touched.configId && errors.configId ? 'input-error' : ''}`}
                          value={selectedConfig}
                          onChange={e => handleConfigChange(e.target.value)}
                          onBlur={() => setTouched(p => ({ ...p, configId: true }))}
                        >
                          <option value="">— Choose SMTP configuration —</option>
                          {configs.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.isDefault ? '★ Default' : ''}
                            </option>
                          ))}
                        </select>
                        <FieldError field="configId" />
                      </div>
                    </div>
                    {providerInfo && (
                      <div className="col-md-5">
                        <div className="form-group mb-0">
                          <label className="form-label">Provider Info</label>
                          <div className="alert alert-info" style={{ padding: '8px 12px', margin: 0 }}>
                            <div className="fw-600 fs-sm">📡 {providerInfo.provider}</div>
                            <div className="fs-xs mt-1">Daily limit: {providerInfo.dailyLimit?.toLocaleString()}</div>
                            <div className="fs-xs">Max contacts: {providerInfo.maxContacts}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

         
            <div className="card mb-4">
              <div className="card-header">📋 Contact List</div>
              <div className="card-body">
                <div
                  className={`file-drop ${dragOver ? 'drag-over' : ''} ${touched.excelFile && errors.excelFile ? 'file-drop-error' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => excelInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && excelInputRef.current?.click()}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleExcelFile(e.target.files[0]); e.target.value = '' }}
                  />
                  {parsing ? (
                    <div className="text-center">
                      <span className="spinner" style={{ width: 28, height: 28 }}></span>
                      <p className="mt-2 text-muted fs-sm">Parsing contacts...</p>
                    </div>
                  ) : excelFile ? (
                    <div className="text-center">
                      <div className="drop-icon">📊</div>
                      <div className="fw-600">{excelFile.name}</div>
                      <div className="fs-sm text-muted mt-1">
                        <span className="badge badge-success">{totalContacts} contacts loaded</span>
                      </div>
                      <div className="fs-xs text-dim mt-2">Click to replace file</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="drop-icon">📂</div>
                      <div className="fw-600">Drop Excel file here or click to browse</div>
                      <div className="fs-sm text-dim mt-1">Supports .xlsx, .xls, .csv</div>
                      <div className="fs-xs text-dim mt-1">Required column: <strong>Email</strong> &nbsp;|&nbsp; Optional: FirstName, LastName, Company</div>
                    </div>
                  )}
                </div>
                {touched.excelFile && errors.excelFile && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 6 }}>⚠ {errors.excelFile}</div>
                )}

                {totalContacts > 0 && (
                  <div className="mt-3">
                    <div className="section-title">Email Range (optional — leave 0 for all)</div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-0">
                          <label className="form-label">Start From (row index, 0 = first)</label>
                          <input type="number" className="form-control" min={0} max={totalContacts - 1}
                            value={rangeStart} onChange={e => setRangeStart(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-0">
                          <label className="form-label">Count (0 = all remaining)</label>
                          <input type="number" className="form-control" min={0} max={totalContacts}
                            value={rangeCount} onChange={e => setRangeCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </div>
                    </div>
                    <div className="fs-xs text-dim mt-2">
                      Will send to: <strong style={{ color: 'var(--primary-light)' }}>{effectiveCount} contacts</strong>
                      {rangeStart > 0 && ` (starting from row ${rangeStart + 1})`}
                    </div>
                  </div>
                )}

                {parsedPreview.length > 0 && (
                  <div className="mt-3">
                    <div className="section-title">Preview (first {parsedPreview.length} contacts)</div>
                    <div className="table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>#</th><th>Email</th><th>First Name</th><th>Last Name</th><th>Company</th></tr>
                        </thead>
                        <tbody>
                          {parsedPreview.map((c, i) => (
                            <tr key={i}>
                              <td className="text-dim fs-xs">{i + 1}</td>
                              <td className="mono" style={{ fontSize: '0.8rem' }}>{c.Email}</td>
                              <td>{c.FirstName || '—'}</td>
                              <td>{c.LastName || '—'}</td>
                              <td>{c.Company || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

       
            <div className="card mb-4">
              <div className="card-header">
                📝 Email Content
                <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}
                  onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? '✏️ Edit' : '👁️ Preview'}
                </button>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Subject Line *</label>
                  <input
                    type="text"
                    className={`form-control ${touched.subject && errors.subject ? 'input-error' : ''}`}
                    placeholder="e.g., Hello {{FirstName}}, Special offer inside!"
                    value={subject}
                    onChange={e => { setSubject(e.target.value); clearError('subject') }}
                    onBlur={() => setTouched(p => ({ ...p, subject: true }))}
                  />
                  <FieldError field="subject" />
                  <div className="fs-xs text-dim mt-1">
                    Variables: <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>{'{{FirstName}}'}</code>{' '}
                    <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>{'{{LastName}}'}</code>{' '}
                    <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>{'{{Company}}'}</code>{' '}
                    <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>{'{{Email}}'}</code>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">HTML Content {!htmlFile && '*'}</label>
                  {showPreview ? (
                    <div style={{
                      minHeight: 220, background: '#fff', borderRadius: 8, padding: 16,
                      border: '1px solid var(--border)', color: '#333', overflowY: 'auto'
                    }}
                      dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color:#999;font-family:sans-serif">No content yet — switch to Edit mode</p>' }}
                    />
                  ) : (
                    <textarea
                      className={`form-control ${touched.htmlContent && errors.htmlContent && !htmlFile ? 'input-error' : ''}`}
                      style={{ minHeight: 220, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '0.8rem', lineHeight: 1.6 }}
                      placeholder={`<h2>Hello {{FirstName}},</h2>\n<p>We have an exciting offer for you at {{Company}}.</p>\n<p>Best regards,<br>Your Team</p>`}
                      value={htmlContent}
                      onChange={e => { setHtmlContent(e.target.value); clearError('htmlContent') }}
                      onBlur={() => setTouched(p => ({ ...p, htmlContent: true }))}
                    />
                  )}
                  {!htmlFile && <FieldError field="htmlContent" />}
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Or Upload HTML Template File</label>
                  <div className="d-flex align-center gap-2 flex-wrap">
                    <input ref={htmlInputRef} type="file" accept=".html,.htm" style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) { setHtmlFile(f); clearError('htmlContent'); toast.success(`Template: ${f.name}`) }
                        e.target.value = ''
                      }}
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => htmlInputRef.current?.click()}>
                      📄 {htmlFile ? htmlFile.name : 'Choose HTML file'}
                    </button>
                    {htmlFile && (
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setHtmlFile(null)}>
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  {htmlFile && <div className="fs-xs text-muted mt-1">✅ Template file will override the HTML editor above</div>}
                  <div className="fs-xs text-dim mt-1">Upload a .html file as your email template</div>
                </div>
              </div>
            </div>

          </div>
         
          <div className="col-md-4">

     
            <div className="card mb-4">
              <div className="card-header">🚀 Send Mode</div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'immediate', icon: '⚡', label: 'Immediate', desc: 'Send all emails now' },
                    { value: 'batch', icon: '📦', label: 'Batch', desc: 'Send in groups with delays' },
                    { value: 'scheduled', icon: '🗓️', label: 'Scheduled', desc: 'Send at a specific time' },
                  ] as const).map(m => (
                    <label key={m.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${mode === m.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: mode === m.value ? 'var(--primary-bg)' : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="mode" value={m.value} checked={mode === m.value}
                        onChange={() => { setMode(m.value); setErrors({}); setTouched({}) }}
                        style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                      <div>
                        <div className="fw-600 fs-sm">{m.label}</div>
                        <div className="fs-xs text-dim">{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {mode === 'immediate' && (
              <div className="card mb-4">
                <div className="card-header">⚡ Immediate Settings</div>
                <div className="card-body">
                  <div className="form-group mb-0">
                    <label className="form-label">Delay Between Emails (seconds) *</label>
                    <input type="number" className={`form-control ${touched.delay && errors.delay ? 'input-error' : ''}`}
                      min={1} max={300} value={delay}
                      onChange={e => { setDelay(parseInt(e.target.value) || 1); clearError('delay') }}
                      onBlur={() => setTouched(p => ({ ...p, delay: true }))} />
                    <FieldError field="delay" />
                    <div className="fs-xs text-dim mt-1">Recommended: 20–45 seconds to avoid spam filters</div>
                  </div>
                </div>
              </div>
            )}

          
            {mode === 'batch' && (
              <div className="card mb-4">
                <div className="card-header">📦 Batch Settings</div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Emails Per Batch *</label>
                    <input type="number" className={`form-control ${touched.batchSize && errors.batchSize ? 'input-error' : ''}`}
                      min={1} max={500} value={batchSize}
                      onChange={e => { setBatchSize(parseInt(e.target.value) || 1); clearError('batchSize') }}
                      onBlur={() => setTouched(p => ({ ...p, batchSize: true }))} />
                    <FieldError field="batchSize" />
                    {providerInfo && <div className="fs-xs text-dim mt-1">Recommended: {providerInfo.recommendedBatchSize}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delay Between Emails (seconds) *</label>
                    <input type="number" className={`form-control ${touched.emailDelay && errors.emailDelay ? 'input-error' : ''}`}
                      min={1} value={emailDelay}
                      onChange={e => { setEmailDelay(parseInt(e.target.value) || 1); clearError('emailDelay') }}
                      onBlur={() => setTouched(p => ({ ...p, emailDelay: true }))} />
                    <FieldError field="emailDelay" />
                    {providerInfo && <div className="fs-xs text-dim mt-1">Recommended: {providerInfo.recommendedDelay}s</div>}
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Delay Between Batches (minutes) *</label>
                    <input type="number" className={`form-control ${touched.batchDelay && errors.batchDelay ? 'input-error' : ''}`}
                      min={1} value={batchDelay}
                      onChange={e => { setBatchDelay(parseInt(e.target.value) || 1); clearError('batchDelay') }}
                      onBlur={() => setTouched(p => ({ ...p, batchDelay: true }))} />
                    <FieldError field="batchDelay" />
                  </div>
                </div>
              </div>
            )}

        
            {mode === 'scheduled' && (
              <div className="card mb-4">
                <div className="card-header">🗓️ Schedule Settings</div>
                <div className="card-body">
                  <div className="form-group mb-0">
                    <label className="form-label">Send At *</label>
                    <input type="datetime-local" className={`form-control ${touched.scheduledTime && errors.scheduledTime ? 'input-error' : ''}`}
                      min={minDateTime} value={scheduledTime}
                      onChange={e => { setScheduledTime(e.target.value); clearError('scheduledTime') }}
                      onBlur={() => setTouched(p => ({ ...p, scheduledTime: true }))} />
                    <FieldError field="scheduledTime" />
                    <div className="fs-xs text-dim mt-1">Must be at least 1 minute in the future</div>
                  </div>
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="card-header">🔔 Completion Notification</div>
              <div className="card-body">
                <div className="form-group mb-0">
                  <label className="form-label">Notify Email (optional)</label>
                  <input type="email" className="form-control" placeholder="notify@example.com"
                    value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} />
                  <div className="fs-xs text-dim mt-1">Receive an email when the campaign finishes</div>
                </div>
              </div>
            </div>

        
            <div className="card">
              <div className="card-header">📋 Campaign Summary</div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <SummaryRow label="SMTP Config" value={selectedCfg?.name || <span className="text-danger">Not selected</span>} />
                  <SummaryRow label="Contacts" value={effectiveCount > 0 ? `${effectiveCount.toLocaleString()} recipients` : <span className="text-danger">No file uploaded</span>} />
                  <SummaryRow label="Subject" value={subject.trim() || <span className="text-danger">Not set</span>} />
                  <SummaryRow label="Content" value={htmlFile ? `📄 ${htmlFile.name}` : htmlContent.trim() ? '✅ HTML editor' : <span className="text-danger">Not set</span>} />
                  <SummaryRow label="Mode" value={
                    mode === 'immediate' ? `⚡ Immediate (${delay}s delay)` :
                    mode === 'batch' ? `📦 Batch (${batchSize}/batch, ${emailDelay}s, ${batchDelay}min)` :
                    scheduledTime ? `🗓️ ${new Date(scheduledTime).toLocaleString()}` : <span className="text-danger">Time not set</span>
                  } />
                  {notifyEmail && <SummaryRow label="Notify" value={notifyEmail} />}
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="alert alert-danger mb-3" style={{ fontSize: '0.8rem' }}>
                    ⚠️ Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} above before sending
                  </div>
                )}

                <button type="submit" className="btn btn-gradient btn-block btn-lg"
                  disabled={sending || configs.length === 0}>
                  {sending ? (
                    <><span className="spinner spinner-sm"></span>&nbsp; Sending...</>
                  ) : mode === 'scheduled' ? '🗓️ Schedule Campaign'
                    : mode === 'batch' ? '📦 Start Batch Campaign'
                    : '🚀 Send Campaign Now'}
                </button>

                {configs.length === 0 && !configsLoading && (
                  <div className="fs-xs text-danger text-center mt-2">
                    Add an SMTP configuration first
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="d-flex justify-between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
      <span className="text-dim fs-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</span>
      <span className="fs-sm fw-600" style={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}
