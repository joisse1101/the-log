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

type ParseTextResult =
  | { ok: true; text: string; tags: string[] }
  | { ok: false; reason: 'blank' }
  | { ok: false; reason: 'tag-too-long'; tag: string }

const LINE_BREAK = /\r?\n/

function isTagsLinePosition(lines: string[]): boolean {
  return lines.length >= 3 && lines[lines.length - 2].trim() === ''
}

/**
 * Reads a line as a comma-separated list where every non-empty item starts with # directly followed
 * by a name. Returns the names (inner spaces collapsed, lowercased), or null when the line is not
 * such a list (an item without #, a "# Heading", or no item at all), so the line stays text.
 */
function readTagsLine(line: string): string[] | null {
  const names: string[] = []
  for (const item of line.split(',')) {
    const trimmed = item.trim()
    if (trimmed === '') {
      continue
    }
    if (!/^#\S/.test(trimmed)) {
      return null
    }
    names.push(trimmed.slice(1).replace(/\s+/g, ' ').toLowerCase())
  }
  return names.length > 0 ? names : null
}

/**
 * Splits off the last line as tags when an empty line comes before it and every non-empty item on it
 * starts with #; otherwise the line stays text. An empty last line after an empty line is an explicit
 * "no tags" line, so a text that ends in a tags-looking line can be shown in the edit box and read
 * back unchanged.
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
  const names = isTagsLinePosition(lines) ? readTagsLine(lines[lines.length - 1]) : null
  if (names === null) {
    return { ok: true, text: trimmed, tags: [] }
  }
  const tags: string[] = []
  for (const name of names) {
    if (name.length > MAX_TAG_LENGTH) {
      return { ok: false, reason: 'tag-too-long', tag: name }
    }
    if (!tags.includes(name)) {
      tags.push(name)
    }
  }
  return { ok: true, text: lines.slice(0, -2).join('\n').trimEnd(), tags }
}

/**
 * The text as the edit dialog shows it: the text, then the tags as "#one, #two" on a last line after
 * an empty line. Without tags, a text whose own last line (after an empty line) is a list of # items
 * gets an empty tags line, so saving it unchanged keeps the text and its (empty) tags.
 */
export function thoughtToEditText(thought: Thought): string {
  if (thought.tags.length > 0) {
    return `${thought.text}\n\n${thought.tags.map((tag) => `#${tag}`).join(', ')}`
  }
  const lines = thought.text.split(LINE_BREAK)
  const endsInTagsLine = isTagsLinePosition(lines) && readTagsLine(lines[lines.length - 1]) !== null
  return endsInTagsLine ? `${thought.text}\n\n` : thought.text
}

/** Rule of the Thought aggregate: createdAt never changes; the new text and tags follow the same rules as create. */
export function reviseThought(thought: Thought, text: string, now: Date): CreateThoughtResult {
  const parsed = parseThoughtText(text)
  if (!parsed.ok) {
    return parsed
  }
  const unchanged =
    parsed.text === thought.text &&
    parsed.tags.length === thought.tags.length &&
    parsed.tags.every((tag, index) => tag === thought.tags[index])
  if (unchanged) {
    return { ok: true, thought }
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
