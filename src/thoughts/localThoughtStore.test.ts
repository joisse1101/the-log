import { expect, test } from 'vitest'
import { FakeStorage } from '../test/fakeStorage'
import { LocalThoughtStore, THOUGHTS_ITEM } from './localThoughtStore'
import type { Thought } from './thought'
import { StorageWriteFailed } from './thoughtStore'

const THOUGHT: Thought = {
  id: 'a',
  text: 'One',
  tags: [],
  createdAt: '2026-11-19T10:00:00.000Z',
  editedAt: null,
}

test('returns an empty list when the item is missing', () => {
  expect(new LocalThoughtStore(new FakeStorage()).all()).toEqual([])
})

test('add writes the versioned item shape and all reads it back', () => {
  const storage = new FakeStorage()
  const store = new LocalThoughtStore(storage)

  store.add(THOUGHT)

  expect(JSON.parse(storage.items.get(THOUGHTS_ITEM) ?? '')).toEqual({ version: 1, thoughts: [THOUGHT] })
  expect(store.all()).toEqual([THOUGHT])
})

test('add throws StorageWriteFailed and keeps the item unchanged when setItem throws', () => {
  const storage = new FakeStorage()
  const store = new LocalThoughtStore(storage)
  store.add(THOUGHT)
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.failWrites = true

  expect(() => store.add({ ...THOUGHT, id: 'b' })).toThrow(StorageWriteFailed)
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('remove writes the item without that thought and leaves the others', () => {
  const storage = new FakeStorage()
  const store = new LocalThoughtStore(storage)
  store.add(THOUGHT)
  store.add({ ...THOUGHT, id: 'b' })

  store.remove('a')

  expect(store.all().map((thought) => thought.id)).toEqual(['b'])
})

test('remove throws StorageWriteFailed and keeps the item unchanged when setItem throws', () => {
  const storage = new FakeStorage()
  const store = new LocalThoughtStore(storage)
  store.add(THOUGHT)
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.failWrites = true

  expect(() => store.remove('a')).toThrow(StorageWriteFailed)
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test.each(['not json {', '{}', 'null', '"x"', '{"thoughts":5}'])('all returns an empty list for %s', (corrupt) => {
  const storage = new FakeStorage()
  storage.items.set(THOUGHTS_ITEM, corrupt)
  const store = new LocalThoughtStore(storage)

  expect(store.all()).toEqual([])
  expect(store.get('a')).toBeUndefined()
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(corrupt)
})

test('all returns an empty list when getItem throws', () => {
  const storage = new FakeStorage()
  storage.unreadableItems.add(THOUGHTS_ITEM)

  expect(new LocalThoughtStore(storage).all()).toEqual([])
})

const CORRUPT_ITEMS = ['not json {', '{}', 'null', '"x"', '{"thoughts":5}']

test.each(CORRUPT_ITEMS)('add, replace and remove throw StorageWriteFailed and keep %s', (corrupt) => {
  const storage = new FakeStorage()
  storage.items.set(THOUGHTS_ITEM, corrupt)
  const store = new LocalThoughtStore(storage)

  expect(() => store.add(THOUGHT)).toThrow(StorageWriteFailed)
  expect(() => store.replace(THOUGHT)).toThrow(StorageWriteFailed)
  expect(() => store.remove('a')).toThrow(StorageWriteFailed)
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(corrupt)
})

test('add, replace and remove throw StorageWriteFailed and write nothing when getItem throws', () => {
  const storage = new FakeStorage()
  storage.items.set(THOUGHTS_ITEM, JSON.stringify({ version: 1, thoughts: [THOUGHT] }))
  const before = storage.items.get(THOUGHTS_ITEM)
  storage.unreadableItems.add(THOUGHTS_ITEM)
  const store = new LocalThoughtStore(storage)

  expect(() => store.add({ ...THOUGHT, id: 'b' })).toThrow(StorageWriteFailed)
  expect(() => store.replace(THOUGHT)).toThrow(StorageWriteFailed)
  expect(() => store.remove('a')).toThrow(StorageWriteFailed)
  expect(storage.items.get(THOUGHTS_ITEM)).toBe(before)
})

test('add still throws StorageWriteFailed when setItem fails over corrupt data', () => {
  const storage = new FakeStorage()
  storage.items.set(THOUGHTS_ITEM, 'not json {')
  storage.failWrites = true

  expect(() => new LocalThoughtStore(storage).add(THOUGHT)).toThrow(StorageWriteFailed)
})
