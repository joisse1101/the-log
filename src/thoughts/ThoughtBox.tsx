import { useRef, useState, type KeyboardEvent } from 'react'
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
}

export function ThoughtBox({ service, unsaved, onSaved }: ThoughtBoxProps) {
  const [text, setText] = useState(() => unsaved.restore())
  const [error, setError] = useState<string | null>(null)
  const [keepBlocked, setKeepBlocked] = useState(false)
  const boxRef = useRef<HTMLTextAreaElement>(null)

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
    boxRef.current?.focus()
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
          ref={boxRef}
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
