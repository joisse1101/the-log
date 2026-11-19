# Thought capture: timeline and markdown

How the home page lays out the text box and the log, and how a thought's text is shown. The design source is the Thought Capture page of the design canvas (artboards "Browse and write", "Markdown reference", "Home with entries" and "Home on a phone").

## The timeline

- The log is the timeline: its own scrolling area below the text box, apart from the page (`src/thoughts/Timeline.tsx`). It fills the rest of the screen. While the box is not tall it keeps room for about one card (120px).
- Scrolling the timeline away from its top folds the text box (and the page header) into a one-line button, "Drag down to write a log". The box keeps its text while folded.
- The box opens again when the user presses that button, wheels up at the top of the timeline, or drags down at the top on a touch screen. Opening keeps the log the user was reading in view: the card that sat at the bottom of the view stays at the bottom after the box opens (`src/thoughts/keepInView.ts`). Only a scroll the user makes folds the box; a scroll the browser makes because the timeline changed size does not.
- Saving is the only thing that moves the timeline for the user: it scrolls to the top, the box empties and folds, and focus goes to the hint button.
- The top edge fades out when the timeline is scrolled down, the bottom edge when more logs wait below (a 32px mask, set in `src/AppShell.css`).
- The scrollbar thumb of the timeline is 5px wide, 2px from the edge, round, 8px in from the top and bottom, in `--border-control` at 50% opacity. The thumb of the text box is 6px wide, 4px from the edge, round, 10px in from the ends, in `--border-control`. Firefox shows a thin bar in the same colours.
- The hint button is 44px tall for touch size, a deliberate difference from the 36px of the artboard.
- On a laptop each card has a dot and a line on its left (the first dot is pink). On a phone the rail is hidden and the cards are tighter.
- Not built yet, they belong to other slices: the tag filter chips, search, "show more" paging and the 100-entry cap, card titles, and the "Saved" toast.

## The tall box

- The box grows with its text up to a cap: the screen height less the header, the Save button, a message line and about one card (120px) of timeline.
- When the text overflows that cap the box goes tall (`app-shell--tall`, set from `src/thoughts/ThoughtBox.tsx`). The header goes, the timeline is collapsed out of view below (its scroll position is kept), and the box fills the screen above Save. The text scrolls inside the box, and the page itself never scrolls. A message under the box stays in view.
- The box leaves the tall state only when its text is no taller than the box was at the moment it went tall, so deleting one line does not flicker. Saving and folding also end it. The box keeps its focus and caret throughout.

## Markdown

- A thought's text is shown as markdown by `src/thoughts/ThoughtMarkdown.tsx`: headers 1 to 6, paragraphs, bold, italic, struck text, links, inline code, quotes, bullet, numbered and task lists, fenced code, tables and dividers. The look follows the Markdown reference artboard.
- In a list that mixes plain items and tasks, the plain items keep their bullets; only a list made wholly of tasks has none.
- The last line of tags is split off before this (see `src/thoughts/thought.ts`) and shown as chips.
- Raw HTML is never read as HTML: it shows as the characters typed. The text is turned into React elements from the parsed tokens, never into an HTML string.
- Only http:, https: and mailto: links become links, and they open in a new tab with `rel="noopener noreferrer"`. Any other link stays plain text. Bare web addresses are not linked.
- A markdown image shows its alt text. No image is requested, so showing a thought makes no network request.
- The edit dialog keeps a plain text box, and the delete dialog shows the plain text, cut to seven lines.
