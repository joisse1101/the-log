import { expect, test } from 'vitest'
import { thoughtToPlainText } from './plainText'

test('returns a leading header as the title and the rest as plain lines', () => {
  expect(thoughtToPlainText('# Trip **notes**\n\nPack the `charger`.')).toEqual({
    title: 'Trip notes',
    body: 'Pack the charger.',
  })
})

test('keeps a first line of only # as body text, with no title', () => {
  expect(thoughtToPlainText('#\n\nAfter')).toEqual({ title: null, body: '#\nAfter' })
})

test('keeps a later line of only ### as body text', () => {
  expect(thoughtToPlainText('Before\n\n###')).toEqual({ title: null, body: 'Before\n###' })
})
