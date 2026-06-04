import type { InputHTMLAttributes, ReactNode } from 'react'

interface RadioOptionProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  wrapperClassName?: string
  inputClassName?: string
}

export default function RadioOption({ label, wrapperClassName, inputClassName, ...inputProps }: RadioOptionProps) {
  return (
    <label className={wrapperClassName}>
      <input type="radio" className={inputClassName} {...inputProps} />
      {label}
    </label>
  )
}
