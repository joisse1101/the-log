import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatThoughtTime } from './formatThoughtTime'
import { thoughtToEditText, type Thought } from './thought'
import type { EditResult, ThoughtService } from './thoughtService'
import { useDialogKeys, useOpenerHighlight } from './dialogKeys'
import { failureMessage } from './ThoughtBox'

export const NOT_FOUND_MESSAGE = 'This thought no longer exists.'

function editFailureMessage(failure: Exclude<EditResult, { ok: true }>): string {
  return failure.reason === 'not-found' ? NOT_FOUND_MESSAGE : failureMessage(failure)
}

interface EditThoughtDialogProps {
  service: ThoughtService
  thought: Thought
  onSaved: (thought: Thought) => void
  /** Called as the dialog closes after a save found the thought gone, so the card can leave the log. */
  onMissing: (id: string) => void
  onClose: () => void
}

export function EditThoughtDialog({ service, thought, onSaved, onMissing, onClose }: EditThoughtDialogProps) {
  const [text, setText] = useState(() => thoughtToEditText(thought))
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const missing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  /** Set when a tag error is shown, so the box scrolls to the tags line that caused it. */
  const showTagsLine = useRef(false)

  useLayoutEffect(() => {
    if (error === null || !showTagsLine.current || input.current === null) return
    showTagsLine.current = false
    input.current.scrollTop = input.current.scrollHeight
  }, [error])

  function close() {
    if (missing.current) onMissing(thought.id)
    onClose()
  }

  useDialogKeys(dialog, close)
  useOpenerHighlight()

  function save() {
    const result = service.edit(thought.id, text)
    if (!result.ok) {
      missing.current = result.reason === 'not-found'
      showTagsLine.current = result.reason === 'tag-too-long'
      setError(editFailureMessage(result))
      return
    }
    onSaved(result.thought)
    onClose()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      save()
    }
  }

  return (
    <div className="dialog-layer">
      <div className="dialog-scrim" aria-hidden="true" />
      <div
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        ref={dialog}
        tabIndex={-1}
      >
      <div className="dialog-top">
        <div className="dialog-heading">
          <h2 id="edit-dialog-title" className="edit-dialog__title">
            Edit thought
          </h2>
          <p className="edit-dialog__time">Written {formatThoughtTime(thought.createdAt, new Date())}.<span className="edit-dialog__time-note"> The time stays as it is.</span></p>
        </div>
        <button type="button" className="icon-button" aria-label="Close without saving" onClick={close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="thought-field">
        <textarea
          ref={input}
          className="thought-field__input edit-dialog__input"
          aria-label="Edit thought text"
          aria-describedby="edit-dialog-hint"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <span id="edit-dialog-hint" className="thought-field__hint">
          Shift + ⏎ to save
        </span>
      </div>
      {error !== null && (
        <p className="edit-dialog__error" role="alert">
          {error}
        </p>
      )}
      <p className="edit-dialog__tips">Markdown works. Put your tags on the last line, separated by commas.</p>
      <div className="edit-dialog__actions">
        <button type="button" className="button button--secondary" onClick={close}>
          Cancel
        </button>
        <button type="button" className="button button--primary" onClick={save}>
          Save
        </button>
      </div>
      </div>
    </div>
  )
}
