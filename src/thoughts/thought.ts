export interface Thought {
  id: string
  text: string
  tags: string[]
  createdAt: string
  editedAt: string | null
}

export type CreateThoughtResult =
  | { ok: true; thought: Thought }
  | { ok: false; reason: 'blank' }

/** Rule of the Thought aggregate: text is never blank. */
export function createThought(text: string, now: Date): CreateThoughtResult {
  const trimmed = text.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'blank' }
  }
  return {
    ok: true,
    thought: {
      id: crypto.randomUUID(),
      text: trimmed,
      tags: [],
      createdAt: now.toISOString(),
      editedAt: null,
    },
  }
}
