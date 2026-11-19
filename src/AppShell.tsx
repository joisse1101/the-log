import { useMemo, useState } from 'react'
import './AppShell.css'
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

  return (
    <main className="app-shell">
      <h1 className="app-shell__title">The Log</h1>
      <ThoughtBox
        service={service}
        unsaved={unsaved}
        onSaved={(thought) => setThoughts((current) => [thought, ...current])}
      />
      <LogList thoughts={thoughts} />
    </main>
  )
}
