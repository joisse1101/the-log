import { expect, test } from 'vitest'
import { FakeStorage } from '../test/fakeStorage'
import { KeepBlocked } from '../ports/unsavedThoughtStore'
import { LocalUnsavedThoughtStore, UNSAVED_ITEM } from './localUnsavedThoughtStore'

test('restores the text it kept', () => {
  const store = new LocalUnsavedThoughtStore(new FakeStorage())
  store.keep('Half a thought')

  expect(store.restore()).toBe('Half a thought')
})

test('restores an empty string when nothing is kept', () => {
  expect(new LocalUnsavedThoughtStore(new FakeStorage()).restore()).toBe('')
})

test('clear removes the kept item', () => {
  const storage = new FakeStorage()
  const store = new LocalUnsavedThoughtStore(storage)
  store.keep('x')
  store.clear()

  expect(storage.items.has(UNSAVED_ITEM)).toBe(false)
})

test('keep throws KeepBlocked when storage refuses the write', () => {
  const storage = new FakeStorage()
  storage.blockedItems.add(UNSAVED_ITEM)

  expect(() => new LocalUnsavedThoughtStore(storage).keep('x')).toThrow(KeepBlocked)
})

test('keep replaces the text it kept before', () => {
  const store = new LocalUnsavedThoughtStore(new FakeStorage())
  store.keep('First')
  store.keep('Second')

  expect(store.restore()).toBe('Second')
})

test('restores an empty string when storage cannot be read', () => {
  const storage = new FakeStorage()
  storage.items.set(UNSAVED_ITEM, 'Half a thought')
  storage.unreadableItems.add(UNSAVED_ITEM)

  expect(new LocalUnsavedThoughtStore(storage).restore()).toBe('')
})

test('clear empties the kept text when storage refuses to remove it, so nothing comes back', () => {
  const storage = new FakeStorage()
  const store = new LocalUnsavedThoughtStore(storage)
  store.keep('Saved already')
  storage.unremovableItems.add(UNSAVED_ITEM)
  store.clear()

  expect(storage.items.get(UNSAVED_ITEM)).toBe('')
  expect(store.restore()).toBe('')
})

test('clear throws KeepBlocked when storage refuses both removing and emptying the text', () => {
  const storage = new FakeStorage()
  const store = new LocalUnsavedThoughtStore(storage)
  store.keep('Saved already')
  storage.unremovableItems.add(UNSAVED_ITEM)
  storage.blockedItems.add(UNSAVED_ITEM)

  expect(() => store.clear()).toThrow(KeepBlocked)
})
