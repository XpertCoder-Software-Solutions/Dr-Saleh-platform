import { Link } from 'react-router-dom'
import { useCopy } from '@/auth/hooks'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'
import { CONTACT } from '@/content/contact'

export function CTABand({
  title = 'مش لاقي الدورة المناسبة؟',
  body = 'احكيلنا عن ابنك في استشارة قصيرة، والدكتور صالح يرشّحلك المسار اللي يناسبه.',
}: {
  title?: string
  body?: string
}) {
  const t = useCopy()
  return (
    <section className={sectionClass}>
      <div
        className={cn(
          innerClass,
          'relative flex min-h-75 bg-navy items-center overflow-hidden rounded-band p-14 max-md:px-7 max-md:py-10',
        )}
      >
        <div className="absolute inset-0 dots opacity-45" aria-hidden="true" />
        <div
          className="absolute -top-50 -left-45 size-130 animate-spin-slow rounded-full border-2 border-dashed border-white/14"
          aria-hidden="true"
        />
        <div className="relative flex max-w-155 flex-col gap-4.5">
          <h2 className="text-[clamp(28px,4vw,42px)] text-white">{title}</h2>
          <p className="text-lg leading-loose text-on-dark">{body}</p>
          <div className="mt-1.5 flex flex-wrap gap-3.5">
            <a
              href={CONTACT.whatsapp.href}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: 'gold', size: 'lg' })}
            >
              كلّمنا على واتساب <Icon name="arrowLeft" />
            </a>
            <Link to={routes.consultation} className={buttonClass({ variant: 'glass', size: 'lg' })}>
              {t('cta.bookPrivate')}
            </Link>
          </div>
        </div>
        <img
          className="absolute bottom-0 left-15 h-[92%] w-auto drop-shadow-[0_20px_40px_rgba(5,20,40,.45)] max-md:hidden"
          src="/assets/brand/saleh-cutout.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      </div>
    </section>
  )
}
