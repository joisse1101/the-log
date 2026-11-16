import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react'
import Button from '../Button/Button'
import styles from './Modal.module.css'

export type ModalProps = {
  open: boolean
  /** Called on Escape, the close button and a click on the backdrop. The parent sets `open` to false. */
  onClose: () => void
  title: string
  /** Buttons shown below the body, primary action last. */
  footer?: ReactNode
  children?: ReactNode
}

export default function Modal({ open, onClose, title, footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // The native dialog gives the focus trap, Escape key and top layer. This keeps it in step with `open`.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  // Clicks on the backdrop land on the dialog element itself; clicks inside land on its panel.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <Button variant="tertiary" size="sm" onClick={onClose}>
              Close
            </Button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
