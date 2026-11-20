import type { BrowserStorage } from './localThoughtStore'

export const UNSAVED_ITEM = 'the-log:unsaved-thought'

/** Thrown when the browser refuses to keep or clear the unsaved text. */
export class KeepBlocked extends Error {
  constructor(options?: ErrorOptions) {
    super('The browser cannot keep unsaved text.', options)
    this.name = 'KeepBlocked'
  }
}

export class UnsavedThoughtStore {
  constructor(private readonly storage: BrowserStorage) {}

  keep(text: string): void {
    try {
      this.storage.setItem(UNSAVED_ITEM, text)
    } catch (error: unknown) {
      throw new KeepBlocked({ cause: error })
    }
  }

  /** Returns the kept text, or an empty string when none is kept or storage is blocked. */
  restore(): string {
    try {
      return this.storage.getItem(UNSAVED_ITEM) ?? ''
    } catch {
      // Blocked storage means nothing can have been kept; the box starts empty.
      return ''
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(UNSAVED_ITEM)
    } catch (error: unknown) {
      throw new KeepBlocked({ cause: error })
    }
  }
}
