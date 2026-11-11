import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test } from 'vitest'
import AppShell from './AppShell'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Tell React that act() is in use, so it flushes client renders inside act.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

test('renders the title "The Log" and the placeholder line with createRoot', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(<AppShell />)
  })

  expect(container.querySelector('h1')?.textContent).toBe('The Log')
  expect(container.querySelector('p')?.textContent).toBe('Your log will appear here.')

  await act(async () => {
    root.unmount()
  })
})
