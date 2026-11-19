import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { ThoughtMarkdown } from './ThoughtMarkdown'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
})

async function show(text: string): Promise<HTMLElement> {
  await act(async () => {
    root.render(<ThoughtMarkdown className="log-list__text md" text={text} />)
  })
  return container
}

function tags(parent: ParentNode, selector: string): string[] {
  return [...parent.querySelectorAll(selector)].map((node) => node.textContent ?? '')
}

// One test per row of the Markdown reference.

test.each([
  ['# Header 1', 'h2', 'md-h1'],
  ['## Header 2', 'h3', 'md-h2'],
  ['### Header 3', 'h4', 'md-h3'],
  ['#### Header 4', 'h5', 'md-h4'],
  ['##### Header 5', 'h6', 'md-h5'],
  ['###### Header 6', 'p', 'md-h6'],
])('renders "%s" as a %s with class %s', async (source, tag, className) => {
  const out = await show(source)

  const heading = out.querySelector(`${tag}.${className}`)
  expect(heading?.textContent).toBe(source.replace(/^#+ /, ''))
})

test('renders body text as a paragraph and keeps single line breaks', async () => {
  const out = await show('One line\nSecond line\n\nNew paragraph')

  expect(tags(out, 'p')).toEqual(['One lineSecond line', 'New paragraph'])
  expect(out.querySelectorAll('p')[0].querySelector('br')).not.toBeNull()
})

test('renders bold, italic and struck text', async () => {
  const out = await show('**bold**, *italic*, ~~struck~~')

  expect(out.querySelector('strong')?.textContent).toBe('bold')
  expect(out.querySelector('em')?.textContent).toBe('italic')
  expect(out.querySelector('s')?.textContent).toBe('struck')
})

test('renders a link that opens safely in a new tab', async () => {
  const out = await show('[a link](https://example.com)')

  const link = out.querySelector('a')
  expect(link?.textContent).toBe('a link')
  expect(link?.getAttribute('href')).toBe('https://example.com')
  expect(link?.getAttribute('target')).toBe('_blank')
  expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
})

test('renders inline code', async () => {
  const out = await show('Sort with `entries.sort()` first')

  expect(out.querySelector('p code')?.textContent).toBe('entries.sort()')
})

test('renders a quote block', async () => {
  const out = await show('> A quoted line')

  expect(out.querySelector('blockquote')?.textContent).toBe('A quoted line')
})

test('renders a bullet list and a numbered list', async () => {
  const out = await show('- first\n- second\n- third\n\n1. one\n2. two\n3. three')

  expect(tags(out, 'ul > li')).toEqual(['first', 'second', 'third'])
  expect(tags(out, 'ol > li')).toEqual(['one', 'two', 'three'])
})

test('renders a task list with disabled checkboxes named Done and Not done, and strikes the done text', async () => {
  const out = await show('- [x] done\n- [ ] to do')

  const boxes = [...out.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
  expect(boxes.map((box) => box.getAttribute('aria-label'))).toEqual(['Done', 'Not done'])
  expect(boxes.map((box) => box.checked)).toEqual([true, false])
  expect(boxes.every((box) => box.disabled)).toBe(true)
  expect(tags(out, '.md-task__text')).toEqual(['done', 'to do'])
  expect(tags(out, '.md-task__text--done')).toEqual(['done'])
  expect(out.querySelector('ul')?.className).toBe('md-tasks')
})

test('keeps the bullets of the plain items in a list that mixes plain items and tasks', async () => {
  const out = await show('- First\n- Second\n\n- [x] done\n- [ ] to do')

  const list = out.querySelector('ul')
  expect(list?.className).toBe('')
  expect([...out.querySelectorAll('li')].map((item) => item.className)).toEqual(['', '', 'md-task', 'md-task'])
})

test('renders a fenced code block as text inside pre and code', async () => {
  const out = await show('```\nfunction a() {\n  return 1 < 2\n}\n```')

  expect(out.querySelector('pre > code')?.textContent).toBe('function a() {\n  return 1 < 2\n}')
})

test('renders a table with a header row and body rows', async () => {
  const out = await show('| Day | Mood |\n| --- | --- |\n| Mon | Calm |')

  expect(tags(out, 'thead th')).toEqual(['Day', 'Mood'])
  expect(tags(out, 'tbody td')).toEqual(['Mon', 'Calm'])
})

test('renders a divider', async () => {
  const out = await show('above\n\n---\n\nbelow')

  expect(out.querySelector('hr')).not.toBeNull()
})

// Safety: a thought is never read as HTML.

test.each([
  '<b>hi</b>',
  '<script>window.hacked = true</script>',
  '<img src="x" onerror="window.hacked = true">',
  '<div onclick="window.hacked = true">block</div>',
  '<iframe src="https://evil.example"></iframe>',
])('shows raw HTML %j as literal characters, never as elements', async (html) => {
  const out = await show(html)

  expect(out.querySelector('b, script, img, iframe, .md div')).toBeNull()
  expect(out.textContent).toBe(html)
})

test('shows raw HTML inside a list, a quote, a table and a link text as literal characters', async () => {
  const out = await show('- <b>x</b>\n\n> <i>y</i>\n\n| a |\n| - |\n| <u>z</u> |\n\n[<b>t</b>](https://example.com)')

  expect(out.querySelector('b, i, u')).toBeNull()
  expect(out.textContent).toContain('<b>x</b>')
  expect(out.textContent).toContain('<i>y</i>')
  expect(out.textContent).toContain('<u>z</u>')
  expect(out.textContent).toContain('<b>t</b>')
})

test.each(['https://example.com/a', 'http://example.com/a', 'mailto:me@example.com'])(
  'makes %s a link',
  async (href) => {
    const out = await show(`[go](${href})`)

    expect(out.querySelector('a')?.getAttribute('href')).toBe(href)
  },
)

test.each([
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  ' javascript:alert(1)',
  'data:text/html;base64,PHNjcmlwdD4=',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'ftp://example.com/a',
  '/relative/path',
  '#anchor',
])('leaves the link %j as plain text', async (href) => {
  const out = await show(`[go](${href})`)

  expect(out.querySelector('a')).toBeNull()
  expect(out.textContent).toContain('go')
})

test('makes an autolink for a safe address only', async () => {
  const out = await show('<https://example.com> and <javascript:alert(1)>')

  expect(tags(out, 'a')).toEqual(['https://example.com'])
  expect(out.querySelector('a[href^="javascript"]')).toBeNull()
})

test('does not turn a bare web address into a link', async () => {
  const out = await show('see https://example.com now')

  expect(out.querySelector('a')).toBeNull()
})

test('shows a markdown image as its alt text and never creates an image element', async () => {
  const out = await show('![a cat](https://tracker.example/cat.png)')

  expect(out.querySelector('img, picture, source')).toBeNull()
  expect(out.textContent).toBe('a cat')
})
