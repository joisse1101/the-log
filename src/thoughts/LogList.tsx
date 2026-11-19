import { formatThoughtTime } from './formatThoughtTime'
import type { Thought } from './thought'

interface LogListProps {
  thoughts: Thought[]
}

/** Thought text is rendered as text, never as HTML. */
export function LogList({ thoughts }: LogListProps) {
  const now = new Date()
  return (
    <ul className="log-list">
      {thoughts.map((thought) => (
        <li key={thought.id} className="log-list__item">
          <time className="log-list__time" dateTime={thought.createdAt}>
            {formatThoughtTime(thought.createdAt, now)}
          </time>
          <p className="log-list__text">{thought.text}</p>
        </li>
      ))}
    </ul>
  )
}
