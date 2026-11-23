/** Thrown when the browser refuses to keep or clear the unsaved text. */
export class KeepBlocked extends Error {
  constructor(options?: ErrorOptions) {
    super('The browser cannot keep unsaved text.', options)
    this.name = 'KeepBlocked'
  }
}

/** Keeps the new-thought box's text until it is saved, so a closed tab loses nothing. */
export interface UnsavedThoughtStore {
  /** Throws KeepBlocked when the browser refuses the write. */
  keep(text: string): void
  /** Returns the kept text, or an empty string when none is kept or storage is blocked. */
  restore(): string
  /** Throws KeepBlocked when the browser refuses the removal. */
  clear(): void
}
