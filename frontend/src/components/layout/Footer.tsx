import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { routes } from '@/app/routes'
import { CONTACT, SOCIAL } from '@/content/contact'
import { cn } from '@/lib/cn'

const PLATFORM = [
  { to: routes.about, label: 'عن د. صالح' },
  { to: routes.courses, label: 'الدورات' },
  { to: routes.library, label: 'المكتبة' },
  { to: routes.store, label: 'المتجر' },
  { to: routes.blog, label: 'المقالات' },
  { to: routes.consultation, label: 'احجز استشارة' },
]

const ACCOUNT = [
  { to: routes.myCourses, label: 'دوراتي' },
  { to: routes.myBooks, label: 'كتبي وشهاداتي' },
  { to: routes.orders, label: 'طلباتي' },
  { to: routes.referral, label: 'ادعُ صديق واكسب' },
]

const CONTACT_LINES: { title: string; items: { label: string; href: string }[]; icon: IconName }[] = [
  { title: 'من داخل مصر', items: CONTACT.phonesEgypt, icon: 'phone' },
  { title: 'من خارج مصر', items: [CONTACT.phoneIntl], icon: 'globe' },
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
            alt="الدكتور صالح عبد الكريم"
            width={200}
            height={90}
            className="w-50"
          />
          <p className="max-w-85 text-[15px] leading-loose">
            منصة تعليمية في التربية الإيجابية والبناء النفسي للأطفال والمراهقين: دورات، كتب، واستشارات خاصة.
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

        <nav aria-label="المنصة" className="flex flex-col gap-3">
          <b className={colTitle}>المنصة</b>
          {PLATFORM.map((l) => (
            <Link key={l.to} to={l.to} className={colLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="حسابي" className="flex flex-col gap-3">
          <b className={colTitle}>حسابي</b>
          {ACCOUNT.map((l) => (
            <Link key={l.to} to={l.to} className={colLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <b className={colTitle}>تواصل معنا</b>
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
            كل طرق التواصل <Icon name="arrowLeft" size={16} />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-11 flex max-w-site flex-wrap justify-between gap-3.5 border-t border-white/12 px-6 pt-5.5 text-sm max-sm:px-4">
        <span>© {year} منصة د. صالح عبد الكريم. جميع الحقوق محفوظة.</span>
        <nav aria-label="روابط قانونية" className="flex flex-wrap gap-4.5">
          <Link to={routes.verifyCertificate} className="text-on-dark-muted hover:text-white">
            التحقق من شهادة
          </Link>
          <Link to={routes.terms} className="text-on-dark-muted hover:text-white">
            الشروط والأحكام
          </Link>
          <Link to={routes.shipping} className="text-on-dark-muted hover:text-white">
            سياسة الشحن
          </Link>
          <Link to={routes.refunds} className="text-on-dark-muted hover:text-white">
            الاستبدال والاسترجاع
          </Link>
          <Link to={routes.privacy} className="text-on-dark-muted hover:text-white">
            سياسة الخصوصية
          </Link>
        </nav>
      </div>
      <p className="relative mx-auto mt-4 max-w-site px-6 text-center text-[13px] text-on-dark-muted max-sm:px-4">
        صُمّم وطُوّر بواسطة شركة{' '}
        <b className="font-semibold text-white" dir="ltr">
          XpertCoder Software Solutions
        </b>
      </p>
    </footer>
  )
}
