import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { routes } from '@/app/routes'
import { CONTACT, SOCIAL } from '@/content/contact'
import { cn } from '@/lib/cn'
import { tx } from '@/lib/i18n'

const PLATFORM = [
  { to: routes.about, label: tx('عن د. صالح', 'About Dr. Saleh') },
  { to: routes.courses, label: tx('الدورات', 'Courses') },
  { to: routes.library, label: tx('المكتبة', 'Library') },
  { to: routes.store, label: tx('المتجر', 'Store') },
  { to: routes.blog, label: tx('المقالات', 'Articles') },
  { to: routes.consultation, label: tx('احجز استشارة', 'Book a consultation') },
]

const ACCOUNT = [
  { to: routes.myCourses, label: tx('دوراتي', 'My courses') },
  { to: routes.myBooks, label: tx('كتبي وشهاداتي', 'My books & certificates') },
  { to: routes.orders, label: tx('طلباتي', 'My orders') },
  { to: routes.referral, label: tx('ادعُ صديق واكسب', 'Invite a friend & earn') },
]

const CONTACT_LINES: { title: string; items: { label: string; href: string }[]; icon: IconName }[] = [
  { title: tx('من داخل مصر', 'Within Egypt'), items: CONTACT.phonesEgypt, icon: 'phone' },
  { title: tx('من خارج مصر', 'Outside Egypt'), items: [CONTACT.phoneIntl], icon: 'globe' },
]

const colTitle = 'mb-1 font-head text-[17px] text-white'
const colLink = 'text-[15px] text-on-dark-muted hover:text-white'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden bg-navy-deep pt-16 pb-7 text-on-dark-muted">
      <div className="absolute inset-0 dots opacity-35" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-site grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 px-6 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:px-4">
        <div className="flex flex-col gap-4.5 max-lg:col-span-full">
          <img
            src="/assets/brand/logo-white.webp"
            alt={tx('الدكتور صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
            width={200}
            height={90}
            className="w-50"
          />
          <p className="max-w-85 text-[15px] leading-loose">
            {tx(
              'منصة تعليمية في التربية الإيجابية والبناء النفسي للأطفال والمراهقين: دورات، كتب، واستشارات خاصة.',
              'An educational platform for positive parenting and the psychological development of children and teens: courses, books and private consultations.',
            )}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noreferrer"
                className="flex size-11 items-center justify-center rounded-xl text-white glass hover:bg-white/20 hover:text-white"
              >
                <Icon name={s.icon} size={18} />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label={tx('المنصة', 'Platform')} className="flex flex-col gap-3">
          <b className={colTitle}>{tx('المنصة', 'Platform')}</b>
          {PLATFORM.map((l) => (
            <Link key={l.to} to={l.to} className={colLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label={tx('حسابي', 'My account')} className="flex flex-col gap-3">
          <b className={colTitle}>{tx('حسابي', 'My account')}</b>
          {ACCOUNT.map((l) => (
            <Link key={l.to} to={l.to} className={colLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <b className={colTitle}>{tx('تواصل معنا', 'Contact us')}</b>
          {CONTACT_LINES.map((c) => (
            <span key={c.title} className="flex items-start gap-2.5 text-[15px]">
              <span className="flex size-8.5 flex-none items-center justify-center rounded-[10px] text-white glass">
                <Icon name={c.icon} size={16} />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px]">{c.title}</span>
                <span className="flex flex-wrap gap-x-2">
                  {c.items.map((n, i) => (
                    <span key={n.href} className="flex gap-x-2">
                      {i > 0 && <span aria-hidden="true">-</span>}
                      <a href={n.href} dir="ltr" className={cn(colLink, 'font-semibold text-white')}>
                        {n.label}
                      </a>
                    </span>
                  ))}
                </span>
              </span>
            </span>
          ))}
          <a
            href={CONTACT.address.href}
            target="_blank"
            rel="noreferrer"
            className={cn(colLink, 'flex items-start gap-2.5 leading-relaxed')}
          >
            <span className="flex size-8.5 flex-none items-center justify-center rounded-[10px] text-white glass">
              <Icon name="mapPin" size={16} />
            </span>
            {CONTACT.address.label}
          </a>
          <Link
            to={routes.contact}
            className="inline-flex items-center gap-1.5 font-bold text-gold-light hover:text-white"
          >
            {tx('كل طرق التواصل', 'All contact options')} <Icon name="arrowLeft" size={16} />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-11 flex max-w-site flex-wrap justify-between gap-3.5 border-t border-white/12 px-6 pt-5.5 text-sm max-sm:px-4">
        <span>
          © {year}{' '}
          {tx(
            'منصة د. صالح عبد الكريم. جميع الحقوق محفوظة.',
            'Dr. Saleh Abdelkarim Platform. All rights reserved.',
          )}
        </span>
        <nav aria-label={tx('روابط قانونية', 'Legal links')} className="flex flex-wrap gap-4.5">
          <Link to={routes.verifyCertificate} className="text-on-dark-muted hover:text-white">
            {tx('التحقق من شهادة', 'Verify a certificate')}
          </Link>
          <Link to={routes.terms} className="text-on-dark-muted hover:text-white">
            {tx('الشروط والأحكام', 'Terms & conditions')}
          </Link>
          <Link to={routes.shipping} className="text-on-dark-muted hover:text-white">
            {tx('سياسة الشحن', 'Shipping policy')}
          </Link>
          <Link to={routes.refunds} className="text-on-dark-muted hover:text-white">
            {tx('الاستبدال والاسترجاع', 'Returns & refunds')}
          </Link>
          <Link to={routes.privacy} className="text-on-dark-muted hover:text-white">
            {tx('سياسة الخصوصية', 'Privacy policy')}
          </Link>
        </nav>
      </div>
      <p className="relative mx-auto mt-4 max-w-site px-6 text-center text-[13px] text-on-dark-muted max-sm:px-4">
        {tx('صُمّم وطُوّر بواسطة شركة', 'Designed and developed by')}{' '}
        <a
          href="https://xpertcodersolutions.com"
          target="_blank"
          rel="noopener"
          dir="ltr"
          className="font-semibold text-white underline-offset-4 hover:text-white hover:underline"
        >
          XpertCoder Software Solutions
        </a>
      </p>
    </footer>
  )
}
