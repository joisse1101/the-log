# Archived: init-the-log/thought-capture

| | |
|---|---|
| Date | 2026-11-20 |
| Commit | `4e98d4e52043e5fb286565516c9b5a1ac22bc513` |
| Review | review: run |
| Stories | Write a thought; Keep an unsaved thought; Edit a thought; Delete a thought; Tag a thought; Keep thoughts on this device |

## Pages

| Page | What changed |
|---|---|
| `wiki/thoughts/design.md` | block added, with its Sources row |
| `wiki/thoughts/overview.md` | added |
| `wiki/thoughts/reference.md` | added |
| `wiki/Home.md` | row added |
| `wiki/_Sidebar.md` | row added |
| `wiki/hosting/overview.md` | already applied |
| `wiki/hosting/design.md` | already applied |

## Validation

| | |
|---|---|
| Tested commit | `4e98d4e52043e5fb286565516c9b5a1ac22bc513` |
| Run | full |
| Claims | 42 met, 0 not met, 0 could not test |

## Review

| | |
|---|---|
| Review | run |
| Reviewed commit | `2122d6dcea97ff2ae5efa8a7728861a7ed4e0f42` (the user confirmed a review of the later code at archive) |
| Fix rounds | 3 |
| Checks | static run, behavioural run |

### Known, not fixed

none

### Not fixed by design

- See [Known limits](../../../../wiki/thoughts/design.md#known-limits)
- Claims C40 and C41 of validation.md: "disconnected" is not simulated; the tests show no network call and local storage only. (Resolved since: offline tests now set the browser offline and make every network request fail.)
