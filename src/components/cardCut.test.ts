import { expect, test } from 'vitest'
import { CARD_CUT_PX, cardCut } from './cardCut'

test('cuts a paragraph at exactly seven lines', () => {
  expect(cardCut([{ tag: 'P', top: 0, bottom: 400 }])).toEqual({ height: CARD_CUT_PX, fade: 28 })
})

test('cuts at the bottom of the block before a code block that straddles the seven-line mark', () => {
  const cut = cardCut([
    { tag: 'P', top: 0, bottom: 112 },
    { tag: 'PRE', top: 128, bottom: 300 },
  ])
  expect(cut).toEqual({ height: 112, fade: 0 })
})

test('keeps a code block that ends before the seven-line mark and cuts after it', () => {
  const cut = cardCut([
    { tag: 'PRE', top: 0, bottom: 150 },
    { tag: 'P', top: 166, bottom: 400 },
  ])
  expect(cut).toEqual({ height: CARD_CUT_PX, fade: 28 })
})

test('keeps the seven-line cut with a longer fade when the straddling block leaves under three lines', () => {
  const cut = cardCut([
    { tag: 'P', top: 0, bottom: 28 },
    { tag: 'PRE', top: 44, bottom: 400 },
  ])
  expect(cut).toEqual({ height: CARD_CUT_PX, fade: 42 })
})
