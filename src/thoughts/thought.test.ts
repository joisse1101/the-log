import { expect, test } from 'vitest'
import { createThought } from './thought'

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

test.each(['', '   ', '\n \t'])('refuses blank text %j', (text) => {
  expect(createThought(text, NOW)).toEqual({ ok: false, reason: 'blank' })
})
