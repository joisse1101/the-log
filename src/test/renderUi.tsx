import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

export type Rendered = {
  container: HTMLElement
  rerender: (ui: ReactNode) => Promise<void>
  unmount: () => Promise<void>
}

/** Mounts a component into a detached element so a test can inspect the DOM it produced. */
export async function renderUi(ui: ReactNode): Promise<Rendered> {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(ui)
  })

  return {
    container,
    rerender: async (next) => {
      await act(async () => {
        root.render(next)
      })
    },
    unmount: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}
