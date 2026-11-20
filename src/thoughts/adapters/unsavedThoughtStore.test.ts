import { expect, test } from 'vitest'
import { FakeStorage } from '../../test/fakeStorage'
import { KeepBlocked, UNSAVED_ITEM, UnsavedThoughtStore } from './unsavedThoughtStore'

test('restores the text it kept', () => {
  const store = new UnsavedThoughtStore(new FakeStorage())
  store.keep('Half a thought')

  expect(store.restore()).toBe('Half a thought')
})

test('restores an empty string when nothing is kept', () => {
  expect(new UnsavedThoughtStore(new FakeStorage()).restore()).toBe('')
})

test('clear removes the kept item', () => {
  const storage = new FakeStorage()
  const store = new UnsavedThoughtStore(storage)
  store.keep('x')
  store.clear()

  expect(storage.items.has(UNSAVED_ITEM)).toBe(false)
})

test('keep throws KeepBlocked when storage refuses the write', () => {
  const storage = new FakeStorage()
  storage.blockedItems.add(UNSAVED_ITEM)

  expect(() => new UnsavedThoughtStore(storage).keep('x')).toThrow(KeepBlocked)
})
