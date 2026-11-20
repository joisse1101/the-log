import type { Thought } from '../domain/thought'

/** Thrown by a store when the browser refuses a write (full or blocked). */
export class StorageWriteFailed extends Error {
  constructor(options?: ErrorOptions) {
    super('Storage write failed', options)
    this.name = 'StorageWriteFailed'
  }
}

export interface ThoughtStore {
  all(): Thought[]
  /** Reads the store again, so a thought removed by another tab is not found. */
  get(id: string): Thought | undefined
  add(thought: Thought): void
  replace(thought: Thought): void
  remove(id: string): void
}
