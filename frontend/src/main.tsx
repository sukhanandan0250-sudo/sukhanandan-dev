import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

if (apiUrl) {
  axios.defaults.baseURL = apiUrl
}

axios.defaults.withCredentials = true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
