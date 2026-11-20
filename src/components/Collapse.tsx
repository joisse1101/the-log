import type { ReactNode } from 'react'

interface CollapseProps {
  open: boolean
  /** Space kept below it while open, as a CSS length. */
  gap: string
  className?: string
  children: ReactNode
}

/**
 * Shows or hides its content by animating its height and opacity (see `.collapse` in the
 * stylesheet). Closed, the content is out of the tab order and hidden from screen readers.
 */
export function Collapse({ open, gap, className, children }: CollapseProps) {
  const classes = className === undefined ? 'collapse' : `collapse ${className}`
  return (
    <div className={classes} data-open={open} inert={!open} style={{ '--collapse-gap': gap } as React.CSSProperties}>
      <div className="collapse__inner">{children}</div>
    </div>
  )
}
