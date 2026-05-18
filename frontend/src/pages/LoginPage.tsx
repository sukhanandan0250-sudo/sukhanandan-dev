import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface LoginErrors { email?: string; password?: string }
interface RegisterErrors { name?: string; email?: string; password?: string }

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({})
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({})

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regErrors, setRegErrors] = useState<RegisterErrors>({})
  const [regTouched, setRegTouched] = useState<Record<string, boolean>>({})

  function validateLogin(): LoginErrors {
    const errs: LoginErrors = {}
    if (!loginEmail.trim()) errs.email = 'Email is required'
    else if (!validateEmail(loginEmail)) errs.email = 'Enter a valid email address'
    if (!loginPassword) errs.password = 'Password is required'
    return errs
  }

  function validateRegister(): RegisterErrors {
    const errs: RegisterErrors = {}
    if (!regName.trim()) errs.name = 'Full name is required'
    else if (regName.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    if (!regEmail.trim()) errs.email = 'Email is required'
    else if (!validateEmail(regEmail)) errs.email = 'Enter a valid email address'
    if (!regPassword) errs.password = 'Password is required'
    else if (regPassword.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginTouched({ email: true, password: true })
    const errs = validateLogin()
    setLoginErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    const result = await login(loginEmail.trim(), loginPassword)
    setLoading(false)
    if (!result.success) toast.error(result.message)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegTouched({ name: true, email: true, password: true })
    const errs = validateRegister()
    setRegErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    const result = await register(regName.trim(), regEmail.trim(), regPassword)
    setLoading(false)
    if (!result.success) toast.error(result.message)
    else toast.success('🎉 Account created! Welcome aboard.')
  }

  function LoginFieldError({ field }: { field: keyof LoginErrors }) {
    if (!loginTouched[field] || !loginErrors[field]) return null
    return <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {loginErrors[field]}</div>
  }

  function RegFieldError({ field }: { field: keyof RegisterErrors }) {
    if (!regTouched[field] || !regErrors[field]) return null
    return <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {regErrors[field]}</div>
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-6">
          <div className="login-logo">📧</div>
          <div className="login-title">Email Sender</div>
          <div className="login-subtitle">Bulk campaign management platform</div>
        </div>

        <div className="tab-group">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setLoginErrors({}); setLoginTouched({}) }}>
            Sign In
          </button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setRegErrors({}); setRegTouched({}) }}>
            Sign Up
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${loginTouched.email && loginErrors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginErrors(p => ({ ...p, email: undefined })) }}
                onBlur={() => setLoginTouched(p => ({ ...p, email: true }))}
                autoFocus
                autoComplete="email"
              />
              <LoginFieldError field="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-control ${loginTouched.password && loginErrors.password ? 'input-error' : ''}`}
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginErrors(p => ({ ...p, password: undefined })) }}
                  onBlur={() => setLoginTouched(p => ({ ...p, password: true }))}
                  autoComplete="current-password"
                />
                <button type="button" className="btn btn-outline" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <LoginFieldError field="password" />
            </div>
            <button type="submit" className="btn btn-gradient btn-block btn-lg mt-4" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"></span>&nbsp; Signing in...</> : '→ Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`form-control ${regTouched.name && regErrors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
                value={regName}
                onChange={e => { setRegName(e.target.value); setRegErrors(p => ({ ...p, name: undefined })) }}
                onBlur={() => setRegTouched(p => ({ ...p, name: true }))}
                autoFocus
                autoComplete="name"
              />
              <RegFieldError field="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${regTouched.email && regErrors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({ ...p, email: undefined })) }}
                onBlur={() => setRegTouched(p => ({ ...p, email: true }))}
                autoComplete="email"
              />
              <RegFieldError field="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-control ${regTouched.password && regErrors.password ? 'input-error' : ''}`}
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({ ...p, password: undefined })) }}
                  onBlur={() => setRegTouched(p => ({ ...p, password: true }))}
                  autoComplete="new-password"
                />
                <button type="button" className="btn btn-outline" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <RegFieldError field="password" />
              {regPassword && regPassword.length >= 6 && (
                <div style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: 4 }}>✅ Password strength: Good</div>
              )}
            </div>
            <button type="submit" className="btn btn-gradient btn-block btn-lg mt-4" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"></span>&nbsp; Creating account...</> : '→ Create Account'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <span className="fs-xs text-dim">🔒 Secured with Argon2 password hashing</span>
        </div>
      </div>
    </div>
  )
}
