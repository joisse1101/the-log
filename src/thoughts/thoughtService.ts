import { createThought, type Thought } from './thought'
import { StorageWriteFailed, type ThoughtStore } from './thoughtStore'

export type SaveResult =
  | { ok: true; thought: Thought }
  | { ok: false; reason: 'blank' | 'storage' }

export class ThoughtService {
  constructor(
    private readonly store: ThoughtStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  write(text: string): SaveResult {
    const created = createThought(text, this.now())
    if (!created.ok) {
      return created
    }
    try {
      this.store.add(created.thought)
    } catch (error: unknown) {
      if (error instanceof StorageWriteFailed) {
        return { ok: false, reason: 'storage' }
      }
      throw error
    }
    return { ok: true, thought: created.thought }
  }

  /** Local thoughts, newest first. */
  list(): Thought[] {
    return [...this.store.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}
