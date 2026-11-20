import { expect, test } from 'vitest'
import { FakeStorage } from '../test/fakeStorage'
import { LocalThoughtStore, THOUGHTS_ITEM } from './localThoughtStore'
import { ThoughtService } from './thoughtService'

function setup() {
  const storage = new FakeStorage()
  let current = new Date('2026-11-19T10:00:00.000Z')
  const service = new ThoughtService(new LocalThoughtStore(storage), () => current)
  return { storage, service, setNow: (date: Date) => (current = date) }
}

test('write saves the thought and returns it', () => {
  const { storage, service } = setup()

  const result = service.write('First thought')

  expect(result.ok).toBe(true)
  expect(service.list()).toHaveLength(1)
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(true)
})

test('write returns reason blank and saves nothing for blank text', () => {
  const { storage, service } = setup()

  expect(service.write('   ')).toEqual({ ok: false, reason: 'blank' })
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
})

test('write returns reason storage and leaves the log unchanged when the write fails', () => {
  const { storage, service } = setup()
  storage.failWrites = true

  expect(service.write('Lost?')).toEqual({ ok: false, reason: 'storage' })
  expect(service.list()).toEqual([])
})

test('write stores the text without the tags line and the parsed tags', () => {
  const { service } = setup()

  service.write('Read tonight\n\n#books, #notes')

  const [stored] = service.list()
  expect(stored.text).toBe('Read tonight')
  expect(stored.tags).toEqual(['books', 'notes'])
})

test('write returns reason tag-too-long and stores nothing for a 31-character tag', () => {
  const { storage, service } = setup()
  const long = 'b'.repeat(31)

  expect(service.write(`Hi\n\n#${long}`)).toEqual({ ok: false, reason: 'tag-too-long', tag: long })
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
})

test('list returns thoughts newest first', () => {
  const { service, setNow } = setup()
  service.write('Older')
  setNow(new Date('2026-11-19T11:00:00.000Z'))
  service.write('Newer')

  expect(service.list().map((thought) => thought.text)).toEqual(['Newer', 'Older'])
})

test('edit keeps createdAt, sets editedAt to now and returns the revised thought', () => {
  const { service, setNow } = setup()
  const written = service.write('Before')
  if (!written.ok) throw new Error('write failed')
  setNow(new Date('2026-11-20T08:00:00.000Z'))

  const result = service.edit(written.thought.id, 'After')

  expect(result.ok).toBe(true)
  const [stored] = service.list()
  expect(stored.text).toBe('After')
  expect(stored.createdAt).toBe('2026-11-19T10:00:00.000Z')
  expect(stored.editedAt).toBe('2026-11-20T08:00:00.000Z')
})

test('edit returns not-found when the thought is not stored', () => {
  const { service } = setup()

  expect(service.edit('missing', 'Text')).toEqual({ ok: false, reason: 'not-found' })
})

test('edit returns blank and leaves the thought unchanged for blank text', () => {
  const { service } = setup()
  const written = service.write('Before')
  if (!written.ok) throw new Error('write failed')

  expect(service.edit(written.thought.id, '  ')).toEqual({ ok: false, reason: 'blank' })
  expect(service.list()[0].text).toBe('Before')
})

test('edit returns storage and leaves the thought unchanged when the write fails', () => {
  const { storage, service } = setup()
  const written = service.write('Before')
  if (!written.ok) throw new Error('write failed')
  storage.failWrites = true

  expect(service.edit(written.thought.id, 'After')).toEqual({ ok: false, reason: 'storage' })
  expect(service.list()[0].text).toBe('Before')
})

test('edit with unchanged text writes nothing and keeps editedAt', () => {
  const { service, setNow } = setup()
  const written = service.write('Same')
  if (!written.ok) throw new Error('write failed')
  setNow(new Date('2026-11-20T08:00:00.000Z'))

  const result = service.edit(written.thought.id, 'Same')

  expect(result).toEqual({ ok: true, thought: written.thought })
  expect(service.list()[0].editedAt).toBeNull()
})
