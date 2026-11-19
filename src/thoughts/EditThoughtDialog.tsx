import { useRef, useState, type KeyboardEvent } from 'react'
import { formatThoughtTime } from './formatThoughtTime'
import { thoughtToEditText, type Thought } from './thought'
import type { EditResult, ThoughtService } from './thoughtService'
import { useDialogKeys } from './dialogKeys'
import { failureMessage } from './ThoughtBox'

export const NOT_FOUND_MESSAGE = 'This thought no longer exists.'

function editFailureMessage(failure: Exclude<EditResult, { ok: true }>): string {
  return failure.reason === 'not-found' ? NOT_FOUND_MESSAGE : failureMessage(failure)
}

interface EditThoughtDialogProps {
  service: ThoughtService
  thought: Thought
  onSaved: (thought: Thought) => void
  onClose: () => void
}

export function EditThoughtDialog({ service, thought, onSaved, onClose }: EditThoughtDialogProps) {
  const [text, setText] = useState(() => thoughtToEditText(thought))
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  useDialogKeys(dialog, onClose)

  function save() {
    const result = service.edit(thought.id, text)
    if (!result.ok) {
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
      <div className="dialog-scrim" aria-hidden="true" onClick={onClose} />
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
          <p className="edit-dialog__time">Written {formatThoughtTime(thought.createdAt, new Date())}. The time stays as it is.</p>
        </div>
        <button type="button" className="icon-button" aria-label="Close without saving" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="thought-field">
        <textarea
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
      <p className="edit-dialog__tips">Put your tags on the last line, separated by commas.</p>
      <div className="edit-dialog__actions">
        <button type="button" className="button button--secondary" onClick={onClose}>
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
