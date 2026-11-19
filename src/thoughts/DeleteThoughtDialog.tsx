import { useState } from 'react'
import { formatThoughtTime } from './formatThoughtTime'
import type { Thought } from './thought'
import type { ThoughtService } from './thoughtService'

export const DELETE_FAILED_MESSAGE = "Couldn't delete your thought. It is still in your log."

interface DeleteThoughtDialogProps {
  service: ThoughtService
  thought: Thought
  onDeleted: (id: string) => void
  onClose: () => void
}

export function DeleteThoughtDialog({ service, thought, onDeleted, onClose }: DeleteThoughtDialogProps) {
  const [error, setError] = useState<string | null>(null)

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
    <div className="delete-dialog" role="dialog" aria-modal="true" aria-label="Delete thought">
      <h2 className="delete-dialog__title">Delete this thought?</h2>
      <p className="delete-dialog__time">{formatThoughtTime(thought.createdAt, new Date())}</p>
      <p className="delete-dialog__text">{thought.text}</p>
      <p className="delete-dialog__note">It will no longer show in your log.</p>
      {error !== null && (
        <p className="delete-dialog__error" role="alert">
          {error}
        </p>
      )}
      <div className="delete-dialog__actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={confirm}>
          Delete thought
        </button>
      </div>
    </div>
  )
}
