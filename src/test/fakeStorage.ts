import type { BrowserStorage } from '../thoughts/adapters/localThoughtStore'

/**
 * In-memory stand-in for browser storage; `failWrites` makes setItem throw like a full disk,
 * `blockedItems` makes setItem throw a SecurityError for the named items only, and
 * `unreadableItems` makes getItem throw a SecurityError for the named items only.
 */
export class FakeStorage implements BrowserStorage {
  readonly items = new Map<string, string>()
  readonly blockedItems = new Set<string>()
  readonly unreadableItems = new Set<string>()
  failWrites = false

  getItem(name: string): string | null {
    if (this.unreadableItems.has(name)) {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    }
    return this.items.get(name) ?? null
  }

  setItem(name: string, value: string): void {
    if (this.blockedItems.has(name)) {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    }
    if (this.failWrites) {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
    this.items.set(name, value)
  }

  removeItem(name: string): void {
    this.items.delete(name)
  }
}
