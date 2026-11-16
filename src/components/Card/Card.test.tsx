import { expect, test } from 'vitest'
import { renderUi } from '../../test/renderUi'
import Card from './Card'

test('renders title, meta, body and footer in an article', async () => {
  const { container, unmount } = await renderUi(
    <Card title="Morning" meta="7:42 am" footer={<button type="button">Edit</button>}>
      Woke up thinking about the sea.
    </Card>,
  )

  expect(container.querySelector('article h3')?.textContent).toBe('Morning')
  expect(container.querySelector('article header p')?.textContent).toBe('7:42 am')
  expect(container.querySelector('article')?.textContent).toContain('Woke up thinking about the sea.')
  expect(container.querySelector('article footer button')?.textContent).toBe('Edit')

  await unmount()
})

test('leaves out the header and footer when there is no title, meta or footer', async () => {
  const { container, unmount } = await renderUi(<Card>Just the text.</Card>)

  expect(container.querySelector('header')).toBeNull()
  expect(container.querySelector('footer')).toBeNull()

  await unmount()
})

test('renders a section when asked', async () => {
  const { container, unmount } = await renderUi(<Card as="section">Body</Card>)

  expect(container.querySelector('section')).not.toBeNull()
  expect(container.querySelector('article')).toBeNull()

  await unmount()
})
