# Design: reference

## Files

| Path | Holds |
|---|---|
| `src/styles/tokens.css` | Palette shades, role tokens, spacing, radius, type and shadow |
| `src/styles/global.css` | Page background, base text, headings, reduced-motion rule |
| `src/components/Button/` | `Button.tsx`, `Button.module.css`, `Button.test.tsx` |
| `src/components/Card/` | `Card.tsx`, `Card.module.css`, `Card.test.tsx` |
| `src/components/Modal/` | `Modal.tsx`, `Modal.module.css`, `Modal.test.tsx` |
| `src/test/renderUi.tsx` | Test helper that mounts a component and cleans up |

## Tokens

Tokens come in two layers. The first holds raw shades (`--ui-pink-300`). The second maps them to a role with `light-dark(light value, dark value)` (`--ui-primary`). Components read only the second layer, so a theme change never touches a component.

| Role token | Light | Dark | Used for |
|---|---|---|---|
| `--ui-bg` | off-white `paper-200` | dark blue `navy-950` | Page background |
| `--ui-surface` | `paper-100` | `navy-900` | Cards |
| `--ui-surface-raised` | `paper-100` | `navy-800` | Modals |
| `--ui-text-primary` | `grey-900` | `grey-100` | Headings, main text |
| `--ui-text-secondary` | `grey-700` | `grey-300` | Body text |
| `--ui-text-tertiary` | `grey-600` | `grey-400` | Times and hints |
| `--ui-primary` | dusky pink `pink-500` | pastel pink `pink-300` | Main button fill |
| `--ui-on-primary` | `pink-950` | `pink-950` | Text on the main button |
| `--ui-primary-text` | `pink-700` | `pink-300` | Pink text and links |
| `--ui-secondary` | dusty blue tint `blue-200` | `blue-800` | Quiet button fill |
| `--ui-secondary-text` | `blue-700` | `blue-300` | Blue text |
| `--ui-danger` | `red-700` | `red-300` | Confirming a delete |
| `--ui-focus` | `blue-600` | `blue-300` | Keyboard focus ring |

The rest of the scales:

- Spacing: `--ui-space-1` to `--ui-space-10` (0.25rem up to 8rem, uneven steps).
- Radius: `--ui-radius-sm` 0.5rem, `md` 0.75rem, `lg` 1rem, `xl` 1.5rem, `full` for pills.
- Type sizes: `--ui-text-sm` 0.75rem, `base` 0.875rem (interface), `lg` 1rem (writing), `xl` 1.125rem, `2xl` 1.25rem, `3xl` 1.5rem, `4xl` 1.875rem, up to `--ui-text-5xl` 2.25rem; weights 400 and 600.
- Shadow: `--ui-shadow-1` (buttons) to `--ui-shadow-5` (modals).

### Measured contrast

Ratios use the WCAG formula, where 4.5 is the pass mark for small text and 3 for large text and borders.

| Pair | Light | Dark |
|---|---|---|
| Primary text on page | 13.99 | 16.01 |
| Secondary text on page | 7.91 | 10.31 |
| Tertiary text on page | 5.36 | 6.50 |
| Button label on primary fill | 5.00 | 10.99 |
| Quiet button label on its fill | 7.85 | 7.85 |
| Pink text on page | 6.10 | 11.83 |
| Control border (`grey-500`) on surface | 4.00 | 4.06 |

The light primary fill itself measures 3.04 against the page, just over the 3 pass mark for a shape that carries meaning. Card borders are decoration only and are deliberately quiet.

## Button

`<Button variant size>` renders a `button` with `type="button"` unless told otherwise.

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary`, `secondary`, `tertiary`, `danger` | `primary` |
| `size` | `sm`, `md`, `lg` | `md` |

Labels are drawn in small caps, so write them in ordinary sentence case. Use one primary button per view. Use `danger` only in the step that confirms a destructive action, such as inside a modal. All other `button` attributes pass through.

## Card

`<Card title meta footer as>` shows a titled block with serif body text.

| Prop | Meaning |
|---|---|
| `title` | Heading (`h3`) |
| `meta` | Quiet text beside the title, such as a time |
| `footer` | Buttons below the body |
| `as` | `article` (default) for a self-contained item, `section` for a titled part of a page |

## Modal

`<Modal open onClose title footer>` wraps the native `dialog` element, which supplies the focus trap, the Escape key and the layer above the page.

- The parent owns `open`; `onClose` is called on Escape, the Close button and a click on the backdrop.
- Its content is rendered only while open, so a form inside starts empty each time.
- Put the primary action last in `footer`.
- The page behind does not scroll while a modal is open.

## Known limits

- There is no theme switch control yet; the theme follows the device unless `data-theme` is set.
- `light-dark()` needs a browser from 2024 or later.
- Fonts are installed as the npm packages named fontsource newsreader and fontsource dm-sans (see `package.json`), so they load from the site itself and not from Google.
