import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

// Clear any stale development service workers on localhost to prevent blank cached screens
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]')

if ('serviceWorker' in navigator) {
  if (isLocalhost || import.meta.env.DEV) {
    // Unregister development service workers and purge cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister()
      }
    })
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        for (const key of keys) caches.delete(key)
      })
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error)
      })
    })
  }
}

// Global Error Boundary to prevent any blank white screen
class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root application crash caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FBF7F0] text-[#14213D] font-sans">
          <div className="max-w-md w-full rounded-3xl border border-[#EAE2D3] bg-white p-8 text-center shadow-xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-[#E4572E] font-bold text-2xl">
              !
            </div>
            <h2 className="text-xl font-black text-[#14213D]">
              Gurukrupa Clinic App Encountered an Issue
            </h2>
            <p className="text-xs text-[#5B6475] leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload()
                }}
                className="w-full rounded-xl bg-[#E4572E] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#CC4820] cursor-pointer transition-all"
              >
                Reload Clinic Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
