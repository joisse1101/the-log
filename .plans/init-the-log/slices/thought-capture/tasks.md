# Tasks

## write-thought

- [x] T-thought-capture-write-save Save a typed thought and show it at the top of the log
  Satisfies: AC-thought-capture-write-saved (steps 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.7, 2.8, 2.9, 3.2, 3.3)
  Verify: With browser storage stubbed empty, type "First thought" and press Shift + Enter; the log shows it first with "Today, HH:MM" at the current time, and item the-log:thoughts holds one thought with a UUID id, createdAt set and editedAt null.
  result: npm test -> 24 passed, 0 failed (AppShell save test covers Today HH:MM, UUID id, editedAt null); tsc --noEmit -> clean
- [x] T-thought-capture-write-empty-box Empty the box after a successful save
  Satisfies: AC-thought-capture-write-box-empties (steps 2.9, 3.1)
  Verify: After saving "First thought", the box is empty and keeps focus, and typing "Second" then saving adds a second thought above the first.
  result: npm test -> 24 passed, 0 failed (box empty, focus kept, second thought above first); tsc --noEmit -> clean
- [x] T-thought-capture-write-blank Refuse blank text
  Satisfies: AC-thought-capture-write-blank (steps 1.4, 1.5, 1.6)
  Verify: Save with an empty box and again with "   "; each time "A thought needs some text." shows (failure response "Blank text on write") and item the-log:thoughts is unchanged.
  result: npm test -> 24 passed, 0 failed ('' and '   ' show "A thought needs some text.", stored item absent); tsc --noEmit -> clean
- [x] T-thought-capture-write-storage-fails Keep the text when the storage write fails
  Satisfies: AC-thought-capture-write-save-fails, AC-thought-capture-device-save-fails (steps 2.3, 2.4, 2.5, 2.6)
  Verify: Stub setItem to throw a QuotaExceededError, type "Lost?" and save; "Couldn't save your thought. Your text is still in the box." shows (failure responses "Storage write fails on write" and its device row), the box still holds "Lost?" and the log is unchanged.
  result: npm test -> 24 passed, 0 failed (failing write shows the storage message, box keeps "Lost?", log and stored item unchanged); tsc --noEmit -> clean
- [x] T-thought-capture-write-local-only Save as a local thought with no place choice
  Satisfies: AC-thought-capture-device-save (steps 1.1, 2.1, 2.2, 2.7)
  Verify: Render the app; no control to choose where a thought is saved exists, and saving "Here" writes it to item the-log:thoughts and makes no network request (rule "Nothing leaves the device"; spy on fetch and see no call).
  result: npm test -> 24 passed, 0 failed (no place-choice control, fetch spy not called, thought written to the-log:thoughts); tsc --noEmit -> clean; python scripts/check_docs.py -> docs check passed

## tag-thought

- [x] T-thought-capture-tag-save Read tags from the last line and save them with the thought
  Satisfies: AC-thought-capture-tag-saved (steps 1.1, 1.2, 1.3, 1.4, 1.9, 1.10, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6)
  Verify: Save "Read tonight", an empty line, then "#books, #reading list"; the stored thought has text "Read tonight" and tags [books, reading list], and the card shows #books and #reading list. Edit that thought's last line to "#books, #home" and save; the stored tags become [books, home]. A last line "books, notes" or "#books, notes" stays part of the text and the thought has no tags.
  result: npx vitest run --dir src -> exit code 0 (14 files, 247 tests passed); npx tsc --noEmit -p . -> exit code 0; # rule: thought.test.ts and AppShell.test.tsx cover "#books, #notes" saved as tags, spaced tags, edit to "#books, #home", and "Hi", an empty line, "#books, notes" staying text with no tags
- [x] T-thought-capture-tag-normalise Treat tags that differ only in case or spaces as one tag
  Satisfies: AC-thought-capture-tag-same (steps 1.4, 1.9, 1.10)
  Verify: Save a thought whose tags line is "#Books,  #books , #BOOKS"; it is stored with the single tag books.
  result: npx vitest run --dir src -> exit code 0 (14 files, 247 tests passed); "#Books,  #books , #BOOKS" stores the single tag books
- [x] T-thought-capture-tag-too-long Refuse a tag over 30 characters
  Satisfies: AC-thought-capture-tag-too-long (steps 1.5, 1.6, 1.7, 1.8)
  Verify: Save a thought whose tags line holds a 31-character tag; "Tag “<that tag>” is too long (30 characters at most)." shows (failure response "Tag too long"), the box keeps the text and nothing is stored; a 30-character tag saves.
  result: npm test -- --run -> 34 passed; a 31-character tag shows "Tag “<tag>” is too long (30 characters at most).", the box keeps its text and nothing is stored; a 30-character tag saves
- [x] T-thought-capture-tag-empty Drop empty tags
  Satisfies: AC-thought-capture-tag-empty (steps 1.4, 1.9)
  Verify: Save a thought whose tags line is "#books, , ,#notes"; it is stored with tags [books, notes] and no empty tag.
  result: npx vitest run --dir src -> exit code 0 (14 files, 247 tests passed); "#books, , ,#notes" stores [books, notes]

## keep-unsaved-thought

- [x] T-thought-capture-unsaved-restore Keep typed text and restore it on reopen
  Satisfies: AC-thought-capture-unsaved-reopen (steps 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5)
  Verify: Type "Half a thought" without saving; item the-log:unsaved-thought holds it. Unmount and render the app again with the same stubbed storage; the box shows "Half a thought".
  result: npx vitest run -> 6 files, 42 tests passed; npx tsc --noEmit -p . -> no errors; python scripts/check_docs.py -> passed
- [x] T-thought-capture-unsaved-after-failure Keep the text after a failed save so the user can retry
  Satisfies: AC-thought-capture-unsaved-save-fails (steps 3.1, 3.2, 3.3, 3.4)
  Verify: Type "Retry me", make the thoughts write throw and save; the box and item the-log:unsaved-thought still hold "Retry me" (failure response "Save fails while text is kept"). Let the write succeed and save again; the thought is stored.
  result: npx vitest run -> 6 files, 42 tests passed; npx tsc --noEmit -p . -> no errors; python scripts/check_docs.py -> passed
- [x] T-thought-capture-unsaved-clear Clear the kept text after a successful save
  Satisfies: AC-thought-capture-unsaved-cleared (steps 3.1, 3.2, 3.5, 3.6, 3.7)
  Verify: Type "Done" and save; item the-log:unsaved-thought is removed, and rendering the app again shows an empty box.
  result: npx vitest run -> 6 files, 42 tests passed; npx tsc --noEmit -p . -> no errors; python scripts/check_docs.py -> passed
- [x] T-thought-capture-unsaved-blocked Keep working when the browser blocks keeping text
  Satisfies: AC-thought-capture-unsaved-blocked (steps 1.4, 1.5, 1.6)
  Verify: Stub setItem for the-log:unsaved-thought to throw a SecurityError and type several letters; "This browser can't keep unsaved text. Save before you close the tab." shows exactly once (failure response "Unsaved text cannot be kept"), and saving still stores the thought.
  result: npx vitest run -> 6 files, 42 tests passed; npx tsc --noEmit -p . -> no errors; python scripts/check_docs.py -> passed

## edit-thought

- [x] T-thought-capture-edit-save Edit a thought and keep its original time
  Satisfies: AC-thought-capture-edit-saved (steps 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.8, 2.9, 2.13, 3.1, 3.2, 3.7, 3.8, 3.9, 3.10)
  Verify: Seed one thought created at 2026-11-13T19:30Z; open Edit, change the text to "Fixed" and save; the card shows "Fixed" with the original time, and the stored thought keeps createdAt and has editedAt set to now.
  result: npx tsc --noEmit -p . -> no errors; npm test -> 53 passed, 0 failed; test "edits a thought: the card shows the new text with the original time and editedAt is set" passes
- [x] T-thought-capture-edit-gone Tell the user the thought no longer exists
  Satisfies: AC-thought-capture-edit-gone (steps 2.5, 2.6, 2.7)
  Verify: Open Edit on a seeded thought, then remove it from item the-log:thoughts as another tab would, and save; "This thought no longer exists." shows (failure response "Edited thought is gone") and the dialog stays open with the text.
  result: npm test -> 53 passed; test "tells the user the thought no longer exists and keeps the dialog open with the text" passes
- [x] T-thought-capture-edit-storage-fails Keep the change when the storage write fails
  Satisfies: AC-thought-capture-edit-save-fails (steps 3.3, 3.4, 3.5, 3.6)
  Verify: Open Edit, change the text, make setItem throw and save; "Couldn't save your thought. Your text is still in the box." shows (failure response "Storage write fails on edit"), the dialog stays open with the change and the stored thought is unchanged.
  result: npm test -> 53 passed; test "keeps the dialog and the stored thought when the storage write fails on edit" passes
- [x] T-thought-capture-edit-blank Refuse a blank edit
  Satisfies: AC-thought-capture-edit-blank (steps 2.10, 2.11, 2.12)
  Verify: Open Edit, clear all the text and save; "A thought needs some text." shows (failure response "Blank text on edit") and the stored thought is unchanged.
  result: npm test -> 53 passed; test "refuses a blank edit and leaves the stored thought unchanged" passes

## delete-thought

- [x] T-thought-capture-delete-confirm Delete a thought after confirmation
  Satisfies: AC-thought-capture-delete-confirmed (steps 1.1, 1.2, 1.3, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13)
  Verify: Seed two thoughts; press Delete on one, see "Delete this thought?" with its time and text and no mention of a gist, press Delete thought; the card is gone and item the-log:thoughts holds only the other thought.
  result: npx tsc --noEmit -p . -> no errors; npm test -> 6 files, 58 tests passed, 0 failed, including the seeded-two-thoughts delete-confirm test with stubbed storage
- [x] T-thought-capture-delete-cancel Keep the thought when the user cancels
  Satisfies: AC-thought-capture-delete-cancelled (steps 1.4, 1.5)
  Verify: Press Delete on a seeded thought, then Cancel; the dialog closes, the card is still there and item the-log:thoughts is unchanged.
  result: npx tsc --noEmit -p . -> no errors; npm test -> 6 files, 58 tests passed, 0 failed, including the cancel test: dialog closed, card kept, item the-log:thoughts unchanged

## open-log

- [x] T-thought-capture-log-show Show local thoughts newest first
  Satisfies: AC-thought-capture-device-log (steps 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7)
  Verify: Seed three thoughts created today 09:41, yesterday 21:15 and on Sun 15 Nov 22:10; the log shows them in that order as "Today, 09:41", "Yesterday, 21:15" and "Sun 15 Nov, 22:10", each with its text and tags; a thought whose text is "<b>hi</b>" shows those characters literally (rule "rendered as text, never as HTML"); with the item missing the log shows no thoughts and no error; a time stored in UTC shows in the local time zone set for the test (rule "stored in UTC and shown in local time").
  result: npx vitest run src/thoughts/openLog.test.tsx -> 5 passed, 0 failed; npx tsc --noEmit -p . -> exit 0, no errors; python scripts/check_docs.py -> docs check passed
- [x] T-thought-capture-test-slice Run the project's tests for the whole slice and fix what fails
  Satisfies: AC-thought-capture-device-log (steps 1.6, 1.7)
  Verify: `npm run typecheck` and `npm test` both exit 0, covering every task of every flow in this slice, and `npm run build` exits 0.
  result: npm run typecheck -> exit code 0; npm test -> exit code 0 (7 files, 106 tests passed); npm run build -> exit code 0
