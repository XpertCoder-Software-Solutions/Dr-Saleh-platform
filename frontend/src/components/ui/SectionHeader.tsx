import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { eyebrowClass, sectionTitleClass } from './button'
import { cn } from '@/lib/cn'

interface Props {
  eyebrow: string
  icon: IconName
  title: ReactNode
  more?: { to: string; label: string }
  center?: boolean
}

/** Eyebrow chip + big title, with an optional "see all" link on the far side. */
export function SectionHeader({ eyebrow, icon, title, more, center }: Props) {
  return (
    <div
      className={cn(
        'mb-9 flex flex-wrap gap-5',
        center ? 'flex-col items-center text-center' : 'items-end justify-between',
      )}
    >
      <div className={cn('flex animate-rise flex-col gap-2.5', center && 'items-center')}>
        <span className={cn(eyebrowClass, center && 'self-center')}>
          <Icon name={icon} size={16} />
          {eyebrow}
        </span>
        <h2 className={sectionTitleClass}>{title}</h2>
      </div>
      {more && (
        <Link to={more.to} className="inline-flex min-h-11 items-center gap-2 text-[17px] font-semibold">
          {more.label} <Icon name="arrowLeft" size={18} />
        </Link>
      )}
    </div>
  )
}
