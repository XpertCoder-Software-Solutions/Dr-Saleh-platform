import { cn } from '@/lib/cn'

type Variant = 'gold' | 'navy' | 'glass' | 'outline' | 'ghost' | 'black' | 'whatsapp'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap border-0 font-bold leading-tight no-underline ' +
  'transition-[transform,box-shadow,background-color,color,border-color] duration-250 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 aria-disabled:opacity-60'

const variants: Record<Variant, string> = {
  gold: 'bg-gold shine text-navy shadow-gold hover:-translate-y-0.5 hover:text-navy hover:shadow-[0_14px_30px_-12px_rgba(30,95,150,.6)]',
  navy: 'bg-navy shine text-white hover:-translate-y-0.5 hover:text-white hover:shadow-[0_14px_30px_-12px_rgba(30,95,150,.6)]',
  glass: 'glass font-semibold text-white hover:bg-white/15 hover:text-white',
  outline: 'border-[1.5px] border-line-2 bg-white text-ink hover:border-blue-300 hover:text-ink',
  ghost: 'bg-transparent text-blue-500 hover:bg-hover',
  black: 'bg-black text-white hover:-translate-y-0.5 hover:text-white',
  whatsapp: 'bg-[#1B8A5A] text-white hover:bg-[#157049] hover:text-white',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-11 rounded-field px-4.5 py-2.5 text-[15px]',
  md: 'min-h-13 rounded-field px-6.5 py-3.5 text-base',
  lg: 'min-h-14.5 rounded-2xl px-7.5 py-4.5 text-lg',
}

/** Class string for buttons and button-looking links. */
export function buttonClass({
  variant = 'navy',
  size = 'md',
  block = false,
  className,
}: { variant?: Variant; size?: Size; block?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], block && 'w-full', className)
}

/** Small rounded label above section titles. */
export const eyebrowClass =
  'inline-flex items-center gap-2 self-start rounded-full bg-surface-blue px-3.5 py-1.5 text-sm font-bold text-blue-600'

/** Shared form input look. */
export const inputClass =
  'w-full min-h-13 rounded-field border-[1.5px] border-line-2 bg-white px-4 py-3 text-base text-text transition-[border-color,box-shadow] ' +
  'focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(61,155,216,.15)] focus:outline-none aria-invalid:border-danger'

export const sectionClass = 'px-6 pb-26 max-sm:px-4 max-sm:pb-18'
export const innerClass = 'mx-auto max-w-site'
export const sectionTitleClass = 'text-[clamp(28px,4vw,42px)] font-bold'

/** Pill tabs (course categories). Selected state follows aria-selected. */
export const pillTabClass =
  'min-h-11 rounded-full border-[1.5px] border-line-2 bg-white px-5.5 py-2.5 text-base font-semibold text-text-2 transition-all hover:border-blue-300 hover:text-ink ' +
  'aria-selected:border-transparent aria-selected:bg-navy aria-selected:text-white'
