# Thoughts: reference

## Browser storage

| Item | Holds | Written when |
|---|---|---|
| `the-log:thoughts` | `{version: 1, thoughts: [{id, text, tags, createdAt, editedAt}]}` | A thought is saved, edited or deleted |
| `the-log:unsaved-thought` | The new-thought box's text, as typed | On every input; removed after a successful save |

- `id` comes from `crypto.randomUUID()`.
- `createdAt` and `editedAt` are ISO 8601 times in UTC, and `editedAt` is `null` until the first edit.
- `tags` holds lowercased names without the `#`.

## Limits

| Limit | Value | Where |
|---|---|---|
| Tag name | 1 to 30 characters, counted without the `#` | `MAX_TAG_LENGTH` in `src/thoughts/thought.ts` |
| Card text before "Show more" | 7 lines | `src/thoughts/CardText.tsx` |
| Line of card text | 65 characters | `max-width: 65ch` in `src/AppShell.css` |

## Time formats

| Written | Shown as |
|---|---|
| Today | `Today, 09:41` |
| Yesterday | `Yesterday, 21:15` |
| Earlier this year | `Sun 15 Nov, 22:10` |
| An earlier year | `Thu 16 Oct 2025, 07:50` |

Times show in the browser's local time (`src/thoughts/formatThoughtTime.ts`).

## Calls

| Call | Takes | Returns |
|---|---|---|
| `ThoughtService.write(text)` | The box text, tags on its last line | `{ok: true, thought}`, or `{ok: false, reason}` with reason `blank`, `storage` or `tag-too-long` (with `tag`) |
| `ThoughtService.edit(id, text)` | The thought id and the dialog text | `{ok: true, thought}`, or reason `not-found`, `blank`, `storage` or `tag-too-long` |
| `ThoughtService.delete(id)` | The thought id, after confirmation | `{ok: true}`, or reason `storage` |
| `ThoughtService.list()` | Nothing | The local thoughts, newest first; an empty list when the item is missing or cannot be read |
| `parseThoughtText(raw)` in `src/thoughts/thought.ts` | The full text | The text and its tags, or reason `blank` or `tag-too-long` |
| `UnsavedThoughtStore.keep(text)`, `restore()`, `clear()` | The box text | The kept text on `restore()`; `keep` throws `KeepBlocked` when storage is blocked |
