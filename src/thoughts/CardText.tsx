import { useId, type CSSProperties, useLayoutEffect, useRef, useState } from 'react'
import { CARD_CUT_PX, cardCut, type CardCut } from './cardCut'
import { ThoughtMarkdown } from './ThoughtMarkdown'

interface CardTextProps {
  text: string
}

/** Where the card's text is cut, from the positions of its blocks. */
function cutFor(element: HTMLElement): CardCut {
  const origin = element.getBoundingClientRect().top
  const blocks = Array.from(element.firstElementChild?.children ?? []).map((child) => {
    const rect = child.getBoundingClientRect()
    return { tag: child.tagName, top: rect.top - origin, bottom: rect.bottom - origin }
  })
  return cardCut(blocks)
}

/**
 * A thought's text in a card. Text taller than seven lines is cut there (see `.log-card-text--clamped`
 * in the stylesheet) and gets a "Show more" button; shorter text gets no button.
 */
export function CardText({ text }: CardTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const [cut, setCut] = useState<CardCut | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const id = useId()

  // Measured only while the text is cut: once expanded, it stays a long text.
  useLayoutEffect(() => {
    const element = area.current
    if (element === null || expanded) return
    const measure = () => {
      const isOverflowing = element.scrollHeight > CARD_CUT_PX + 1
      setOverflows(isOverflowing)
      setCut(isOverflowing ? cutFor(element) : null)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])

  const style = cut === null ? undefined : ({ maxHeight: cut.height, '--card-fade': `${cut.fade}px` } as CSSProperties)
  const classes = ['log-card-text']
  if (!expanded) classes.push('log-card-text--clamped')
  if (overflows && !expanded) classes.push('log-card-text--cut')

  return (
    <>
      <div ref={area} id={id} className={classes.join(' ')} style={expanded ? undefined : style}>
        <ThoughtMarkdown className="log-list__text md" text={text} />
      </div>
      {overflows && (
        <button
          type="button"
          className="log-more"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  )
}
