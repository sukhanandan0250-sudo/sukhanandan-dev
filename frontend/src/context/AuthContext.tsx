import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'


axios.defaults.withCredentials = true

interface User { id: string; email: string; name: string }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    try {
      const res = await axios.get('/auth/me')
      if (res.data.success) setUser(res.data.user)
      else setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await axios.post('/auth/login', { email, password })
      if (res.data.success) {
        setUser(res.data.user)
        return { success: true, message: 'Login successful' }
      }
      return { success: false, message: res.data.message || 'Login failed' }
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const res = await axios.post('/auth/register', { name, email, password })
      if (res.data.success) {
        setUser(res.data.user)
        return { success: true, message: 'Account created successfully' }
      }
      return { success: false, message: res.data.message || 'Registration failed' }
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    }
  }

  async function logout() {
    try { await axios.post('/auth/logout') } catch { /* silent */ }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
