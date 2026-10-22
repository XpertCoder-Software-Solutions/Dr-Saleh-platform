import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { tx } from '@/lib/i18n'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label={tx('مسار الصفحة', 'Breadcrumb')} className="text-sm text-on-dark-muted">
      {crumbs.map((c, i) => (
        <span key={c.label}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {c.to ? (
            <Link to={c.to} className="text-on-dark-muted hover:text-white">
              {c.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-white">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** The wavy bottom edge of navy heroes. */
export function HeroWave() {
  return (
    <svg
      className="absolute inset-x-0 -bottom-px h-15 w-full"
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="animate-wave"
        d="M0 40 C 360 100 1080 -20 1440 40 L1440 80 L0 80 Z"
        fill="var(--color-surface)"
      />
    </svg>
  )
}

interface PageHeroProps {
  crumbs: Crumb[]
  eyebrow?: ReactNode
  title: ReactNode
  body?: ReactNode
  /** Show Dr. Saleh's cutout on the left (desktop only). */
  portrait?: boolean
  children?: ReactNode
}

/** Navy hero used at the top of inner pages; leaves room for the floating header. */
export function PageHero({ crumbs, eyebrow, title, body, portrait = true, children }: PageHeroProps) {
  return (
    <section className="relative bg-navy overflow-hidden px-6 pt-34.5 pb-22.5 text-white max-sm:px-4 max-sm:pt-31">
      <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
      <div className="orb -end-15 -top-35 size-95 bg-blue-300" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-55 max-w-site items-end justify-between gap-10">
        <div className="flex max-w-160 flex-col gap-4">
          <Breadcrumbs crumbs={crumbs} />
          {eyebrow && (
            <span className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-bold glass">
              {eyebrow}
            </span>
          )}
          <h1 className="animate-rise text-[clamp(32px,5vw,52px)] leading-tight font-bold text-white">
            {title}
          </h1>
          {body && (
            <p className="animate-rise text-lg leading-loose text-on-dark [animation-delay:.1s]">{body}</p>
          )}
        </div>
        {portrait && (
          <div className="relative -mb-22.5 h-70 w-65 flex-none max-md:hidden" aria-hidden="true">
            <div className="absolute inset-x-5 top-5 bottom-0 rounded-t-[140px] border border-white/25 bg-linear-to-b from-white/18 to-white/4" />
            <img
              src="/assets/brand/saleh-cutout.webp"
              alt=""
              className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 drop-shadow-[0_20px_40px_rgba(5,20,40,.45)]"
            />
          </div>
        )}
      </div>
      {children && <div className="relative z-2 mx-auto mt-9 max-w-site">{children}</div>}
      <HeroWave />
    </section>
  )
}
