import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { readMotionMs } from './motion'
import { MAX_TAG_LENGTH, type Thought } from './thought'
import type { SaveResult, ThoughtService } from './thoughtService'
import { KeepBlocked, type UnsavedThoughtStore } from './unsavedThoughtStore'

export const KEEP_BLOCKED_MESSAGE = "This browser can't keep unsaved text. Save before you close the tab."

export const BLANK_MESSAGE = 'A thought needs some text.'
export const STORAGE_MESSAGE = "Couldn't save your thought. Your text is still in the box."

export function tagTooLongMessage(tag: string): string {
  return `Tag “${tag}” is too long (${MAX_TAG_LENGTH} characters at most).`
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
}

export function ThoughtBox({ service, unsaved, onSaved, folded, inputRef }: ThoughtBoxProps) {
  const [text, setText] = useState(() => unsaved.restore())
  const [error, setError] = useState<string | null>(null)
  const [keepBlocked, setKeepBlocked] = useState(false)

  const fitted = useRef(false)

  /**
   * Sets the box's height from its text, between its minimum and its cap, so the change can be
   * animated (field-sizing cannot be). Without `animate` the box jumps to the new height.
   */
  const fit = useCallback(
    (animate: boolean) => {
      const input = inputRef.current
      if (input === null) return
      const style = getComputedStyle(input)
      const min = Number.parseFloat(style.minHeight) || 0
      const cap = Number.parseFloat(style.maxHeight)
      const border = (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0)
      const before = input.offsetHeight
      input.style.transition = 'none'
      input.style.height = '0px'
      const wanted = Math.max(input.scrollHeight + border, min)
      input.style.height = `${animate ? before : wanted}px`
      void input.offsetHeight
      input.style.transition = ''
      input.style.height = `${Number.isFinite(cap) ? Math.min(wanted, cap) : wanted}px`
    },
    [inputRef],
  )

  useLayoutEffect(() => {
    if (folded) return
    fit(fitted.current)
    fitted.current = true
    // Once the box has grown, bring it fully on screen when it has focus, wherever the caret is.
    const reveal = window.setTimeout(() => {
      const input = inputRef.current
      if (input !== null && document.activeElement === input) {
        input.scrollIntoView?.({ block: 'nearest' })
      }
    }, readMotionMs(inputRef.current, '--motion-grow', 0) + 20)
    return () => window.clearTimeout(reveal)
  }, [text, folded, fit, inputRef])

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
          placeholder="Write a thought"
          value={text}
          onChange={(event) => {
            handleInput(event.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
        />
        <span id="thought-box-hint" className="thought-field__hint">
          Shift + ⏎ to save
        </span>
      </div>
      {keepBlocked && (
        <p className="thought-box__notice" role="status">
          {KEEP_BLOCKED_MESSAGE}
        </p>
      )}
      {error !== null && (
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
