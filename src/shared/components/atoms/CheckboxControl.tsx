import type { InputHTMLAttributes } from 'react'

interface CheckboxControlProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export default function CheckboxControl(props: CheckboxControlProps) {
  return <input type="checkbox" {...props} />
}
