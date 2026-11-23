import { KeepBlocked, type UnsavedThoughtStore } from '../ports/unsavedThoughtStore'
import type { BrowserStorage } from './browserStorage'

export const UNSAVED_ITEM = 'the-log:unsaved-thought'

export class LocalUnsavedThoughtStore implements UnsavedThoughtStore {
  constructor(private readonly storage: BrowserStorage) {}

  keep(text: string): void {
    try {
      this.storage.setItem(UNSAVED_ITEM, text)
    } catch (error: unknown) {
      throw new KeepBlocked({ cause: error })
    }
  }

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
    } catch (removeError: unknown) {
      // A kept text left behind would come back into the box on reload and could be saved twice,
      // so when the item cannot be removed it is emptied instead; restore() reads '' as nothing kept.
      try {
        this.storage.setItem(UNSAVED_ITEM, '')
      } catch {
        throw new KeepBlocked({ cause: removeError })
      }
    }
  }
}
