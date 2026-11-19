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

  service.write('Read tonight\n\nbooks, notes')

  const [stored] = service.list()
  expect(stored.text).toBe('Read tonight')
  expect(stored.tags).toEqual(['books', 'notes'])
})

test('write returns reason tag-too-long and stores nothing for a 31-character tag', () => {
  const { storage, service } = setup()
  const long = 'b'.repeat(31)

  expect(service.write(`Hi\n\n${long}`)).toEqual({ ok: false, reason: 'tag-too-long', tag: long })
  expect(storage.items.has(THOUGHTS_ITEM)).toBe(false)
})

test('list returns thoughts newest first', () => {
  const { service, setNow } = setup()
  service.write('Older')
  setNow(new Date('2026-11-19T11:00:00.000Z'))
  service.write('Newer')

  expect(service.list().map((thought) => thought.text)).toEqual(['Newer', 'Older'])
})
