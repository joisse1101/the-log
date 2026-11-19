export interface Thought {
  id: string
  text: string
  tags: string[]
  createdAt: string
  editedAt: string | null
}

export const MAX_TAG_LENGTH = 30

export type CreateThoughtResult =
  | { ok: true; thought: Thought }
  | { ok: false; reason: 'blank' }
  | { ok: false; reason: 'tag-too-long'; tag: string }

type ParseTagResult =
  | { ok: true; tag: string | null }
  | { ok: false; reason: 'tag-too-long'; tag: string }

/** A tag is trimmed, loses a leading #, and is lowercased; an empty item gives no tag. */
export function parseTag(raw: string): ParseTagResult {
  const name = raw.trim().replace(/^#/, '').trim().toLowerCase()
  if (name === '') {
    return { ok: true, tag: null }
  }
  if (name.length > MAX_TAG_LENGTH) {
    return { ok: false, reason: 'tag-too-long', tag: name }
  }
  return { ok: true, tag: name }
}

type ParseTextResult =
  | { ok: true; text: string; tags: string[] }
  | { ok: false; reason: 'blank' }
  | { ok: false; reason: 'tag-too-long'; tag: string }

/** Splits off the last line as tags when an empty line comes before it, then parses the tags. */
export function parseThoughtText(raw: string): ParseTextResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'blank' }
  }
  const lines = trimmed.split(/\r?\n/)
  const hasTagsLine = lines.length >= 3 && lines[lines.length - 2].trim() === ''
  if (!hasTagsLine) {
    return { ok: true, text: trimmed, tags: [] }
  }
  const tags: string[] = []
  for (const item of lines[lines.length - 1].split(',')) {
    const parsed = parseTag(item)
    if (!parsed.ok) {
      return parsed
    }
    if (parsed.tag !== null && !tags.includes(parsed.tag)) {
      tags.push(parsed.tag)
    }
  }
  return { ok: true, text: lines.slice(0, -2).join('\n').trimEnd(), tags }
}

/** Rule of the Thought aggregate: text is never blank, tags are unique and 1 to 30 characters. */
export function createThought(text: string, now: Date): CreateThoughtResult {
  const parsed = parseThoughtText(text)
  if (!parsed.ok) {
    return parsed
  }
  return {
    ok: true,
    thought: {
      id: crypto.randomUUID(),
      text: parsed.text,
      tags: parsed.tags,
      createdAt: now.toISOString(),
      editedAt: null,
    },
  }
}
