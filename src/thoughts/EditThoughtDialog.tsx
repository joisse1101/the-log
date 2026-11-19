import { useState, type KeyboardEvent } from 'react'
import { formatThoughtTime } from './formatThoughtTime'
import { thoughtToEditText, type Thought } from './thought'
import type { EditResult, ThoughtService } from './thoughtService'
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
    <div className="edit-dialog" role="dialog" aria-modal="true" aria-label="Edit thought">
      <p className="edit-dialog__time">Written {formatThoughtTime(thought.createdAt, new Date())}. The time stays as it is.</p>
      <textarea
        className="edit-dialog__input"
        aria-label="Edit thought text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {error !== null && (
        <p className="edit-dialog__error" role="alert">
          {error}
        </p>
      )}
      <div className="edit-dialog__actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}
