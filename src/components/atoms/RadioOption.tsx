import type { InputHTMLAttributes, ReactNode } from 'react'

interface RadioOptionProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  wrapperClassName?: string
}

export default function RadioOption({ label, wrapperClassName, ...inputProps }: RadioOptionProps) {
  return (
    <label className={wrapperClassName}>
      <input type="radio" {...inputProps} />
      {label}
    </label>
  )
}
