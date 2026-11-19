import type { Thought } from './thought'

/** Thrown by a store when the browser refuses a write (full or blocked). */
export class StorageWriteFailed extends Error {
  constructor(options?: ErrorOptions) {
    super('Storage write failed', options)
    this.name = 'StorageWriteFailed'
  }
}

export interface ThoughtStore {
  all(): Thought[]
  add(thought: Thought): void
}
