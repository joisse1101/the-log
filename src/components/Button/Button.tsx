import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Rank of the action. Use one primary per view. Danger belongs in a confirmation step. */
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...rest} />
}
