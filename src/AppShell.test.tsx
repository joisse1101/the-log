import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import AppShell from './AppShell'

test('renders the title "The Log" and a placeholder line', () => {
  const container = document.createElement('div')
  container.innerHTML = renderToString(<AppShell />)

  expect(container.querySelector('h1')?.textContent).toBe('The Log')
  expect(container.querySelector('p')?.textContent).toBeTruthy()
})
