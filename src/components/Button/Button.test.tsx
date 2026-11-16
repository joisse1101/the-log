import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { renderUi } from '../../test/renderUi'
import Button from './Button'

test('renders a button of type "button" so it never submits a form by accident', async () => {
  const { container, unmount } = await renderUi(<Button>Save</Button>)

  const button = container.querySelector('button')
  expect(button?.textContent).toBe('Save')
  expect(button?.type).toBe('button')

  await unmount()
})

test('calls onClick when clicked and not when disabled', async () => {
  const onClick = vi.fn()
  const { container, rerender, unmount } = await renderUi(<Button onClick={onClick}>Save</Button>)

  await act(async () => {
    container.querySelector('button')?.click()
  })
  expect(onClick).toHaveBeenCalledTimes(1)

  await rerender(
    <Button onClick={onClick} disabled>
      Save
    </Button>,
  )
  await act(async () => {
    container.querySelector('button')?.click()
  })
  expect(onClick).toHaveBeenCalledTimes(1)

  await unmount()
})

test('gives each variant its own class', async () => {
  const { container, unmount } = await renderUi(
    <>
      <Button variant="primary">A</Button>
      <Button variant="secondary">B</Button>
    </>,
  )

  const [primary, secondary] = Array.from(container.querySelectorAll('button'))
  expect(primary?.className).not.toBe(secondary?.className)

  await unmount()
})
