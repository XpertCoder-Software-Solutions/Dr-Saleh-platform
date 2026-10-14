import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { usePageTitle } from '@/lib/usePageTitle'

function SimplePage({
  top,
  title,
  body,
  children,
}: {
  top: ReactNode
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <section className="relative flex min-h-[78vh] bg-navy items-center justify-center overflow-hidden px-6 pt-34.5 pb-20 text-center text-white max-sm:px-4">
      <div className="absolute inset-0 dots opacity-50" aria-hidden="true" />
      <div className="relative flex max-w-155 flex-col items-center gap-4.5">
        {top}
        <h1 className="text-[clamp(28px,4vw,40px)] text-white">{title}</h1>
        <p className="text-lg leading-loose text-on-dark">{body}</p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </section>
  )
}

export function NotFoundPage() {
  usePageTitle('الصفحة مش موجودة')
  return (
    <SimplePage
      top={
        <span className="text-sheen font-head text-[clamp(90px,18vw,160px)] leading-none font-bold">404</span>
      }
      title="الصفحة دي مش موجودة"
      body="يمكن الرابط اتغيّر أو الصفحة اتشالت. جرّب ترجع للرئيسية أو تتصفح الدورات."
    >
      <Link to={routes.home} className={buttonClass({ variant: 'gold', size: 'lg' })}>
        الرئيسية <Icon name="arrowLeft" />
      </Link>
      <Link to={routes.courses} className={buttonClass({ variant: 'glass', size: 'lg' })}>
        تصفّح الدورات
      </Link>
    </SimplePage>
  )
}

/** Placeholder for pages that are designed but not built yet in this phase. */
export function ComingSoonPage({ title }: { title: string }) {
  usePageTitle(title)
  return (
    <SimplePage
      top={<span className="rounded-full px-4 py-1.5 font-bold text-gold-light glass">قريبًا</span>}
      title={title}
      body="الصفحة دي بنشتغل عليها دلوقتي وهتكون جاهزة قريب."
    >
      <Link to={routes.home} className={buttonClass({ variant: 'gold', size: 'lg' })}>
        الرئيسية <Icon name="arrowLeft" />
      </Link>
    </SimplePage>
  )
}
