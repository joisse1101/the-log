import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-400-italic.css'
import '@fontsource/newsreader/latin-600.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-400-italic.css'
import '@fontsource/dm-sans/latin-600.css'
import './styles/tokens.css'
import './styles/global.css'
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
