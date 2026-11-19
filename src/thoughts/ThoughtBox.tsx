import { useRef, useState, type KeyboardEvent } from 'react'
import type { Thought } from './thought'
import type { ThoughtService } from './thoughtService'

export const BLANK_MESSAGE = 'A thought needs some text.'
export const STORAGE_MESSAGE = "Couldn't save your thought. Your text is still in the box."

interface ThoughtBoxProps {
  service: ThoughtService
  onSaved: (thought: Thought) => void
}

export function ThoughtBox({ service, onSaved }: ThoughtBoxProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  function save() {
    const result = service.write(text)
    if (!result.ok) {
      setError(result.reason === 'blank' ? BLANK_MESSAGE : STORAGE_MESSAGE)
      return
    }
    setError(null)
    setText('')
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
      <textarea
        ref={boxRef}
        className="thought-box__input"
        aria-label="Thought"
        placeholder="Write a thought"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error !== null && (
        <p className="thought-box__error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="thought-box__save" onClick={save}>
        Save
      </button>
    </div>
  )
}
