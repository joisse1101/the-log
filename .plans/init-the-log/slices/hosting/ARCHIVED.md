# Archived: init-the-log/hosting

| | |
|---|---|
| Date | 2026-11-13 |
| Commit | `6aaa5945d466538025938fbdd88ff9edfdeaecfc` |
| Review | review: run |
| Stories | Open the log from GitHub Pages |

## Pages

| Page | What changed |
|---|---|
| `wiki/hosting/overview.md` | already applied |
| `wiki/hosting/reference.md` | already applied |
| `wiki/hosting/design.md` | block already applied, source row changed |
| `wiki/Home.md` | already applied |
| `wiki/_Sidebar.md` | already applied |

## Validation

| | |
|---|---|
| Tested commit | `91fbf04f9e576b3a4ea45c62f0bc65c59ca987e4` |
| Run | full |
| Claims | 9 met, 0 not met, 0 could not test |

## Review

| | |
|---|---|
| Review | run |
| Reviewed commit | `887442fdf6eca67bcb90c9bdb68cd2940f175a96` |
| Fix rounds | 3 |
| Checks | static run, behavioural run |

`review.md` was out of date at this archive (workflows, `scripts/` and `CLAUDE.md` changed after the reviewed commit), so the user stated that the review was run on the current code.

### Known, not fixed

- See [Address and settings](../../../../wiki/hosting/reference.md#address-and-settings) (vite.config.ts: base `/the-log/` is hardcoded; decision D-stack).
- Workflows: Node 26 and the action versions (checkout v6, setup-node v6, configure-pages v6, upload-pages-artifact v5, deploy-pages v5) may not exist or be stable. Recorded, not fixed: the user chose Node 26 (D-node) and the versions can only be confirmed on the first real GitHub run; the user did not pick this for the last round.
- src/test/setup.ts: `IS_REACT_ACT_ENVIRONMENT` is on for every test file. Recorded, not fixed: it reverses the round-2 finding that asked for it; the user did not pick it for the last round.
- UC-hosting.md: the interface contract and traceability rows 1.2 and 2.1 still say a push to main starts "Publish site" directly; it now starts after the Checks workflow succeeds. Recorded, not fixed: the plan is updated with jois-story-plan, not by apply.

### Not fixed by design

- .github/workflows/checks.yml and deploy.yml: main is installed, type-checked and built twice, once in Checks and once in Publish site (optional efficiency cleanup).
- tsconfig.json: `types` is limited to `vite/client`, so `@types/node` has no effect; no separate test tsconfig (optional cleanup).
- C2, C3, C5, C7, C8, C9: could not test at review time, because each needs a real GitHub Actions run or the live Pages site. The user later checked them by hand and `validation.md` marks them met.
