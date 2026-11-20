import { expect, test } from 'vitest'
import { createThought, reviseThought, thoughtToEditText, type Thought } from './thought'

const NOW = new Date('2026-11-19T10:15:00.000Z')

test('creates a thought with a UUID id, createdAt set, editedAt null and no tags', () => {
  const result = createThought('First thought', NOW)

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.thought.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  expect(result.thought.text).toBe('First thought')
  expect(result.thought.createdAt).toBe('2026-11-19T10:15:00.000Z')
  expect(result.thought.editedAt).toBeNull()
  expect(result.thought.tags).toEqual([])
})

function created(text: string) {
  const result = createThought(text, NOW)
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`)
  return result.thought
}

test('reads tags from the last line after an empty line and keeps the text without it', () => {
  const thought = created('Read tonight\n\nbooks, notes')

  expect(thought.text).toBe('Read tonight')
  expect(thought.tags).toEqual(['books', 'notes'])
})

test('treats a last line without an empty line before it as text', () => {
  const thought = created('Read tonight\nbooks, notes')

  expect(thought.text).toBe('Read tonight\nbooks, notes')
  expect(thought.tags).toEqual([])
})

test('merges tags that differ only in case, spaces or a leading #', () => {
  expect(created('Hi\n\nBooks,  books , #BOOKS').tags).toEqual(['books'])
})

test('drops empty tags', () => {
  expect(created('Hi\n\nbooks, , ,notes').tags).toEqual(['books', 'notes'])
})

test('refuses a tag over 30 characters and accepts one of 30', () => {
  const long = 'a'.repeat(31)

  expect(createThought(`Hi\n\n${long}`, NOW)).toEqual({ ok: false, reason: 'tag-too-long', tag: long })
  expect(created(`Hi\n\n${'a'.repeat(30)}`).tags).toEqual(['a'.repeat(30)])
})

test('still reads the last line after several empty lines as tags without a #', () => {
  const thought = created('Read tonight\n\n\nbooks, notes')

  expect(thought.text).toBe('Read tonight')
  expect(thought.tags).toEqual(['books', 'notes'])
})

test('reads an empty last line after an empty line as no tags and trims it from the text', () => {
  const thought = created('a\n\nb\n\n')

  expect(thought.text).toBe('a\n\nb')
  expect(thought.tags).toEqual([])
})

test('shows a text with a last line after an empty line with an empty tags line', () => {
  const thought: Thought = { ...created('x'), text: 'a\n\nb', tags: [] }

  expect(thoughtToEditText(thought)).toBe('a\n\nb\n\n')
})

test.each([
  ['a\n\nb', []],
  ['a\n\nb\n\nc', []],
  ['plain', []],
  ['one\ntwo', []],
  ['a\n\nb', ['t']],
  ['Read tonight', ['books', 'notes']],
])('round-trips text %j with tags %j through the edit text', (text, tags) => {
  const thought: Thought = { ...created('x'), text, tags }

  const revised = reviseThought(thought, thoughtToEditText(thought), NOW)

  expect(revised.ok).toBe(true)
  if (!revised.ok) return
  expect(revised.thought.text).toBe(text)
  expect(revised.thought.tags).toEqual(tags)
})

test.each(['', '   ', '\n \t'])('refuses blank text %j', (text) => {
  expect(createThought(text, NOW)).toEqual({ ok: false, reason: 'blank' })
})

test('revising with the same text and tags returns the thought unchanged, without a new editedAt', () => {
  const thought: Thought = { ...created('x'), text: 'Read tonight', tags: ['books', 'notes'] }

  const revised = reviseThought(thought, thoughtToEditText(thought), NOW)

  expect(revised).toEqual({ ok: true, thought })
  if (revised.ok) expect(revised.thought.editedAt).toBeNull()
})
