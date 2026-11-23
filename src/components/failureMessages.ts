import { MAX_TAG_LENGTH } from '../domain/thought'
import type { SaveResult } from '../service/thoughtService'

/** The words shown when writing or editing a thought fails; the new-thought box and the edit dialog share them. */

export const BLANK_MESSAGE = 'A thought needs some text.'
export const STORAGE_MESSAGE = "Couldn't save your thought. Your text is still in the box."

/** A name longer than this is shortened in the message so the line stays readable. */
const SHOWN_TAG_CHARS = 30

export function tagTooLongMessage(tag: string): string {
  const shown = tag.length > SHOWN_TAG_CHARS ? `${tag.slice(0, SHOWN_TAG_CHARS)}…` : tag
  return `Tag “${shown}” is too long (${MAX_TAG_LENGTH} characters at most).`
}

export function failureMessage(failure: Exclude<SaveResult, { ok: true }>): string {
  switch (failure.reason) {
    case 'blank':
      return BLANK_MESSAGE
    case 'tag-too-long':
      return tagTooLongMessage(failure.tag)
    case 'storage':
      return STORAGE_MESSAGE
  }
}
