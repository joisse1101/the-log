import { useRef, useState } from 'react'
import { formatThoughtTime } from '../formatThoughtTime'
import { useDialogKeys, useOpenerHighlight } from '../dialogKeys'
import { thoughtToPlainText } from './plainText'
import type { Thought } from '../../domain/thought'
import type { ThoughtService } from '../../service/thoughtService'

export const DELETE_FAILED_MESSAGE = "Couldn't delete your thought. It is still in your log."

interface DeleteThoughtDialogProps {
  service: ThoughtService
  thought: Thought
  onDeleted: (id: string) => void
  onClose: () => void
}

export function DeleteThoughtDialog({ service, thought, onDeleted, onClose }: DeleteThoughtDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const plain = thoughtToPlainText(thought.text)
  useDialogKeys(dialog, onClose)
  useOpenerHighlight()

  function confirm() {
    const result = service.delete(thought.id)
    if (!result.ok) {
      setError(DELETE_FAILED_MESSAGE)
      return
    }
    onDeleted(thought.id)
    onClose()
  }

  return (
    <div className="dialog-layer">
      <div className="dialog-scrim" aria-hidden="true" onClick={onClose} />
      <div
        className="delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby={error === null ? 'delete-dialog-note' : undefined}
        ref={dialog}
        tabIndex={-1}
      >
      <h2 id="delete-dialog-title" className="delete-dialog__title">Delete this thought?</h2>
      <div className="delete-dialog__preview">
        <time className="delete-dialog__time" dateTime={thought.createdAt}>
          {formatThoughtTime(thought.createdAt, new Date())}
        </time>
        {plain.title !== null && <p className="delete-dialog__heading">{plain.title}</p>}
        {plain.body !== '' && <p className="delete-dialog__text">{plain.body}</p>}
      </div>
      {error === null && (
        <p id="delete-dialog-note" className="delete-dialog__note">It will no longer show in your log.</p>
      )}
      {error !== null && (
        <p className="delete-dialog__error" role="alert">
          {error}
        </p>
      )}
      <div className="delete-dialog__actions">
        <button type="button" className="button button--secondary" onClick={onClose} autoFocus>
          Cancel
        </button>
        <button type="button" className="button button--danger" onClick={confirm}>
          Delete thought
        </button>
      </div>
      </div>
    </div>
  )
}
