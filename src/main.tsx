import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppShell from './AppShell'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Cannot mount The Log: index.html has no element with id "root".')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
)
