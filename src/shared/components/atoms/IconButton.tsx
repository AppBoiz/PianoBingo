import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label?: ReactNode
  actionId?: string
}

export default function IconButton({ icon, label, type = 'button', actionId, ...buttonProps }: IconButtonProps) {
  return (
    <button type={type} data-action={actionId} {...buttonProps}>
      {icon}
      {label ? ` ${label}` : null}
    </button>
  )
}
