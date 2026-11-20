<!-- jois-init:docs begin -->
## Where the code goes

- Arrange `src/` by layer: `src/domain/`, `service/`, `ports/`, `adapters/` and `components/`. There is no folder per feature.
- `components/partials/` holds the larger parts that make up a page. `components/` itself holds the shared components.
- A helper sits next to the component that uses it. Tests sit next to their file; a test that renders the whole page sits in `src/` beside `AppShell.test.tsx`.
- Screen code is called `components`, never `ui`.

## Where the docs are

- The docs live in `wiki/` as nested pages. They are the source of truth.
- The GitHub wiki is a one-way copy. Never edit it; the next publish overwrites it.
- Read the page for your topic before you change the code it describes. Update it in the same change.
- Run `python scripts/check_docs.py` after any docs or path change.

| If you work on | Read first |
| --- | --- |
| Anything (start here) | [Home](wiki/Home.md) |
| The home page: timeline, text box, markdown | [Timeline and markdown](wiki/thoughts/design.md) |

Add one row per topic folder as `wiki/` grows.
<!-- jois-init:docs end -->
