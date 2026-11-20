import { formatThoughtTime } from './formatThoughtTime'
import type { Thought } from './thought'
import { CardText } from './CardText'

interface LogListProps {
  thoughts: Thought[]
  onEdit: (thought: Thought) => void
  onDelete: (thought: Thought) => void
}

/** Thought text is rendered as markdown elements, never as HTML. */
export function LogList({ thoughts, onEdit, onDelete }: LogListProps) {
  const now = new Date()
  return (
    <ul className="log-list">
      {thoughts.map((thought, index) => (
        <li key={thought.id} className="log-list__row">
          <div className="log-list__rail" aria-hidden="true">
            <span className="log-list__dot" />
            {index < thoughts.length - 1 && <span className="log-list__line" />}
          </div>
          <article className="log-list__item">
          <div className="log-list__header">
            <time className="log-list__time" dateTime={thought.createdAt}>
              {formatThoughtTime(thought.createdAt, now)}
            </time>
            <div className="log-list__buttons">
              <button
                type="button"
                className="icon-button log-list__edit"
                aria-label={`Edit thought, ${formatThoughtTime(thought.createdAt, now)}`}
                onClick={() => onEdit(thought)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger log-list__delete"
                aria-label={`Delete thought, ${formatThoughtTime(thought.createdAt, now)}`}
                onClick={() => onDelete(thought)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
          <CardText text={thought.text} />
          {thought.tags.length > 0 && (
            <ul className="log-list__tags" aria-label="Tags">
              {thought.tags.map((tag) => (
                <li key={tag} className="log-list__tag">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
          </article>
        </li>
      ))}
    </ul>
  )
}
