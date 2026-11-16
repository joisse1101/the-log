import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { renderUi } from '../../test/renderUi'
import Modal from './Modal'

test('opens the dialog and shows its title when open is true', async () => {
  const { container, unmount } = await renderUi(
    <Modal open onClose={() => {}} title="Delete entry">
      This cannot be undone.
    </Modal>,
  )

  const dialog = container.querySelector('dialog')
  expect(dialog?.open).toBe(true)
  expect(dialog?.querySelector('h2')?.textContent).toBe('Delete entry')
  expect(dialog?.getAttribute('aria-labelledby')).toBe(dialog?.querySelector('h2')?.id)

  await unmount()
})

test('renders no content and keeps the dialog shut when open is false', async () => {
  const { container, unmount } = await renderUi(
    <Modal open={false} onClose={() => {}} title="Delete entry">
      This cannot be undone.
    </Modal>,
  )

  const dialog = container.querySelector('dialog')
  expect(dialog?.open).toBe(false)
  expect(dialog?.textContent).toBe('')

  await unmount()
})

test('closes the dialog when open turns false', async () => {
  const { container, rerender, unmount } = await renderUi(
    <Modal open onClose={() => {}} title="T" />,
  )
  await rerender(<Modal open={false} onClose={() => {}} title="T" />)

  expect(container.querySelector('dialog')?.open).toBe(false)

  await unmount()
})

test('calls onClose on Escape without closing the dialog itself', async () => {
  const onClose = vi.fn()
  const { container, unmount } = await renderUi(<Modal open onClose={onClose} title="T" />)
  const dialog = container.querySelector('dialog')

  await act(async () => {
    dialog?.dispatchEvent(new Event('cancel', { bubbles: false, cancelable: true }))
  })

  expect(onClose).toHaveBeenCalledTimes(1)
  expect(dialog?.open).toBe(true)

  await unmount()
})

test('calls onClose from the Close button and from a click on the backdrop, not from a click inside', async () => {
  const onClose = vi.fn()
  const { container, unmount } = await renderUi(
    <Modal open onClose={onClose} title="T">
      <p>Inside</p>
    </Modal>,
  )

  await act(async () => {
    container.querySelector('p')?.click()
  })
  expect(onClose).not.toHaveBeenCalled()

  await act(async () => {
    container.querySelector('button')?.click()
  })
  expect(onClose).toHaveBeenCalledTimes(1)

  await act(async () => {
    container.querySelector('dialog')?.click()
  })
  expect(onClose).toHaveBeenCalledTimes(2)

  await unmount()
})
