import { useEffect, useRef, useState, type RefObject } from 'react'

const FOCUSABLE = 'button, textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])'

function focusableItems(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hasAttribute('disabled'))
}

/**
 * While a dialog is open, Escape closes it and Tab / Shift + Tab stay inside it,
 * whatever has focus (the listener is on the document, so focus on the page
 * behind or on the body is covered too). The dialog element needs tabIndex -1
 * so it can hold focus when it has nothing focusable.
 */
export function useDialogKeys(dialog: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const element = dialog.current
      if (element === null) return
      if (event.key === 'Escape') {
        event.preventDefault()
        close.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusableItems(element)
      if (items.length === 0) {
        event.preventDefault()
        element.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!element.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dialog])
}

/**
 * While a dialog is open, the button that opened it (the focused button when the dialog first renders)
 * carries data-dialog-open, which the stylesheet shows as a filled background.
 */
export function useOpenerHighlight() {
  const [opener] = useState(() => (document.activeElement instanceof HTMLButtonElement ? document.activeElement : null))
  useEffect(() => {
    opener?.setAttribute('data-dialog-open', 'true')
    return () => opener?.removeAttribute('data-dialog-open')
  }, [opener])
}
