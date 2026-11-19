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
