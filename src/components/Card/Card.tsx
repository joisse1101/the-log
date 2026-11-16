import type { ReactNode } from 'react'
import styles from './Card.module.css'

export type CardProps = {
  /** Heading of the card. */
  title?: string
  /** Quiet line beside the title, such as a time. */
  meta?: string
  /** Buttons or links shown below the body. */
  footer?: ReactNode
  /** Element for the card: article for a self-contained item, section for a titled part of a page. */
  as?: 'article' | 'section'
  children?: ReactNode
}

export default function Card({ title, meta, footer, as: Element = 'article', children }: CardProps) {
  const hasHeader = Boolean(title || meta)
  return (
    <Element className={styles.card}>
      {hasHeader && (
        <header className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {meta && <p className={styles.meta}>{meta}</p>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </Element>
  )
}
