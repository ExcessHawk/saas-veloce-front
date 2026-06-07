import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { consumeAuthHandoff } from '@/lib/authHandoff'

// If we arrived via a cross-subdomain login handoff, hydrate the session from
// the URL fragment (and strip it) before anything renders or hits the API.
consumeAuthHandoff()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
