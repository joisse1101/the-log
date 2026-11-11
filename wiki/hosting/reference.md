# Hosting: reference

## Address and settings

| Setting | Value | Where |
|---|---|---|
| Live address | https://joisse1101.github.io/the-log/ | GitHub Pages |
| Base path | `/the-log/` | `base` in `vite.config.ts` |
| Pages source | GitHub Actions | Repository settings, Pages (set once by hand) |
| Enforce HTTPS | On; http answers 301 to https | Repository settings, Pages |
| Node version | 26 | Both workflows |
| Build output | `dist`, scripts and styles under `/the-log/assets/` | Vite |

## npm scripts

| Script | Runs |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` |
| `npm run build` | `tsc --noEmit && vite build` |
| `npm run preview` | `vite preview`, serving the build at `/the-log/` |

## Triggers

| Trigger | Workflow | Input | Result |
|---|---|---|---|
| Pull request to `main` | Checks (`.github/workflows/checks.yml`) | The pull request | Type-check, tests and build green; no artifact kept; nothing published |
| Push to `main` | Checks | The pushed commit | Checks green and `dist` kept as the github-pages artifact of the run |
| Checks completed on `main` (`workflow_run`) | Publish site (`.github/workflows/deploy.yml`) | The Checks run, with its conclusion, event and head commit | When Checks succeeded on a push and the commit is still the head of `main`, the artifact is deployed and goes live |
| Manual run (`workflow_dispatch`) on `main` | Publish site | None | Type-check, tests and build pass, then the build is deployed; a manual run from another branch deploys nothing |
| GET https://joisse1101.github.io/the-log/ | GitHub Pages | None | 200 text/html over HTTPS; the page loads its scripts and styles from `/the-log/assets/` and shows the shell |

## Jobs and permissions

| Workflow | Job | Runs when | Permissions |
|---|---|---|---|
| Checks | checks | Every Checks run; uploads the artifact only on a push to `main` | contents read |
| Publish site | gate | Checks succeeded on a push, or a manual run on `main` | contents read |
| Publish site | fetch | After a Checks run, when gate finds the commit is the head of `main` | actions read |
| Publish site | build | On a manual run, when gate finds the commit is the head of `main` | contents read |
| Publish site | deploy | After fetch or build succeeds | contents read, pages write, id-token write |
