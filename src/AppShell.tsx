import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './AppShell.css'
import { DeleteThoughtDialog } from './thoughts/DeleteThoughtDialog'
import { EditThoughtDialog } from './thoughts/EditThoughtDialog'
import { rememberBottomCard } from './thoughts/keepInView'
import { LocalThoughtStore } from './thoughts/localThoughtStore'
import { LogList } from './thoughts/LogList'
import type { Thought } from './thoughts/thought'
import { ThoughtBox } from './thoughts/ThoughtBox'
import { ThoughtService } from './thoughts/thoughtService'
import { Timeline } from './thoughts/Timeline'
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
  const [folded, setFolded] = useState(false)
  const [tall, setTall] = useState(false)
  const timeline = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const hint = useRef<HTMLButtonElement>(null)
  const focusAfterFold = useRef<'box' | 'hint' | null>(null)
  const keepInView = useRef<(() => void) | null>(null)

  // When the box opens the timeline gets shorter: keep the card that was at its bottom in view.
  useLayoutEffect(() => {
    if (folded) return
    keepInView.current?.()
    keepInView.current = null
  }, [folded])

  // Opening the box from the hint puts focus in the box; saving puts it on the hint.
  useEffect(() => {
    const wanted = focusAfterFold.current
    focusAfterFold.current = null
    if (wanted === 'box' && !folded) box.current?.focus()
    if (wanted === 'hint' && folded) hint.current?.focus()
  }, [folded])

  // After a dialog closes, focus goes back to the button that opened it,
  // or to the heading when that button is gone (its thought was deleted).
  useEffect(() => {
    if (editing !== null || deleting !== null || !returnFocus.current) return
    returnFocus.current = false
    const fallback = folded ? hint.current : heading.current
    const target = opener.current?.isConnected ? opener.current : fallback
    target?.focus()
  }, [editing, deleting, folded])

  function openDialog(open: () => void) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    open()
  }

  function closeDialog(close: () => void) {
    returnFocus.current = true
    close()
  }

  function unfold() {
    if (timeline.current !== null) keepInView.current = rememberBottomCard(timeline.current)
    setFolded(false)
  }

  function openBox() {
    focusAfterFold.current = 'box'
    unfold()
  }

  function saved(thought: Thought) {
    setThoughts((current) => [thought, ...current])
    focusAfterFold.current = 'hint'
    setFolded(true)
    setTall(false)
    if (timeline.current !== null) timeline.current.scrollTop = 0
  }

  const classes = ['app-shell']
  if (folded) classes.push('app-shell--folded')
  if (tall && !folded) classes.push('app-shell--tall')
  if (thoughts.length === 0) classes.push('app-shell--empty')

  return (
    <main className={classes.join(' ')}>
      <header className="app-shell__header">
        <h1 ref={heading} tabIndex={-1} className="app-shell__title">The Log</h1>
        <p className="app-shell__tagline">Write it down. Come back to it later.</p>
      </header>
      {folded && (
        <button ref={hint} type="button" className="fold-hint" onClick={openBox}>
          ↓ Drag down to write a log
        </button>
      )}
      <ThoughtBox service={service} unsaved={unsaved} onSaved={saved} folded={folded} inputRef={box} tall={tall} onTallChange={setTall} />
      <Timeline scrollRef={timeline} onScrolled={() => {
          setFolded(true)
          setTall(false)
        }} onPullDown={() => folded && unfold()}>
        <LogList
          thoughts={thoughts}
          onEdit={(thought) => openDialog(() => setEditing(thought))}
          onDelete={(thought) => openDialog(() => setDeleting(thought))}
        />
      </Timeline>
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
