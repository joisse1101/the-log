/** The part of the browser's storage (localStorage) the adapters use; tests pass a fake. */
export interface BrowserStorage {
  getItem(name: string): string | null
  setItem(name: string, value: string): void
  removeItem(name: string): void
}
