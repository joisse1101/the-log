import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test } from 'vitest'
import AppShell from './AppShell'

test('renders the title "The Log" and the placeholder line with createRoot', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)

  try {
    await act(async () => {
      root.render(<AppShell />)
    })

    expect(container.querySelector('h1')?.textContent).toBe('The Log')
    expect(container.querySelector('p')?.textContent).toBe('Your log will appear here.')
  } finally {
    await act(async () => {
      root.unmount()
    })
  }
})
