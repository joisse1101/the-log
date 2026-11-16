# Design

The Log looks calm and a little soft, because it is a place to write without stopping. It has a dark theme (dark blue, pastel pink and pastel blue) and a light theme (off-white, dusky pink and dusty blue). Both follow the device setting by default.

| I want to | Do this |
|---|---|
| Use a colour, space or font size | Read a role token such as `--ui-text-secondary` from `src/styles/tokens.css`; never write a hex value in a component |
| Add a button, card or modal | Import it from `src/components/`; see [reference](reference.md) |
| Force one theme | Set `data-theme="light"` or `data-theme="dark"` on the `<html>` element |
| Change the fonts | Change `--ui-font-text` and `--ui-font-ui` and the font imports in `src/main.tsx` |

## Colour

Every text colour is a grey, never pure white or pure black. Pink marks the one main action on a screen. Blue marks quieter actions. Red appears only on the button that confirms a destructive step.

Text is grey so that colour is kept for actions. The greys lean slightly cool so they sit well beside both pink and blue.

## Typography

The app uses two fonts. A serif (Newsreader) carries the titles, which gives the page a feeling of paper. A sans-serif (DM Sans) carries everything else: body text, entries, buttons, labels and times. The contrast between the two makes the hierarchy easy to see.

Three pairings were considered. The first is in use, and the others are drop-in swaps because the fonts sit behind two tokens.

| Pairing | Titles | Everything else | Feel | Pick it when |
|---|---|---|---|---|
| **A (in use)** | Newsreader | DM Sans | Quiet, bookish titles over plain, calm text | You want clear hierarchy and a calm page |
| B | Fraunces | Figtree | Rounder and warmer, with some character | You want the pink to feel playful |
| C | Literata | Instrument Sans | Sturdy and neutral | You want the least personality |

Pairing A was chosen because Newsreader was drawn for reading on screens and has a true italic, which suits half-formed thoughts. DM Sans is plain and round enough to sit beside the soft corners. Neither is among the most overused interface fonts.

Only two weights are used (400 and 600). Interface text is 0.875rem and entries and modal text are 1rem with a 1.5 line height, and a paragraph never grows wider than 65 characters. Entries sit on the 1rem step because 15px is not on the size scale; DM Sans italic is installed so emphasis uses a real italic. A text box for typing an entry must use the same font, size and line height as the saved entry. Button labels are set in small caps with a little extra letter spacing; the font has no true small caps, so the browser draws them, and each button size is one step above the body text to make up for their smaller look.

## Where things live

The design system is also published as a Design System artifact, which shows the same tokens and components next to each other. This wiki and `src/` stay the source of truth; the artifact is a copy for looking at.
