import { Link, NavLink, useParams } from 'react-router-dom'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { Icon } from '@/components/ui/Icon'
import { innerClass, sectionClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { POLICIES, POLICIES_UPDATED, type Policy } from './policies'
import { POLICIES_EN, POLICIES_UPDATED_EN } from './policies.en'
import { isEn, tx } from '@/lib/i18n'

const DOCS: Record<string, Policy> = isEn ? POLICIES_EN : POLICIES
const UPDATED = isEn ? POLICIES_UPDATED_EN : POLICIES_UPDATED

export function LegalPage() {
  const { doc = 'terms' } = useParams()
  const current = DOCS[doc]
  usePageTitle(current?.title)
  if (!current) return <NotFoundPage />

  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[{ label: tx('الرئيسية', 'Home'), to: routes.home }, { label: tx('السياسات', 'Policies') }]}
        title={
          <>
            {tx('الشروط', 'Terms')} <span className="text-sheen">{tx('والسياسات', '& policies')}</span>
          </>
        }
        body={tx(
          'كل اللي محتاج تعرفه عن استخدام المنصة، والشحن، والاستبدال والاسترجاع، وخصوصية بياناتك، بكلام واضح.',
          'Everything you need to know about using the platform, shipping, exchanges and returns, and your data privacy, in plain words.',
        )}
      />
      <section className={cn(sectionClass, 'relative z-2 -mt-12')}>
        <div className={cn(innerClass, 'grid grid-cols-[260px_1fr] items-start gap-7 max-md:grid-cols-1')}>
          <nav
            aria-label={tx('السياسات', 'Policies')}
            className="sticky top-27 flex flex-col gap-1 rounded-card bg-white p-2.5 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-md:static"
          >
            {Object.entries(DOCS).map(([id, d]) => (
              <NavLink
                key={id}
                to={`/legal/${id}`}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px]',
                    isActive
                      ? 'bg-surface-blue font-bold text-ink shadow-[inset_-3px_0_0_var(--color-blue-400)]'
                      : 'text-text-2 hover:bg-hover',
                  )
                }
              >
                <Icon name={d.icon} size={18} />
                {d.title}
              </NavLink>
            ))}
            <p className="m-1.5 mt-2 rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
              {tx('عندك سؤال؟', 'Have a question?')}{' '}
              <Link to={routes.contact}>{tx('كلّمنا', 'Contact us')}</Link>
            </p>
          </nav>
          <article className="rounded-card bg-white p-8 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-5">
            <h2 className="text-[30px]">{current.title}</h2>
            <p className="mt-2 leading-relaxed text-text-2">{current.summary}</p>
            <p className="mt-2 mb-2 text-sm text-muted">
              {tx('آخر تحديث:', 'Last updated:')} {UPDATED}
            </p>
            <ol className="flex flex-col">
              {current.sections.map((sec, i) => (
                <li key={sec.title} className="border-t border-divider py-5">
                  <h3 className="flex items-center gap-3 text-xl">
                    <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-surface-blue text-sm text-blue-600">
                      {i + 1}
                    </span>
                    {sec.title}
                  </h3>
                  {sec.body.map((para) => (
                    <p key={para} className="mt-2 leading-loose text-text-2">
                      {para}
                    </p>
                  ))}
                  {sec.list && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {sec.list.map((item) => (
                        <li key={item} className="flex gap-2.5 leading-loose text-text-2">
                          <span
                            className="mt-3 size-1.5 flex-none rounded-full bg-blue-400"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>
    </>
  )
}
