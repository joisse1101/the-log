import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AppShell from './AppShell'
import { FakeStorage } from './test/fakeStorage'
import { THOUGHTS_ITEM } from './adapters/localThoughtStore'
import type { Thought } from './domain/thought'
import { UNSAVED_ITEM } from './adapters/localUnsavedThoughtStore'

let container: HTMLDivElement
let root: Root
let storage: FakeStorage

beforeEach(async () => {
  storage = new FakeStorage()
  vi.stubGlobal('localStorage', storage)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function box(): HTMLTextAreaElement {
  const found = container.querySelector('textarea')
  if (found === null) throw new Error('thought box not found')
  return found
}

async function type(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(box(), text)
    box().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function saveWithShiftEnter() {
  await act(async () => {
    box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })
}

async function saveWithButton() {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Save')
  if (button === undefined) throw new Error('Save button not found')
  await act(async () => {
    button.click()
  })
}

function storedThoughts(): Thought[] {
  const raw = storage.items.get(THOUGHTS_ITEM)
  return raw === undefined ? [] : (JSON.parse(raw) as { thoughts: Thought[] }).thoughts
}

function shownTexts(): string[] {
  return [...container.querySelectorAll('.log-list__text')].map((node) => node.textContent ?? '')
}

test('renders the title "The Log" with createRoot', () => {
  expect(container.querySelector('h1')?.textContent).toBe('The Log')
})

test('saves a typed thought with Shift + Enter and shows it first with "Today, HH:MM"', async () => {
  await type('First thought')
  await saveWithShiftEnter()

  expect(shownTexts()).toEqual(['First thought'])
  expect(container.querySelector('.log-list__time')?.textContent).toMatch(/^Today, \d{2}:\d{2}$/)
  const stored = storedThoughts()
  expect(stored).toHaveLength(1)
  expect(stored[0].id).toMatch(/^[0-9a-f-]{36}$/)
  expect(stored[0].createdAt).not.toBe('')
  expect(stored[0].editedAt).toBeNull()
})

test('saves with the Save button', async () => {
  await type('By button')
  await saveWithButton()

  expect(shownTexts()).toEqual(['By button'])
})

test('empties the box, folds it, puts focus on the hint and puts the next thought above the first', async () => {
  await type('First thought')
  await saveWithShiftEnter()

  expect(box().value).toBe('')
  expect(document.activeElement).toBe(container.querySelector('.fold-hint'))

  await act(async () => {
    container.querySelector<HTMLButtonElement>('.fold-hint')?.click()
  })
  expect(document.activeElement).toBe(box())

  await type('Second')
  await saveWithShiftEnter()

  expect(shownTexts()).toEqual(['Second', 'First thought'])
})

test('puts focus on the hint after saving with the Save button', async () => {
  await type('First thought')
  await saveWithButton()

  expect(document.activeElement).toBe(container.querySelector('.fold-hint'))
})

test.each(['', '   '])('refuses blank text %j and leaves the stored item unchanged', async (text) => {
  await type(text)
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe('A thought needs some text.')
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
  expect(shownTexts()).toEqual([])
})

test('shows the blank-text message inside the field, and clears it on input and on blur', async () => {
  await type('')
  await saveWithShiftEnter()

  const alert = container.querySelector('[role="alert"]')
  expect(alert?.closest('.thought-field')).not.toBeNull()
  expect(alert?.classList.contains('thought-field__error')).toBe(true)

  await type('a')
  expect(container.querySelector('[role="alert"]')).toBeNull()

  await type('')
  await saveWithShiftEnter()
  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  await act(async () => {
    box().focus()
    box().blur()
  })
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

test('keeps the storage-failure message below the box, outside the field', async () => {
  storage.failWrites = true
  await type('Lost?')
  await saveWithShiftEnter()

  const alert = container.querySelector('[role="alert"]')
  expect(alert?.closest('.thought-field')).toBeNull()
  expect(alert?.classList.contains('thought-box__error')).toBe(true)
})

test('asks for a first thought while the log is empty, then for what happened today', async () => {
  expect(container.querySelector('.app-shell__tagline')?.textContent).toBe('Your thoughts will appear here.')
  expect(box().placeholder).toBe('Write your first thought.')

  await type('First thought')
  await saveWithShiftEnter()

  expect(container.querySelector('.app-shell__tagline')?.textContent).toBe('Write it down. Come back to it later.')
  expect(box().placeholder).toBe('What happened today?')
})

test('keeps the text and the log when the storage write fails', async () => {
  await type('Earlier')
  await saveWithShiftEnter()
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.failWrites = true

  await type('Lost?')
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    "Couldn't save your thought. Your text is still in the box.",
  )
  expect(box().value).toBe('Lost?')
  expect(shownTexts()).toEqual(['Earlier'])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('offers no place choice and makes no network request when saving', async () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)

  expect(container.querySelector('select, input[type="radio"], input[type="checkbox"]')).toBeNull()
  expect([...container.querySelectorAll('button')].filter((b) => !b.closest('[inert]')).map((b) => b.textContent)).toEqual(['Save'])

  await type('Here')
  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.text)).toEqual(['Here'])
  expect(fetchSpy).not.toHaveBeenCalled()
})

/** Stands in for the browser's IntersectionObserver, which jsdom lacks; `report` plays a visibility change. */
function fakeIntersectionObserver() {
  let notify: ((entries: { intersectionRatio: number }[]) => void) | null = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: { intersectionRatio: number }[]) => void) {
        notify = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  return async (intersectionRatio: number) => {
    await act(async () => {
      notify?.([{ intersectionRatio }])
    })
  }
}

test('fades the header out while it is only partly in view, and back in when it is whole', async () => {
  const report = fakeIntersectionObserver()
  await renderAgain()
  const header = () => container.querySelector('.app-shell__header')

  await report(0.3)
  expect(header()?.classList.contains('app-shell__header--clipped')).toBe(true)

  await report(1)
  expect(header()?.classList.contains('app-shell__header--clipped')).toBe(false)
})

// Simulates a lost connection: the browser reports offline and every request fails.
function goOffline() {
  const failingFetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
  vi.stubGlobal('fetch', failingFetch)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  window.dispatchEvent(new Event('offline'))
  return failingFetch
}

test('saves a thought as a local thought with no choice offered while disconnected', async () => {
  const failingFetch = goOffline()

  await type('Offline note')
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')).toBeNull()
  expect(container.querySelector('select, input[type="radio"], input[type="checkbox"]')).toBeNull()
  expect(shownTexts()).toEqual(['Offline note'])
  expect(storedThoughts().map((thought) => thought.text)).toEqual(['Offline note'])
  expect(failingFetch).not.toHaveBeenCalled()
})

test('opens the log with only local thoughts, newest first, while disconnected', async () => {
  await type('First')
  await saveWithShiftEnter()
  await type('Second')
  await saveWithShiftEnter()
  const failingFetch = goOffline()

  await renderAgain()

  expect(container.querySelector('[role="alert"]')).toBeNull()
  expect(shownTexts()).toEqual(['Second', 'First'])
  expect(failingFetch).not.toHaveBeenCalled()
})

test('saves tags from the last line and shows #books and #notes on the card', async () => {
  await type('Read tonight\n\n#books, #notes')
  await saveWithShiftEnter()

  expect(storedThoughts()[0].text).toBe('Read tonight')
  expect(storedThoughts()[0].tags).toEqual(['books', 'notes'])
  expect(shownTexts()).toEqual(['Read tonight'])
  const shownTags = [...container.querySelectorAll('.log-list__tag')].map((node) => node.textContent)
  expect(shownTags).toEqual(['#books', '#notes'])
})

test('stores one tag for "#Books,  #books , #BOOKS" and drops empty tags', async () => {
  await type('One\n\n#Books,  #books , #BOOKS')
  await saveWithShiftEnter()
  await type('Two\n\n#books, , ,#notes')
  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.tags)).toEqual([['books'], ['books', 'notes']])
})

test('refuses a 31-character tag, keeps the text and stores nothing; a 30-character tag saves', async () => {
  const long = 'c'.repeat(31)
  await type(`Hi\n\n#${long}`)
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    `Tag “${'c'.repeat(30)}…” is too long (30 characters at most).`,
  )
  expect(box().value).toBe(`Hi\n\n#${long}`)
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)

  await type(`Hi\n\n#${'c'.repeat(30)}`)
  await saveWithShiftEnter()

  expect(storedThoughts()[0].tags).toEqual(['c'.repeat(30)])
})

test('keeps typed text in the-log:unsaved-thought and restores it when the app is rendered again', async () => {
  await type('Half a thought')

  expect(storage.items.get(UNSAVED_ITEM)).toBe('Half a thought')

  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })

  expect(box().value).toBe('Half a thought')
})

test('keeps the text in the box and the kept item after a failed save, and saves on retry', async () => {
  await type('Retry me')
  storage.failWrites = true
  await saveWithShiftEnter()

  expect(box().value).toBe('Retry me')
  expect(storage.items.get(UNSAVED_ITEM)).toBe('Retry me')
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)

  storage.failWrites = false
  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.text)).toEqual(['Retry me'])
})

test('clears the kept text after a successful save and shows an empty box on reopen', async () => {
  await type('Done')
  await saveWithShiftEnter()

  expect(storage.items.has(UNSAVED_ITEM)).toBe(false)

  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })

  expect(box().value).toBe('')
})

test('leaves nothing to restore after a save when the browser refuses to remove the kept text', async () => {
  storage.unremovableItems.add(UNSAVED_ITEM)
  await type('Done')
  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.text)).toEqual(['Done'])
  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })

  expect(box().value).toBe('')
})

test('says once that unsaved text cannot be kept and still saves', async () => {
  storage.blockedItems.add(UNSAVED_ITEM)
  const message = "This browser can't keep unsaved text. Save before you close the tab."

  await type('a')
  await type('ab')
  await type('abc')

  const notices = [...container.querySelectorAll('[role="status"]')].filter((node) => node.textContent === message)
  expect(notices).toHaveLength(1)

  await saveWithShiftEnter()

  expect(storedThoughts().map((thought) => thought.text)).toEqual(['abc'])
})

test('shows text as plain text, not HTML', async () => {
  await type('<b>bold</b>')
  await saveWithShiftEnter()

  expect(container.querySelector('.log-list__text b')).toBeNull()
  expect(shownTexts()).toEqual(['<b>bold</b>'])
})

const SEEDED: Thought = {
  id: 'seed-1',
  text: 'Original',
  tags: ['books'],
  createdAt: '2026-11-13T19:30:00.000Z',
  editedAt: null,
}

async function renderWithSeed(thought: Thought = SEEDED) {
  storage.items.set(THOUGHTS_ITEM, JSON.stringify({ version: 1, thoughts: [thought] }))
  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
}

function button(label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((b) => b.textContent === label)
  if (found === undefined) throw new Error(`${label} button not found`)
  return found
}

function rowButton(namePrefix: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label')?.startsWith(`${namePrefix},`))
  if (found === undefined) throw new Error(`${namePrefix} button not found`)
  return found
}

function dialogBox(): HTMLTextAreaElement {
  const found = container.querySelector<HTMLTextAreaElement>('.edit-dialog textarea')
  if (found === null) throw new Error('edit dialog not found')
  return found
}

async function openEdit() {
  await act(async () => {
    rowButton('Edit thought').click()
  })
}

async function typeInDialog(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(dialogBox(), text)
    dialogBox().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function saveDialog() {
  const save = [...container.querySelectorAll('.edit-dialog button')].find((b) => b.textContent === 'Save')
  if (save === undefined) throw new Error('dialog Save button not found')
  await act(async () => {
    ;(save as HTMLButtonElement).click()
  })
}

function dialogAlert(): string | undefined {
  return container.querySelector('.edit-dialog [role="alert"]')?.textContent ?? undefined
}

test('opens Edit with the text, its tags line and the note that the time stays', async () => {
  await renderWithSeed()
  await openEdit()

  expect(dialogBox().value).toBe('Original\n\n#books')
  expect(container.querySelector('.edit-dialog__time')?.textContent).toMatch(/^Written .+\. The time stays as it is\.$/)
})

test('edits a thought: the card shows the new text with the original time and editedAt is set', async () => {
  await renderWithSeed()
  const timeBefore = container.querySelector('.log-list__time')?.textContent
  await openEdit()
  await typeInDialog('Fixed')
  await saveDialog()

  expect(shownTexts()).toEqual(['Fixed'])
  expect(container.querySelector('.log-list__time')?.textContent).toBe(timeBefore)
  expect(container.querySelector('.edit-dialog')).toBeNull()
  const [stored] = storedThoughts()
  expect(stored.text).toBe('Fixed')
  expect(stored.createdAt).toBe(SEEDED.createdAt)
  expect(stored.editedAt).not.toBeNull()
  expect(Math.abs(Date.now() - new Date(stored.editedAt ?? '').getTime())).toBeLessThan(60_000)
})

test('saves an edit with Shift + Enter in the dialog', async () => {
  await renderWithSeed()
  await openEdit()
  await typeInDialog('Fixed')
  await act(async () => {
    dialogBox().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })

  expect(shownTexts()).toEqual(['Fixed'])
})

test('storing tags: editing the last line to "#books, #home" stores the tags [books, home]', async () => {
  await renderWithSeed({ ...SEEDED, tags: [] })
  await openEdit()
  await typeInDialog('Original\n\n#books, #home')
  await saveDialog()

  expect(storedThoughts()[0].tags).toEqual(['books', 'home'])
  const shownTags = [...container.querySelectorAll('.log-list__tag')].map((node) => node.textContent)
  expect(shownTags).toEqual(['#books', '#home'])
})

test('a last line with a name missing its # stays in the text with no tags', async () => {
  await type('Hi\n\n#books, notes')
  await saveWithShiftEnter()

  expect(storedThoughts()[0].text).toBe('Hi\n\n#books, notes')
  expect(storedThoughts()[0].tags).toEqual([])
})

test('saving an unchanged edit keeps text "a\\n\\nb" with no tags', async () => {
  await renderWithSeed({ ...SEEDED, text: 'a\n\nb', tags: [] })
  await openEdit()
  await saveDialog()

  const [stored] = storedThoughts()
  expect(stored.text).toBe('a\n\nb')
  expect(stored.tags).toEqual([])
})

test('saving an unchanged edit keeps a thought with tags', async () => {
  await renderWithSeed({ ...SEEDED, text: 'a\n\nb', tags: ['books', 'home'] })
  await openEdit()
  await saveDialog()

  const [stored] = storedThoughts()
  expect(stored.text).toBe('a\n\nb')
  expect(stored.tags).toEqual(['books', 'home'])
})

test('tells the user the thought no longer exists and keeps the dialog open with the text', async () => {
  await renderWithSeed()
  await openEdit()
  storage.items.delete(THOUGHTS_ITEM)
  await typeInDialog('Changed')
  await saveDialog()

  expect(dialogAlert()).toBe('This thought no longer exists.')
  expect(dialogBox().value).toBe('Changed')
})

test('removes the card from the log and moves focus to the heading when the dialog closes after "no longer exists"', async () => {
  await renderWithSeed()
  rowButton('Edit thought').focus()
  await openEdit()
  storage.items.delete(THOUGHTS_ITEM)
  await saveDialog()
  expect(shownTexts()).toEqual(['Original'])
  await act(async () => {
    button('Cancel').click()
  })

  expect(container.querySelector('.edit-dialog')).toBeNull()
  expect(shownTexts()).toEqual([])
  expect(document.activeElement).toBe(container.querySelector('h1'))
})

test('does not close the edit dialog when the user taps outside it', async () => {
  await renderWithSeed()
  await openEdit()
  await typeInDialog('Half written')
  await act(async () => {
    container.querySelector<HTMLElement>('.dialog-scrim')?.click()
  })

  expect(container.querySelector('.edit-dialog')).not.toBeNull()
  expect(dialogBox().value).toBe('Half written')
})

test('shows the markdown tips line in the edit dialog', async () => {
  await renderWithSeed()
  await openEdit()

  expect(container.querySelector('.edit-dialog__tips')?.textContent).toBe(
    'Markdown works. Put your tags on the last line, after an empty line, each starting with #, separated by commas.',
  )
})

test('keeps the dialog and the stored thought when the storage write fails on edit', async () => {
  await renderWithSeed()
  await openEdit()
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.failWrites = true
  await typeInDialog('Changed')
  await saveDialog()

  expect(dialogAlert()).toBe("Couldn't save your thought. Your text is still in the box.")
  expect(dialogBox().value).toBe('Changed')
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('refuses a blank edit and leaves the stored thought unchanged', async () => {
  await renderWithSeed()
  await openEdit()
  const before = storage.items.get(THOUGHTS_ITEM)
  await typeInDialog('   ')
  await saveDialog()

  expect(dialogAlert()).toBe('A thought needs some text.')
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

const SECOND: Thought = {
  id: 'seed-2',
  text: 'Other',
  tags: [],
  createdAt: '2026-11-14T19:30:00.000Z',
  editedAt: null,
}

async function renderWithTwoSeeds() {
  storage.items.set(THOUGHTS_ITEM, JSON.stringify({ version: 1, thoughts: [SEEDED, SECOND] }))
  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
}

async function pressDeleteOn(text: string) {
  const card = [...container.querySelectorAll('.log-list__item')].find(
    (item) => item.querySelector('.log-list__text')?.textContent === text,
  )
  const deleteButton = [...(card?.querySelectorAll('button') ?? [])].find((b) => b.getAttribute('aria-label')?.startsWith('Delete thought,'))
  if (deleteButton === undefined) throw new Error('Delete button not found')
  await act(async () => {
    deleteButton.click()
  })
}

function deleteDialog(): Element | null {
  return container.querySelector('.delete-dialog')
}

test('asks "Delete this thought?" with its time and text, no gist, and deletes after Delete thought', async () => {
  await renderWithTwoSeeds()
  await pressDeleteOn('Original')

  const dialogText = deleteDialog()?.textContent ?? ''
  expect(dialogText).toContain('Delete this thought?')
  expect(dialogText).toContain('Original')
  expect(deleteDialog()?.querySelector('.delete-dialog__time')?.textContent).toMatch(/\d{2}:\d{2}$/)
  expect(dialogText).toContain('It will no longer show in your log.')
  expect(dialogText.toLowerCase()).not.toContain('gist')

  await act(async () => {
    button('Delete thought').click()
  })

  expect(shownTexts()).toEqual(['Other'])
  expect(deleteDialog()).toBeNull()
  expect(storedThoughts()).toEqual([SECOND])
})

test('keeps the thought and the stored item when the user cancels the delete', async () => {
  await renderWithTwoSeeds()
  const before = storage.items.get(THOUGHTS_ITEM)
  await pressDeleteOn('Original')
  await act(async () => {
    button('Cancel').click()
  })

  expect(deleteDialog()).toBeNull()
  expect(shownTexts()).toEqual(['Other', 'Original'])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('fills the opener button while its dialog is open and clears it on close', async () => {
  await renderWithSeed()
  const opener = rowButton('Edit thought')
  opener.focus()
  await openEdit()
  expect(opener.hasAttribute('data-dialog-open')).toBe(true)
  await act(async () => {
    button('Cancel').click()
  })

  expect(opener.hasAttribute('data-dialog-open')).toBe(false)
})

test('makes the page behind an open dialog inert, and not the dialog, until it closes', async () => {
  await renderWithSeed()
  const page = container.querySelector('.app-shell__page')
  expect(page?.hasAttribute('inert')).toBe(false)

  await openEdit()
  expect(page?.hasAttribute('inert')).toBe(true)
  expect(page?.contains(box())).toBe(true)
  expect(dialogBox().closest('[inert]')).toBeNull()

  await act(async () => {
    button('Cancel').click()
  })
  expect(page?.hasAttribute('inert')).toBe(false)

  await pressDeleteOn(SEEDED.text)
  expect(page?.hasAttribute('inert')).toBe(true)
  expect(deleteDialog()?.closest('[inert]')).toBeNull()
})

test('shows a thought written in markdown as plain text with a leading header as the title', async () => {
  const text = '# Reading **list**\n\n- [x] a [link](https://example.com)\n- `code` item'
  await renderWithSeed({ ...SEEDED, text, tags: [] })
  const card = container.querySelector('.log-list__item')
  const deleteButton = [...(card?.querySelectorAll('button') ?? [])].find((b) => b.getAttribute('aria-label')?.startsWith('Delete thought,'))
  await act(async () => {
    deleteButton?.click()
  })

  expect(deleteDialog()?.querySelector('.delete-dialog__heading')?.textContent).toBe('Reading list')
  expect(deleteDialog()?.querySelector('.delete-dialog__text')?.textContent).toBe('a link\ncode item')
  expect(deleteDialog()?.querySelector('a, strong, code')).toBeNull()
})

test('keeps the thought and says so when the storage write fails on delete', async () => {
  await renderWithTwoSeeds()
  const before = storage.items.get(THOUGHTS_ITEM)
  await pressDeleteOn('Original')
  storage.failWrites = true
  await act(async () => {
    button('Delete thought').click()
  })

  expect(deleteDialog()?.querySelector('[role="alert"]')?.textContent).toBe(
    "Couldn't delete your thought. It is still in your log.",
  )
  expect(shownTexts()).toEqual(['Other', 'Original'])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
  expect(deleteDialog()?.textContent).not.toContain('It will no longer show in your log.')
})

async function renderAgain() {
  await act(async () => {
    root.unmount()
  })
  root = createRoot(container)
  await act(async () => {
    root.render(<AppShell />)
  })
}

test.each(['not json {', '{}', 'null', '"x"', '{"thoughts":5}'])(
  'renders an empty log and keeps the stored item when it holds %s',
  async (corrupt) => {
    storage.items.set(THOUGHTS_ITEM, corrupt)
    await renderAgain()

    expect(container.querySelector('h1')?.textContent).toBe('The Log')
    expect(shownTexts()).toEqual([])
    expect(storage.items.get(THOUGHTS_ITEM)).toBe(corrupt)
  },
)

const BAD_ELEMENT_ITEMS = [
  '5',
  'null',
  '"x"',
  '{"id":"a","text":"One","tags":[],"editedAt":null}',
  '{"id":"a","text":"One","tags":"books","createdAt":"2026-11-19T10:00:00.000Z","editedAt":null}',
].map((element) => `{"version":1,"thoughts":[${element}]}`)

test.each(BAD_ELEMENT_ITEMS)('renders an empty log and keeps the stored item when it holds %s', async (item) => {
  storage.items.set(THOUGHTS_ITEM, item)
  await renderAgain()

  expect(container.querySelector('h1')?.textContent).toBe('The Log')
  expect(shownTexts()).toEqual([])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(item)
})

test('refuses to save over corrupt stored data, keeps the box text and leaves the item unchanged', async () => {
  storage.items.set(THOUGHTS_ITEM, 'not json {')
  await renderAgain()

  await type('Do not lose the old log')
  await saveWithShiftEnter()

  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    "Couldn't save your thought. Your text is still in the box.",
  )
  expect(box().value).toBe('Do not lose the old log')
  expect(storage.items.get(THOUGHTS_ITEM)).toBe('not json {')
})

test('renders an empty log when reading the stored thoughts throws', async () => {
  storage.unreadableItems.add(THOUGHTS_ITEM)
  await renderAgain()

  expect(container.querySelector('h1')?.textContent).toBe('The Log')
  expect(shownTexts()).toEqual([])
})

async function pressEscape(target: Element) {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  })
}

test('gives each row buttons a name with the time shown on its card', async () => {
  await renderWithSeed()
  const time = container.querySelector('.log-list__time')?.textContent
  expect(rowButton('Edit thought').getAttribute('aria-label')).toBe(`Edit thought, ${time}`)
  expect(rowButton('Delete thought').getAttribute('aria-label')).toBe(`Delete thought, ${time}`)
})

test('closes the edit dialog with Escape without saving and returns focus to its button', async () => {
  await renderWithSeed()
  const opener = rowButton('Edit thought')
  opener.focus()
  await openEdit()
  await typeInDialog('Changed')
  await pressEscape(dialogBox())

  expect(container.querySelector('.edit-dialog')).toBeNull()
  expect(storedThoughts()[0].text).toBe('Original')
  expect(document.activeElement).toBe(opener)
})

test('closes the delete dialog with Escape without deleting and returns focus to its button', async () => {
  await renderWithSeed()
  const opener = rowButton('Delete thought')
  opener.focus()
  await pressDeleteOn('Original')
  await pressEscape(button('Cancel'))

  expect(deleteDialog()).toBeNull()
  expect(storedThoughts()).toHaveLength(1)
  expect(document.activeElement).toBe(opener)
})

test('moves focus to the heading after the thought it opened on is deleted', async () => {
  await renderWithSeed()
  rowButton('Delete thought').focus()
  await pressDeleteOn('Original')
  await act(async () => {
    button('Delete thought').click()
  })

  expect(document.activeElement).toBe(container.querySelector('h1'))
})

test('keeps Tab inside the open dialog', async () => {
  await renderWithSeed()
  await pressDeleteOn('Original')
  const confirm = button('Delete thought')
  confirm.focus()
  await act(async () => {
    confirm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
  })

  expect(document.activeElement).toBe(button('Cancel'))
})

test('clears the new-thought error when the user types', async () => {
  await type('')
  await saveWithShiftEnter()
  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  await type('a')

  expect(container.querySelector('[role="alert"]')).toBeNull()
})

test('clears the edit error when the user types', async () => {
  await renderWithSeed()
  await openEdit()
  await typeInDialog('')
  await act(async () => {
    dialogBox().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })
  expect(dialogAlert()).toBe('A thought needs some text.')
  await typeInDialog('x')

  expect(dialogAlert()).toBeUndefined()
})

// Keyboard and focus while a dialog is open

async function press(target: EventTarget, key: string, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  await act(async () => {
    target.dispatchEvent(event)
  })
  return event
}

async function openFromRow(namePrefix: string): Promise<HTMLButtonElement> {
  const opener = rowButton(namePrefix)
  opener.focus()
  await act(async () => {
    opener.click()
  })
  return opener
}

function dialogButtons(selector: string): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(`${selector} button, ${selector} textarea`)]
}

test('Delete dialog puts focus on Cancel when it opens', async () => {
  await renderWithTwoSeeds()
  await openFromRow('Delete thought')

  expect(document.activeElement).toBe(button('Cancel'))
})

test.each(['body', 'opener'])('Escape closes the Delete dialog with focus on the %s, deleting nothing', async (where) => {
  await renderWithTwoSeeds()
  const before = storage.items.get(THOUGHTS_ITEM)
  const opener = await openFromRow('Delete thought')
  ;(where === 'body' ? document.body : opener).focus()
  if (where === 'body') (document.activeElement as HTMLElement).blur()
  expect(container.contains(document.activeElement) && deleteDialog()?.contains(document.activeElement)).toBeFalsy()

  const event = await press(document.activeElement ?? document.body, 'Escape')

  expect(event.defaultPrevented).toBe(true)
  expect(deleteDialog()).toBeNull()
  expect(shownTexts()).toEqual(['Other', 'Original'])
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('Escape closes the Edit dialog with focus outside it, without saving', async () => {
  await renderWithSeed()
  const before = storage.items.get(THOUGHTS_ITEM)
  await openFromRow('Edit thought')
  await typeInDialog('Changed')
  ;(document.activeElement as HTMLElement).blur()

  await press(document.body, 'Escape')

  expect(container.querySelector('.edit-dialog')).toBeNull()
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('Escape closes a dialog once and the listener is gone afterwards', async () => {
  await renderWithTwoSeeds()
  await openFromRow('Delete thought')
  const removed = vi.spyOn(document, 'removeEventListener')
  await press(document.body, 'Escape')

  expect(removed.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
  const event = await press(document.body, 'Escape')
  expect(event.defaultPrevented).toBe(false)
  removed.mockRestore()
})

test.each([
  ['Delete', '.delete-dialog', 'Delete thought'],
  ['Edit', '.edit-dialog', 'Edit thought'],
])('Tab with focus outside the %s dialog lands inside it', async (_name, selector, opener) => {
  await renderWithTwoSeeds()
  await openFromRow(opener)
  const items = dialogButtons(selector)
  ;(document.activeElement as HTMLElement).blur()

  const forward = await press(document.body, 'Tab')
  expect(forward.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(items[0])

  rowButton(opener).focus()
  const backward = await press(document.activeElement ?? document.body, 'Tab', true)
  expect(backward.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(items[items.length - 1])
})

test.each([
  ['Delete', '.delete-dialog', 'Delete thought'],
  ['Edit', '.edit-dialog', 'Edit thought'],
])('Tab and Shift+Tab wrap around inside the %s dialog', async (_name, selector, opener) => {
  await renderWithTwoSeeds()
  await openFromRow(opener)
  const items = dialogButtons(selector)
  const first = items[0]
  const last = items[items.length - 1]

  first.focus()
  const back = await press(first, 'Tab', true)
  expect(back.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(last)

  const forward = await press(last, 'Tab')
  expect(forward.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(first)
})

test('Tab in the middle of the Edit dialog is left to the browser', async () => {
  await renderWithTwoSeeds()
  await openFromRow('Edit thought')
  const items = dialogButtons('.edit-dialog')
  items[1].focus()

  const middle = await press(items[1], 'Tab')

  expect(items.length).toBeGreaterThan(2)
  expect(middle.defaultPrevented).toBe(false)
})

test('Shift+Enter in the Edit dialog still saves', async () => {
  await renderWithSeed()
  await openFromRow('Edit thought')
  await typeInDialog('Saved by keys')
  await press(dialogBox(), 'Enter', true)

  expect(container.querySelector('.edit-dialog')).toBeNull()
  expect(storedThoughts()[0].text).toBe('Saved by keys')
})

const CLOSERS: Array<[string, string, string, () => Promise<void>]> = [
  ['Delete', 'Cancel', 'Delete thought', async () => button('Cancel').click()],
  ['Delete', 'the scrim', 'Delete thought', async () => container.querySelector<HTMLElement>('.dialog-scrim')?.click()],
  ['Delete', 'Escape', 'Delete thought', async () => void (await press(document.body, 'Escape'))],
  ['Edit', 'the X button', 'Edit thought', async () => (container.querySelector('[aria-label="Close without saving"]') as HTMLElement).click()],
  ['Edit', 'Cancel', 'Edit thought', async () => button('Cancel').click()],
  ['Edit', 'Save', 'Edit thought', async () => {
    await typeInDialog('Edited')
    await saveDialog()
  }],
]

test.each(CLOSERS)('focus returns to the opener after the %s dialog closes by %s', async (_dialog, _how, opener, close) => {
  await renderWithTwoSeeds()
  const openerButton = await openFromRow(opener)
  await act(async () => {
    await close()
  })

  expect(container.querySelector('.delete-dialog, .edit-dialog')).toBeNull()
  expect(document.activeElement).toBe(openerButton)
})

test('lays the edit dialog out as a column whose field sits beside its error, so the field can give way to the error', async () => {
  await renderWithSeed()
  await openEdit()
  storage.items.delete(THOUGHTS_ITEM)
  await typeInDialog('Changed')
  await saveDialog()

  const dialog = container.querySelector('.edit-dialog')
  const children = [...(dialog?.children ?? [])].map((child) => child.className)
  expect(children).toContain('thought-field')
  expect(children.indexOf('edit-dialog__error')).toBe(children.indexOf('thought-field') + 1)
  expect(dialog?.querySelector('.thought-field')?.parentElement).toBe(dialog)
})
