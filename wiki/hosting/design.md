# Hosting: design

<!-- archive:init-the-log/hosting:start -->
## Open the log from GitHub Pages

Scope: Feature Hosting (Epic: Storage and Access).

### Behaviour

#### Open the log from GitHub Pages

| Situation | Result | AC id |
|---|---|---|
| A change on `main` is pushed | The site is rebuilt and published | AC-hosting-publish-on-push |
| I open https://joisse1101.github.io/the-log/ on a phone or a laptop | It is served over HTTPS and the app page is shown | AC-hosting-served-over-https |
| A type-check, test or build fails on a push to `main`, so Checks is marked failed and Publish site skips its jobs, and then I open the address | The live site is still the last good version | AC-hosting-last-good-site |
| I open the http:// address | It redirects to https://, because "Enforce HTTPS" is on | none |
| Publish site reaches its deploy job | The job runs only after fetch, or on a manual run build, has succeeded | none |
| The deploy job runs | It holds only contents read, pages write and id-token write | none |
| The fetch job runs | It holds only the permission to read Actions artifacts | none |
| Checks runs | It holds only read access to the contents | none |
| The site is built | No secret or access token is in the bundle | none |

### How it fits together

```mermaid
classDiagram
  class AppShell {
    <<boundary>>
    +render() void
  }
  class ChecksWorkflow {
    <<service>>
    +run(commit) CheckResult
  }
  class PublishWorkflow {
    <<service>>
    +run(checksRun) PublishResult
  }
  class BuildTool {
    <<adapter>>
    +typeCheck() ExitCode
    +test() ExitCode
    +build() SiteBundle
  }
  class SiteBundle {
    <<value object>>
    +indexHtml
    +assets
    +basePath
  }
  class PagesHost {
    <<infra>>
    +deploy(bundle) void
    +serve(path) Response
  }
  ChecksWorkflow --> BuildTool : checks and builds with
  ChecksWorkflow ..> SiteBundle : keeps as the Pages artifact
  PublishWorkflow ..> ChecksWorkflow : starts after a successful run
  PublishWorkflow ..> SiteBundle : takes from the Checks run
  PublishWorkflow --> BuildTool : builds with on a manual run
  PublishWorkflow --> PagesHost : deploys to
  PagesHost o-- SiteBundle : serves
  PagesHost ..> AppShell : delivers
```

#### publish-site

```mermaid
%%{init: {'themeVariables': {'signalTextColor':'#1f2328','labelTextColor':'#1f2328','loopTextColor':'#1f2328','signalColor':'#444','labelBoxBkgColor':'#dde3ea','labelBoxBorderColor':'#444'}}}%%
sequenceDiagram
  actor Dev as Developer
  participant Repo as «infra»<br/>GitHubRepo
  participant CW as «service»<br/>ChecksWorkflow
  participant BT as «adapter»<br/>BuildTool
  participant WF as «service»<br/>PublishWorkflow
  participant Host as «infra»<br/>PagesHost
  rect rgb(235, 242, 250)
    Note over Dev,Repo: Phase 1 - Trigger
    Dev->>Repo: 1.1 push to branch main
    Repo->>CW: 1.2 push event starts workflow Checks
  end
  rect rgb(235, 242, 250)
    Note over CW,BT: Phase 2 - Check and build
    CW->>BT: 2.1 npm ci, type-check, npm test, vite build
    alt checks and build succeed
      BT-->>CW: 2.2 dist folder produced, exit code 0
      CW->>Host: 2.3 upload dist as the Pages artifact of the Checks run
    else a check or the build fails
      BT-->>CW: 2.4 non-zero exit code, Checks run marked failed, Publish site skips its jobs
      CW-->>Dev: 2.5 failure shown in Actions, Pages still serves the last good version
    end
  end
  opt checks succeeded
    rect rgb(235, 242, 250)
      Note over CW,Host: Phase 3 - Deploy
      CW->>WF: 3.1 Checks completed with success on a push starts workflow Publish site
      WF->>Repo: 3.2 gate job reads the head of main
      alt the commit is still the head of main
        WF->>Host: 3.3 fetch job takes the Pages artifact of the Checks run, no second build
        WF->>Host: 3.4 deploy job publishes the artifact
        Host-->>WF: 3.5 site live at the Pages address
      else a newer commit is on main
        WF-->>Dev: 3.6 fetch and deploy skipped, the newer commit's run deploys
      end
    end
  end
```

#### open-site

```mermaid
%%{init: {'themeVariables': {'signalTextColor':'#1f2328','labelTextColor':'#1f2328','loopTextColor':'#1f2328','signalColor':'#444','labelBoxBkgColor':'#dde3ea','labelBoxBorderColor':'#444'}}}%%
sequenceDiagram
  actor User
  participant Host as «infra»<br/>PagesHost
  participant Shell as «boundary»<br/>AppShell
  rect rgb(235, 242, 250)
    Note over User,Host: Phase 1 - Request
    User->>Host: 1.1 GET https://joisse1101.github.io/the-log/
    Host-->>User: 1.2 200 index.html over HTTPS
  end
  rect rgb(235, 242, 250)
    Note over User,Shell: Phase 2 - Render
    User->>Host: 2.1 GET scripts and styles under /the-log/assets/
    Host-->>User: 2.2 200 scripts and styles
    User->>Shell: 2.3 React mounts AppShell
    Shell-->>User: 2.4 shows the title The Log and a placeholder line
  end
```

### Decisions

| Decision | Why | Who chose |
|---|---|---|
| React and TypeScript, built with Vite and npm; the app lives at the repository root; the Vite base path is `/the-log/` | The base path matches the Pages address | user |
| A separate Publish site workflow deploys with the official Pages deploy, only after Checks succeeds for a push to `main`; the Pages source is "GitHub Actions" | A failed check or build never reaches the deploy job, so the last good site stays live | user |
| Type-check, tests and build run in their own Checks workflow, on pull requests and pushes to `main` | A failing change is caught before it is merged | user |
| On a push to `main`, Checks keeps the built `dist` as the Pages artifact, and Publish site deploys it without building again | `main` is built once, and the deployed files are exactly the ones the checks passed on | user |
| Publish site deploys only while the commit is still the head of `main`; a run for an older commit skips its jobs | A late run for an older commit cannot replace a newer deploy with stale content | user |
| A manual run of Publish site is allowed only on `main`, and it type-checks, tests and builds itself before deploying | A re-deploy needs no new commit and never publishes unchecked code | user |
| The app page is a minimal React shell with the title "The Log" and a short placeholder line | It shows that the site is live | user |
| Checks runs type-check (tsc), one Vitest test that the shell renders, and the Vite build | It gives the build a real gate | user |
| Both workflows use Node 26, the latest release | Use the latest | user |
| If the deploy job fails after a good build, the address keeps serving the last good version; no separate branch is drawn | No criterion covers it | user |
| No aggregate (no root entity of the domain) in this slice | The log's data belongs to later stories; Hosting only serves and publishes the app | user |
<!-- archive:init-the-log/hosting:end -->

## Sources

| Slice | Scope | Date | Review | Stories | Commit |
|---|---|---|---|---|---|
| init-the-log/hosting | Feature: Hosting (Epic: Storage and Access) | 2026-11-13 | review: run | Open the log from GitHub Pages (5bf6e7daaebb) | `6aaa5945d466538025938fbdd88ff9edfdeaecfc` |
