# Thought capture: markdown

How the home page shows a thought's text. The design source is the Thought Capture page of the design canvas (artboard "Markdown reference").

## Markdown

- A thought's text is shown as markdown by `src/thoughts/ThoughtMarkdown.tsx`: headers 1 to 6, paragraphs, bold, italic, struck text, links, inline code, quotes, bullet, numbered and task lists, fenced code, tables and dividers. The look follows the Markdown reference artboard.
- In a list that mixes plain items and tasks, the plain items keep their bullets; only a list made wholly of tasks has none.
- The last line of tags is split off before this (see `src/thoughts/thought.ts`) and shown as chips.
- Raw HTML is never read as HTML: it shows as the characters typed. The text is turned into React elements from the parsed tokens, never into an HTML string.
- Only http:, https: and mailto: links become links, and they open in a new tab with `rel="noopener noreferrer"`. Any other link stays plain text. Bare web addresses are not linked.
- A markdown image shows its alt text. No image is requested, so showing a thought makes no network request.
- The edit dialog keeps a plain text box, and the delete dialog shows the plain text, cut to seven lines.
