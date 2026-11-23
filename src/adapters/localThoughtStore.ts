import type { Thought } from '../domain/thought'
import type { BrowserStorage } from './browserStorage'
import { StorageWriteFailed, type ThoughtStore } from '../ports/thoughtStore'

export const THOUGHTS_ITEM = 'the-log:thoughts'
const ITEM_VERSION = 1

interface StoredThoughts {
  version: number
  thoughts: Thought[]
}

function isThought(value: unknown): value is Thought {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const thought = value as Record<string, unknown>
  return (
    typeof thought.id === 'string' &&
    typeof thought.text === 'string' &&
    typeof thought.createdAt === 'string' &&
    (thought.editedAt === null || typeof thought.editedAt === 'string') &&
    Array.isArray(thought.tags) &&
    thought.tags.every((tag) => typeof tag === 'string')
  )
}

function isStoredThoughts(value: unknown): value is StoredThoughts {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const thoughts = (value as { thoughts?: unknown }).thoughts
  return Array.isArray(thoughts) && thoughts.every(isThought)
}

export class LocalThoughtStore implements ThoughtStore {
  constructor(private readonly storage: BrowserStorage) {}

  all(): Thought[] {
    // Blocked storage or corrupt data must not blank the app; the read falls back to an empty
    // log and leaves the stored item untouched.
    try {
      return this.read()
    } catch {
      return []
    }
  }

  get(id: string): Thought | undefined {
    return this.all().find((thought) => thought.id === id)
  }

  add(thought: Thought): void {
    this.write([...this.readForWrite(), thought])
  }

  replace(thought: Thought): void {
    this.write(this.readForWrite().map((stored) => (stored.id === thought.id ? thought : stored)))
  }

  remove(id: string): void {
    this.write(this.readForWrite().filter((stored) => stored.id !== id))
  }

  /** Returns the stored thoughts, an empty list when never written; throws when unreadable or corrupt. */
  private read(): Thought[] {
    const raw = this.storage.getItem(THOUGHTS_ITEM)
    if (raw === null) {
      return []
    }
    const stored: unknown = JSON.parse(raw)
    if (!isStoredThoughts(stored)) {
      throw new Error('The stored thoughts have an unexpected shape.')
    }
    return stored.thoughts
  }

  /** A write must never replace an item it cannot read, or every stored thought would be lost. */
  private readForWrite(): Thought[] {
    try {
      return this.read()
    } catch (error: unknown) {
      throw new StorageWriteFailed({ cause: error })
    }
  }

  private write(thoughts: Thought[]): void {
    const stored: StoredThoughts = { version: ITEM_VERSION, thoughts }
    try {
      this.storage.setItem(THOUGHTS_ITEM, JSON.stringify(stored))
    } catch (error: unknown) {
      throw new StorageWriteFailed({ cause: error })
    }
  }
}
