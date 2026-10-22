import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { tx } from '@/lib/i18n'

/** Split auth layout: form on the right, brand panel on the left. No site header. */
export function AuthShell({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[1fr_minmax(380px,43%)] gap-5 bg-surface p-5 max-lg:grid-cols-1 max-lg:p-0">
      <div className="flex flex-col px-10 py-5 max-lg:px-4">
        <div className="flex items-center justify-between">
          <Link to={routes.home} className="inline-flex items-center gap-1.5 font-bold text-ink">
            <Icon name="arrowRight" size={16} /> {tx('رجوع للرئيسية', 'Back to home')}
          </Link>
          <Link to={routes.home} aria-label={tx('الرئيسية', 'Home')}>
            <img
              src="/assets/brand/logo-blue.webp"
              alt={tx('الدكتور صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
              className="h-11 w-auto"
            />
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-110 flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[34px]">{title}</h1>
            {sub && <p className="leading-[1.8] text-muted">{sub}</p>}
          </div>
          {children}
        </main>
      </div>

      <aside
        className="relative min-h-140 bg-navy overflow-hidden rounded-[28px] max-lg:hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 dots opacity-50" />
        <img className="absolute start-12 top-12 w-60" src="/assets/brand/logo-white.webp" alt="" />
        <img
          className="absolute -end-2.5 bottom-0 h-[72%] w-auto max-w-none drop-shadow-[0_20px_40px_rgba(5,20,40,.45)]"
          src="/assets/brand/saleh-cutout.webp"
          alt=""
        />
        <div className="absolute start-12 bottom-12 flex w-[min(380px,70%)] flex-col gap-2.5 rounded-[22px] p-6 text-white glass">
          <p className="font-head text-xl leading-[1.7]">
            {tx(
              '«مش مطلوب إن ابنك يكون مثالي… المطلوب إنه يكون سوي، واثق في نفسه.»',
              '“Your child doesn’t need to be perfect… they need to be balanced and self-confident.”',
            )}
          </p>
          <span className="text-sm text-on-dark-muted">
            {tx('د. صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
          </span>
          <div className="flex flex-wrap gap-2 *:rounded-lg *:bg-white/14 *:px-2.5 *:py-1.25 *:text-[13px]">
            <span>{tx('دوراتك وكتبك في مكان واحد', 'Your courses and books in one place')}</span>
            <span>{tx('شهادات قابلة للمشاركة', 'Shareable certificates')}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

/** Centered "don't have an account? / back to login" line under auth forms. */
export function AuthSwitch({ children }: { children: ReactNode }) {
  return <p className="text-center text-muted [&_a]:font-bold">{children}</p>
}
