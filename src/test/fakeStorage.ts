import type { BrowserStorage } from '../thoughts/localThoughtStore'

/** In-memory stand-in for browser storage; `failWrites` makes setItem throw like a full disk. */
export class FakeStorage implements BrowserStorage {
  readonly items = new Map<string, string>()
  failWrites = false

  getItem(name: string): string | null {
    return this.items.get(name) ?? null
  }

  setItem(name: string, value: string): void {
    if (this.failWrites) {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
    this.items.set(name, value)
  }

  removeItem(name: string): void {
    this.items.delete(name)
  }
}
