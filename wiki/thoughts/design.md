# Thought capture: timeline and markdown

How the home page lays out the text box and the log, and how a thought's text is shown. The design source is the Thought Capture page of the design canvas (artboards "Browse and write", "Typing interaction" for the growing box, "Markdown reference", "Home with entries" and "Home on a phone"; the last two are titled "Log home with entries" and "Log home on a phone" inside their files).

## The timeline

- The log is the timeline: its own scrolling area below the text box, apart from the page (`src/thoughts/Timeline.tsx`). It fills the rest of the screen. While the box is open it is never shorter than 240px (about two cards).
- Scrolling the timeline away from its top folds the text box (and the page header) into a one-line button, "Drag down to write a log". The box keeps its text while folded.
- The box opens again when the user presses that button, wheels up at the top of the timeline, or drags down at the top on a touch screen. Opening keeps the log the user was reading in view: the card that sat at the bottom of the view stays at the bottom while and after the box opens (`src/thoughts/keepInView.ts`). Only a scroll the user makes folds the box; a scroll the browser makes because the timeline changed size does not.
- Saving is the only thing that moves the timeline for the user: it scrolls smoothly to the top, the box empties and folds, and focus goes to the hint button.
- The top edge fades out when the timeline is scrolled down, the bottom edge when more logs wait below (a 32px mask, set in `src/AppShell.css`).
- The scrollbar thumb of the timeline is 5px wide, 2px from the edge, round, 8px in from the top and bottom, in `--border-control` at 50% opacity. The thumb of the text box is 6px wide, 4px from the edge, round, 10px in from the ends, in `--border-control`. Firefox shows a thin bar in the same colours.
- The hint button is 44px tall for touch size, a deliberate difference from the 36px of the artboard.
- On a laptop each card has a dot and a line on its left (the first dot is pink). On a phone the rail is hidden and the cards are tighter.
- Not built yet, they belong to other slices: the tag filter chips, search, "show more" paging and the 100-entry cap, card titles, and the "Saved" toast.

## The text box and the page

- The box grows with its text, line by line, until it reaches its cap: the screen height less 96px (48px of room above and below). After that its text scrolls inside the box, with the styled bar. The height is set from the text by script (`src/thoughts/ThoughtBox.tsx`) so that it can be animated.
- The text is measured in an invisible copy of the box (a second textarea positioned inside the box, hidden and with no height), never in the real box, so measuring cannot change the page's height or move its scroll position.
- While the box is open the page itself scrolls when the content is taller than the screen: a big box pushes the header out of view, and the user scrolls the page down to reach Save, any message under the box, and the timeline. The timeline is never shorter than 240px (about two cards) there. Nothing is hidden or locked.
- Scrolling the page never folds the box. Only a scroll inside the timeline does.
- Folded, the page fits the screen and only the timeline scrolls.
- The page scrollbar looks like the timeline's. The page reserves room for its bar on both sides, so nothing moves when it appears.
- The page moves in step with the box. When the box's new height is known, the page's scroll position for that final height is worked out once, and the page scrolls to it along the same curve and over the same time as the height transition (`--motion-grow` and `--motion-ease`), so the box and the page move together. Below the cap the page scrolls just far enough to keep the box and a 12px margin above the bottom of the screen; nothing moves when the box already fits.
- When the box reaches its cap and has focus, that target is the one that puts the box in the middle of the screen (equal space above and below; the arithmetic is in `src/thoughts/centerBox.ts`). Only one scroll starts per cap entry: a later keystroke can extend the running scroll further down but never turn it back, and once the box is centred (or within 2px) nothing moves, so a new line never moves the page. If the user scrolls the page away and types again, the box is centred again.
- Deleting lines lets the page scroll back up on its own as the content gets shorter.
- At the cap the text scrolls inside the box, and the browser keeps the caret clear of the "Shift + Enter to save" hint with `scroll-padding-block-end`. Focus is kept throughout.

## Motion

Every duration and the easing are custom properties at the top of `src/AppShell.css`. Change them there; a duration of `0ms` switches that motion off.

| Property | Default | What it times |
| --- | --- | --- |
| `--motion-fold` | `320ms` | The box folding into the hint and the hint opening back into the box (height and fade), with the header and the timeline following. |
| `--motion-grow` | `160ms` | The text box growing or shrinking as text is typed or deleted. |
| `--motion-scroll` | `400ms` | The timeline scrolling to the top after a save. The scroll uses an ease-out curve set in `src/thoughts/motion.ts`. |
| `--motion-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | The curve of the fold and the growing box. |

- Under `prefers-reduced-motion: reduce` the three durations are `0ms`, so nothing animates.
- While the box opens, the card that sat at the bottom of the timeline is held in place frame by frame (`src/thoughts/keepInView.ts`), so the log being read does not jump.
- The timeline ignores scroll events for the length of the fold (plus 80ms) and for 150ms after any size change, because the browser may move `scrollTop` while the layout animates. Only a scroll the user makes outside those windows folds the box.

## Markdown

- A thought's text is shown as markdown by `src/thoughts/ThoughtMarkdown.tsx`: headers 1 to 6, paragraphs, bold, italic, struck text, links, inline code, quotes, bullet, numbered and task lists, fenced code, tables and dividers. The look follows the Markdown reference artboard.
- In a list that mixes plain items and tasks, the plain items keep their bullets; only a list made wholly of tasks has none.
- The last line of tags is split off before this (see `src/thoughts/thought.ts`) and shown as chips.
- Raw HTML is never read as HTML: it shows as the characters typed. The text is turned into React elements from the parsed tokens, never into an HTML string.
- Only http:, https: and mailto: links become links, and they open in a new tab with `rel="noopener noreferrer"`. Any other link stays plain text. Bare web addresses are not linked.
- A markdown image shows its alt text. No image is requested, so showing a thought makes no network request.
- The edit dialog keeps a plain text box, and the delete dialog shows the plain text, cut to seven lines.
