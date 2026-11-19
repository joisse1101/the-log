import { useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
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
  /** The box is folded away, but keeps its text. */
  folded: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  /** The text has outgrown the normal box, so the box fills the screen. */
  tall: boolean
  onTallChange: (tall: boolean) => void
}

export function ThoughtBox({ service, unsaved, onSaved, folded, inputRef, tall, onTallChange }: ThoughtBoxProps) {
  const [text, setText] = useState(() => unsaved.restore())
  const [error, setError] = useState<string | null>(null)
  const [keepBlocked, setKeepBlocked] = useState(false)

  // The box goes tall when its text overflows the normal cap, and leaves tall only when the text
  // is no taller than the box was at that moment, so deleting one line does not flicker.
  const tallAt = useRef(0)
  useLayoutEffect(() => {
    const input = inputRef.current
    if (input === null || folded) return
    if (!tall) {
      if (input.scrollHeight > input.clientHeight + 1) {
        tallAt.current = input.clientHeight
        onTallChange(true)
      }
      return
    }
    // While tall the box is stretched, so read the height its text alone needs.
    input.style.flex = 'none'
    const textHeight = input.offsetHeight
    input.style.flex = ''
    if (textHeight <= tallAt.current) onTallChange(false)
  }, [text, folded, tall, inputRef, onTallChange])

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
    <div className="thought-box" hidden={folded}>
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
