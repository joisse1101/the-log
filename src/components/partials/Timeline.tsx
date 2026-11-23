import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent, type RefObject, type TouchEvent, type WheelEvent } from 'react'

/** How far a finger must move down, in pixels, to count as a drag down. */
const DRAG_DOWN_DISTANCE = 24

/** A scroll event within this many milliseconds of a size change is taken as caused by it. */
const RESIZE_SCROLL_WINDOW_MS = 150

/** A scroll event within this many milliseconds of a wheel, touch, scrollbar drag or scroll key is the user's. */
const USER_INPUT_WINDOW_MS = 400

/** Keys that scroll the timeline when it has the focus. */
const SCROLL_KEYS = new Set(['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'])

interface TimelineProps {
  scrollRef: RefObject<HTMLDivElement | null>
  /** Called when the timeline scrolls away from its top. */
  onScrolled: () => void
  /** Called when the user drags down or wheels up while the timeline is at its top. */
  onPullDown: () => void
  /** True while the page is animating the box open or shut: a scroll then is not the user's. */
  isAnimating: () => boolean
  children: ReactNode
}

/**
 * The scrolling area that holds the log. Its top or bottom edge fades out where more logs wait
 * to be scrolled to.
 */
export function Timeline({ scrollRef, onScrolled, onPullDown, isAnimating, children }: TimelineProps) {
  const [fades, setFades] = useState({ top: false, bottom: false })
  const touchStart = useRef<number | null>(null)
  const lastSize = useRef({ client: 0, content: 0 })

  const measure = useCallback(() => {
    const area = scrollRef.current
    if (area === null) return
    const top = area.scrollTop > 0
    const bottom = area.scrollTop + area.clientHeight < area.scrollHeight - 1
    setFades((current) => (current.top === top && current.bottom === bottom ? current : { top, bottom }))
  }, [scrollRef])

  useEffect(() => {
    measure()
    const area = scrollRef.current
    if (area === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    if (area.firstElementChild !== null) observer.observe(area.firstElementChild)
    return () => observer.disconnect()
  }, [measure, scrollRef, children])

  // The browser may move scrollTop when the timeline changes size (the box opens or folds, a card
  // is deleted) and then sends a scroll event the user did not make. So a size change is noted,
  // both when it is seen at a commit or by the observer and when it shows between two scroll events.
  const noteSize = useCallback(() => {
    const area = scrollRef.current
    if (area === null) return false
    const size = { client: area.clientHeight, content: area.scrollHeight }
    const changed = size.client !== lastSize.current.client || size.content !== lastSize.current.content
    lastSize.current = size
    return changed
  }, [scrollRef])

  const userInputAt = useRef(Number.NEGATIVE_INFINITY)

  function noteUserInput() {
    userInputAt.current = performance.now()
  }

  const resizedAt = useRef(Number.NEGATIVE_INFINITY)

  const noteResize = useCallback(() => {
    if (noteSize()) resizedAt.current = performance.now()
  }, [noteSize])

  useLayoutEffect(noteResize)

  useEffect(() => {
    const area = scrollRef.current
    if (area === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(noteResize)
    observer.observe(area)
    if (area.firstElementChild !== null) observer.observe(area.firstElementChild)
    return () => observer.disconnect()
  }, [noteResize, scrollRef, children])

  /** Only a scroll the user makes folds the box: one that follows a size change is ignored. */
  function handleScroll() {
    measure()
    const area = scrollRef.current
    if (area === null) return
    const resized = noteSize() || isAnimating() || performance.now() - resizedAt.current < RESIZE_SCROLL_WINDOW_MS
    // A scroll that focus causes (Tab bringing a card into view) follows no user input, so it never folds the box.
    const byUser = performance.now() - userInputAt.current < USER_INPUT_WINDOW_MS
    if (!resized && byUser && area.scrollTop > 0) onScrolled()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Space on a button or link presses it; it does not scroll.
    const pressesControl = event.key === ' ' && event.target instanceof Element && event.target.closest('button, a, input, textarea') !== null
    if (SCROLL_KEYS.has(event.key) && !pressesControl) noteUserInput()
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    noteUserInput()
    if (event.deltaY < 0 && event.currentTarget.scrollTop <= 0) onPullDown()
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = event.touches[0]?.clientY ?? null
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current
    noteUserInput()
    const now = event.touches[0]?.clientY
    if (start === null || now === undefined) return
    if (now - start > DRAG_DOWN_DISTANCE && event.currentTarget.scrollTop <= 0) {
      touchStart.current = null
      onPullDown()
    }
  }

  const classes = ['timeline']
  if (fades.top) classes.push('timeline--fade-top')
  if (fades.bottom) classes.push('timeline--fade-bottom')

  return (
    <div
      ref={scrollRef}
      className={classes.join(' ')}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      onPointerDown={noteUserInput}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {children}
    </div>
  )
}
