import type { InputHTMLAttributes } from 'react'

interface EditableTextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'defaultValue'> {
  value: string
  onCommit: (value: string) => void
}

export default function EditableTextInput({ value, onCommit, ...inputProps }: EditableTextInputProps) {
  return (
    <input
      {...inputProps}
      defaultValue={value}
      onBlur={(event) => onCommit(event.currentTarget.value)}
    />
  )
}
