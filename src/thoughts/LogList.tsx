import { formatThoughtTime } from './formatThoughtTime'
import type { Thought } from './thought'

interface LogListProps {
  thoughts: Thought[]
  onEdit: (thought: Thought) => void
}

/** Thought text is rendered as text, never as HTML. */
export function LogList({ thoughts, onEdit }: LogListProps) {
  const now = new Date()
  return (
    <ul className="log-list">
      {thoughts.map((thought) => (
        <li key={thought.id} className="log-list__item">
          <time className="log-list__time" dateTime={thought.createdAt}>
            {formatThoughtTime(thought.createdAt, now)}
          </time>
          <p className="log-list__text">{thought.text}</p>
          {thought.tags.length > 0 && (
            <ul className="log-list__tags">
              {thought.tags.map((tag) => (
                <li key={tag} className="log-list__tag">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="log-list__edit" onClick={() => onEdit(thought)}>
            Edit
          </button>
        </li>
      ))}
    </ul>
  )
}
