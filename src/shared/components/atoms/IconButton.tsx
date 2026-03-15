import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label?: ReactNode
}

export default function IconButton({ icon, label, type = 'button', ...buttonProps }: IconButtonProps) {
  return (
    <button type={type} {...buttonProps}>
      {icon}
      {label ? ` ${label}` : null}
    </button>
  )
}
