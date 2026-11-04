// Small reusable UI primitives: Card, Button, Field wrappers.

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <As className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 ${className}`}>
      {children}
    </As>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-forest-600 text-white hover:bg-forest-700 focus-visible:bg-forest-700',
  secondary:
    'bg-white text-forest-800 ring-1 ring-forest-600 hover:bg-forest-50',
  danger: 'bg-urgent-600 text-white hover:bg-urgent-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  missing,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  required?: boolean
  missing?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="text-urgent-600"> *</span>}
        {missing && (
          <span className="ml-2 rounded bg-warn-100 px-1.5 py-0.5 text-xs font-medium text-warn-700">
            Missing
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-forest-600'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      {body && <p className="max-w-md text-sm text-slate-500">{body}</p>}
      {action}
    </div>
  )
}
