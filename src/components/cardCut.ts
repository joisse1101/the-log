/** Height of one line of card text, in pixels (16px at a line height of 1.75). */
const LINE_PX = 28
const CUT_LINES = 7
const MIN_KEPT_LINES = 3

/** The height at which a card's text is cut when no block gets in the way. */
export const CARD_CUT_PX = CUT_LINES * LINE_PX

const DEFAULT_FADE_PX = LINE_PX
const LONG_FADE_PX = LINE_PX * 1.5

/** Blocks that look broken when sliced through the middle. Paragraphs and lists are cut at a line instead. */
const UNSLICEABLE_TAGS = new Set(['PRE', 'TABLE', 'BLOCKQUOTE'])

export interface CardBlock {
  tag: string
  /** Distance from the top of the card text to the block's top edge. */
  top: number
  /** Distance from the top of the card text to the block's bottom edge. */
  bottom: number
}

export interface CardCut {
  /** The height of the visible text. */
  height: number
  /** The height of the fade at the foot of it. */
  fade: number
}

/**
 * Where to cut a card's text. Normally at seven lines. A code block, table or quote that
 * straddles that line is left out whole, unless that would leave fewer than three lines;
 * then the seven-line cut stays and its fade grows to one and a half lines.
 */
export function cardCut(blocks: CardBlock[]): CardCut {
  const straddler = blocks.find(
    (block) => UNSLICEABLE_TAGS.has(block.tag) && block.top < CARD_CUT_PX && block.bottom > CARD_CUT_PX,
  )
  if (straddler === undefined) return { height: CARD_CUT_PX, fade: DEFAULT_FADE_PX }
  if (straddler.top >= MIN_KEPT_LINES * LINE_PX) {
    // Cut where the block before it ends, so the gap between the last shown line and "Show more" is not the block's own margin.
    const before = blocks.filter((block) => block.bottom <= straddler.top)
    const height = before.length > 0 ? Math.max(...before.map((block) => block.bottom)) : straddler.top
    return { height, fade: 0 }
  }
  return { height: CARD_CUT_PX, fade: LONG_FADE_PX }
}
