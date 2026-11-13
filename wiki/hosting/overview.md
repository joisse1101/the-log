# Hosting

The Log is a static React app that GitHub Pages serves at https://joisse1101.github.io/the-log/. A change reaches the site only after its type-check, tests and build pass.

| I want to | Do this |
|---|---|
| Open the log | Go to https://joisse1101.github.io/the-log/ on a phone or a laptop |
| Publish a change | Merge or push it to `main`: the Checks workflow type-checks, tests and builds it, then Publish site deploys that build |
| Check a change before merging | Open a pull request to `main`: Checks runs the same checks and build and publishes nothing |
| Re-deploy without a new commit | Run Publish site by hand from `main` in the Actions tab |
| Find out why a change did not go live | Open the failed Checks run in the Actions tab |

What the system does:

- It serves the site only over HTTPS and redirects http to https.
- It deploys a commit only while that commit is still the head of `main`.
- It keeps the last good version live when a check or the build fails.
- It shows a minimal app shell with the title "The Log" until later features fill it in.

Triggers, settings and job permissions are in [reference](reference.md). Behaviour, diagrams and decisions are in [design](design.md).
