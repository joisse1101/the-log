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

const LINE_BREAK = /\r?\n/

function isTagsLinePosition(lines: string[]): boolean {
  return lines.length >= 3 && lines[lines.length - 2].trim() === ''
}

/**
 * Splits off the last line as tags when an empty line comes before it, then parses the tags.
 * An empty last line after an empty line is an explicit "no tags" line, so a text that ends in
 * a line after an empty line can be shown in the edit box and read back unchanged.
 */
export function parseThoughtText(raw: string): ParseTextResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'blank' }
  }
  const rawLines = raw.trimStart().split(LINE_BREAK)
  if (rawLines[rawLines.length - 1].trim() === '' && isTagsLinePosition(rawLines)) {
    return { ok: true, text: rawLines.slice(0, -2).join('\n').trimEnd(), tags: [] }
  }
  const lines = trimmed.split(LINE_BREAK)
  if (!isTagsLinePosition(lines)) {
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

/**
 * The text as the edit dialog shows it: the text, then the tags on a last line after an empty line.
 * Without tags, a text that would be read as having a tags line gets an empty tags line, so saving
 * it unchanged keeps the text and its (empty) tags.
 */
export function thoughtToEditText(thought: Thought): string {
  if (thought.tags.length > 0) {
    return `${thought.text}\n\n${thought.tags.join(', ')}`
  }
  return isTagsLinePosition(thought.text.split(LINE_BREAK)) ? `${thought.text}\n\n` : thought.text
}

/** Rule of the Thought aggregate: createdAt never changes; the new text and tags follow the same rules as create. */
export function reviseThought(thought: Thought, text: string, now: Date): CreateThoughtResult {
  const parsed = parseThoughtText(text)
  if (!parsed.ok) {
    return parsed
  }
  return {
    ok: true,
    thought: { ...thought, text: parsed.text, tags: parsed.tags, editedAt: now.toISOString() },
  }
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
