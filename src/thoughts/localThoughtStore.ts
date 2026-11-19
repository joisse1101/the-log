import type { Thought } from './thought'
import { StorageWriteFailed, type ThoughtStore } from './thoughtStore'

export interface BrowserStorage {
  getItem(name: string): string | null
  setItem(name: string, value: string): void
  removeItem(name: string): void
}

export const THOUGHTS_ITEM = 'the-log:thoughts'
const ITEM_VERSION = 1

interface StoredThoughts {
  version: number
  thoughts: Thought[]
}

export class LocalThoughtStore implements ThoughtStore {
  constructor(private readonly storage: BrowserStorage) {}

  all(): Thought[] {
    const raw = this.storage.getItem(THOUGHTS_ITEM)
    if (raw === null) {
      return []
    }
    const stored = JSON.parse(raw) as StoredThoughts
    return stored.thoughts
  }

  add(thought: Thought): void {
    this.write([...this.all(), thought])
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
