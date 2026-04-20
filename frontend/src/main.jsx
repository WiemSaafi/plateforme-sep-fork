import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Suppress third-party library errors that don't affect functionality
const originalError = console.error
console.error = (...args) => {
  // Filter out known harmless errors from third-party libraries
  const message = args[0]
  if (
    typeof message === 'string' && 
    (message.includes('Math[N(...)] is not a function') ||
     message.includes('CloseDisplay.js') ||
     message.includes('niivue-info'))
  ) {
    return // Suppress these errors
  }
  originalError.apply(console, args)
}

// Global error handler to suppress TypeError from third-party libraries
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('Math[N(...)] is not a function') ||
    event.message.includes('Math[') ||
    (event.error && event.error.message && event.error.message.includes('Math['))
  )) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message && (
      event.reason.message.includes('Math[N(...)] is not a function') ||
      event.reason.message.includes('Math[')
    ) ||
    (event.reason.stack && event.reason.stack.includes('CloseDisplay.js'))
  )) {
    event.preventDefault()
    return false
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)