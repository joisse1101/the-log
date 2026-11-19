import { useEffect, useMemo, useRef, useState } from 'react'
import './AppShell.css'
import { DeleteThoughtDialog } from './thoughts/DeleteThoughtDialog'
import { EditThoughtDialog } from './thoughts/EditThoughtDialog'
import { LocalThoughtStore } from './thoughts/localThoughtStore'
import { LogList } from './thoughts/LogList'
import type { Thought } from './thoughts/thought'
import { ThoughtBox } from './thoughts/ThoughtBox'
import { ThoughtService } from './thoughts/thoughtService'
import { UnsavedThoughtStore } from './thoughts/unsavedThoughtStore'

export default function AppShell() {
  const service = useMemo(() => new ThoughtService(new LocalThoughtStore(localStorage)), [])
  const unsaved = useMemo(() => new UnsavedThoughtStore(localStorage), [])
  const [thoughts, setThoughts] = useState<Thought[]>(() => service.list())
  const [editing, setEditing] = useState<Thought | null>(null)
  const [deleting, setDeleting] = useState<Thought | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const returnFocus = useRef(false)

  // After a dialog closes, focus goes back to the button that opened it,
  // or to the heading when that button is gone (its thought was deleted).
  useEffect(() => {
    if (editing !== null || deleting !== null || !returnFocus.current) return
    returnFocus.current = false
    const target = opener.current?.isConnected ? opener.current : heading.current
    target?.focus()
  }, [editing, deleting])

  function openDialog(open: () => void) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    open()
  }

  function closeDialog(close: () => void) {
    returnFocus.current = true
    close()
  }

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <h1 ref={heading} tabIndex={-1} className="app-shell__title">The Log</h1>
        <p className="app-shell__tagline">Write it down. Come back to it later.</p>
      </header>
      <ThoughtBox
        service={service}
        unsaved={unsaved}
        onSaved={(thought) => setThoughts((current) => [thought, ...current])}
      />
      <LogList
        thoughts={thoughts}
        onEdit={(thought) => openDialog(() => setEditing(thought))}
        onDelete={(thought) => openDialog(() => setDeleting(thought))}
      />
      {deleting !== null && (
        <DeleteThoughtDialog
          key={deleting.id}
          service={service}
          thought={deleting}
          onDeleted={(id) => setThoughts((current) => current.filter((thought) => thought.id !== id))}
          onClose={() => closeDialog(() => setDeleting(null))}
        />
      )}
      {editing !== null && (
        <EditThoughtDialog
          key={editing.id}
          service={service}
          thought={editing}
          onSaved={(saved) =>
            setThoughts((current) => current.map((thought) => (thought.id === saved.id ? saved : thought)))
          }
          onClose={() => closeDialog(() => setEditing(null))}
        />
      )}
    </main>
  )
}
