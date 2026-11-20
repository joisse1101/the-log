import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { centeringScrollTop, nextScrollTarget, scrollDownToShow } from './centerBox'
import { animateScrollTop, readMotionEase, readMotionMs } from './motion'
import { MAX_TAG_LENGTH, type Thought } from './thought'
import type { SaveResult, ThoughtService } from './thoughtService'
import { KeepBlocked, type UnsavedThoughtStore } from './unsavedThoughtStore'

/** The page counts as already in place when it is this close to where it should be, in pixels. */
const SCROLL_TOLERANCE_PX = 2

/** Below this width the Save button sits under the box and is kept on screen with it (the same breakpoint as the stylesheet). */
const PHONE_QUERY = '(max-width: 39.999rem)'

export const KEEP_BLOCKED_MESSAGE = "This browser can't keep unsaved text. Save before you close the tab."

export const BLANK_MESSAGE = 'A thought needs some text.'
export const STORAGE_MESSAGE = "Couldn't save your thought. Your text is still in the box."

/** The height of the Save row under the box, with the gap above it. */
function actionsHeight(input: HTMLTextAreaElement): number {
  const box = input.closest<HTMLElement>('.thought-box')
  const actions = box?.querySelector<HTMLElement>('.thought-box__actions')
  if (box === null || box === undefined || actions === null || actions === undefined) return 0
  return actions.getBoundingClientRect().height + (Number.parseFloat(getComputedStyle(box).rowGap) || 0)
}

/** A name longer than this is shortened in the message so the line stays readable. */
const SHOWN_TAG_CHARS = 30

export function tagTooLongMessage(tag: string): string {
  const shown = tag.length > SHOWN_TAG_CHARS ? `${tag.slice(0, SHOWN_TAG_CHARS)}…` : tag
  return `Tag “${shown}” is too long (${MAX_TAG_LENGTH} characters at most).`
}

export function failureMessage(failure: Exclude<SaveResult, { ok: true }>): string {
  switch (failure.reason) {
    case 'blank':
      return BLANK_MESSAGE
    case 'tag-too-long':
      return tagTooLongMessage(failure.tag)
    case 'storage':
      return STORAGE_MESSAGE
  }
}

interface ThoughtBoxProps {
  service: ThoughtService
  unsaved: UnsavedThoughtStore
  onSaved: (thought: Thought) => void
  /** The box is folded away; it keeps its text. */
  folded: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  /** What the empty box says; it asks for a first thought until there is one. */
  placeholder: string
}

export function ThoughtBox({ service, unsaved, onSaved, folded, inputRef, placeholder }: ThoughtBoxProps) {
  const [text, setText] = useState(() => unsaved.restore())
  const [error, setError] = useState<string | null>(null)
  const [keepBlocked, setKeepBlocked] = useState(false)

  const fitted = useRef(false)

  const mirrorRef = useRef<HTMLTextAreaElement>(null)
  /** The page's scroll in progress, if any: where it is heading and how to stop it. */
  const pageScroll = useRef<{ target: number; stop: () => void } | null>(null)

  /**
   * Moves the page in step with the box while the user types. The page's scrollTop for the box's
   * final height is worked out once, and the page scrolls to it along the same curve and over
   * the same time as the box's height transition, so the two move together: below the cap, just
   * far enough to keep the box on screen; at the cap, to put the box in the middle of the screen.
   * A later keystroke can only extend the scroll further down, never turn it back.
   */
  const settle = useCallback((input: HTMLTextAreaElement, height: number, atCap: boolean, ms: number, shownHeight: number) => {
    const page = input.closest<HTMLElement>('.app-shell')
    if (page === null || document.activeElement !== input) return
    const margin = Number.parseFloat(getComputedStyle(input).scrollMarginBottom) || 0
    const view = page.getBoundingClientRect()
    const boxTop = input.getBoundingClientRect().top
    if (shownHeight - height > SCROLL_TOLERANCE_PX) {
      // The box is getting shorter, so the page's end comes closer. The browser would pull the page
      // up at once to its new end; scroll there along the box's own curve instead.
      const lastScrollTop = Math.max(0, page.scrollHeight - (shownHeight - height) - page.clientHeight)
      if (page.scrollTop - lastScrollTop <= SCROLL_TOLERANCE_PX) return
      pageScroll.current?.stop()
      const stop = animateScrollTop(page, lastScrollTop, ms, readMotionEase(input, '--motion-ease'), () => {
        pageScroll.current = null
      })
      // Heading up must not hold back a later scroll down, so it never claims a target.
      pageScroll.current = ms > 0 ? { target: Number.NEGATIVE_INFINITY, stop } : null
      return
    }
    // On a phone the Save button sits under the box and is kept on screen with it.
    const extra = atCap && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches ? actionsHeight(input) : 0
    const target = atCap
      ? centeringScrollTop({
          boxTop: boxTop - view.top,
          boxHeight: height + extra,
          viewHeight: page.clientHeight,
          scrollTop: page.scrollTop,
        })
      : page.scrollTop +
        scrollDownToShow({ boxBottom: boxTop + height, margin, viewBottom: view.top + page.clientHeight })
    const next = nextScrollTarget({
      target,
      running: pageScroll.current?.target ?? null,
      current: page.scrollTop,
      tolerance: SCROLL_TOLERANCE_PX,
    })
    if (next === null) return
    pageScroll.current?.stop()
    const stop = animateScrollTop(page, next, ms, readMotionEase(input, '--motion-ease'), () => {
      pageScroll.current = null
    })
    pageScroll.current = ms > 0 ? { target: next, stop } : null
  }, [])

  /**
   * Sets the box's height from its text, between its minimum and its cap, so the change can be
   * animated (field-sizing cannot be). The text is measured in a hidden copy of the box, so the
   * real box, and the page's scroll position, are never disturbed. Without `animate` the box
   * jumps to the new height.
   */
  const fit = useCallback(
    (animate: boolean) => {
      const input = inputRef.current
      const mirror = mirrorRef.current
      if (input === null || mirror === null) return
      const style = getComputedStyle(input)
      const min = Number.parseFloat(style.minHeight) || 0
      const cap = Number.parseFloat(style.maxHeight)
      const border = (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0)
      const shownHeight = input.getBoundingClientRect().height
      mirror.value = input.value
      const wanted = Math.max(mirror.scrollHeight + border, min)
      const height = Number.isFinite(cap) ? Math.min(wanted, cap) : wanted
      if (animate && input.style.height !== '') {
        input.style.height = `${height}px`
      } else {
        input.style.transition = 'none'
        input.style.height = `${height}px`
        void input.offsetHeight
        input.style.transition = ''
      }
      settle(input, height, Number.isFinite(cap) && wanted >= cap, readMotionMs(input, '--motion-grow', 0), shownHeight)
    },
    [inputRef, settle],
  )

  useLayoutEffect(() => {
    if (folded) return
    fit(fitted.current)
    fitted.current = true
  }, [text, folded, fit])

  useEffect(() => {
    const refit = () => fit(false)
    window.addEventListener('resize', refit)
    return () => window.removeEventListener('resize', refit)
  }, [fit])

  function runKeeping(action: () => void) {
    try {
      action()
    } catch (failure: unknown) {
      if (!(failure instanceof KeepBlocked)) throw failure
      setKeepBlocked(true)
    }
  }

  function handleInput(next: string) {
    setText(next)
    runKeeping(() => unsaved.keep(next))
  }

  function save() {
    const result = service.write(text)
    if (!result.ok) {
      setError(failureMessage(result))
      return
    }
    setError(null)
    setText('')
    runKeeping(() => unsaved.clear())
    onSaved(result.thought)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      save()
    }
  }

  return (
    <div className="thought-box">
      <div className="thought-field">
        <textarea
          ref={inputRef}
          className="thought-field__input thought-box__input"
          aria-label="Thought"
          aria-describedby="thought-box-hint"
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            handleInput(event.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setError((current) => (current === BLANK_MESSAGE ? null : current))}
        />
        <textarea
          ref={mirrorRef}
          className="thought-field__input thought-box__input thought-box__mirror"
          aria-hidden="true"
          tabIndex={-1}
          readOnly
          defaultValue=""
        />
        {error === BLANK_MESSAGE && (
          <span className="thought-field__error" role="alert">
            {error}
          </span>
        )}
        <span id="thought-box-hint" className="thought-field__hint">
          Shift + ⏎ to save
        </span>
      </div>
      {keepBlocked && (
        <p className="thought-box__notice" role="status">
          {KEEP_BLOCKED_MESSAGE}
        </p>
      )}
      {error !== null && error !== BLANK_MESSAGE && (
        <p className="thought-box__error" role="alert">
          {error}
        </p>
      )}
      <div className="thought-box__actions">
        <button type="button" className="button button--primary thought-box__save" onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}
