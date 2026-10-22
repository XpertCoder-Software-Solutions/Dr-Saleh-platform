import { Link } from 'react-router-dom'
import { useCopy } from '@/auth/hooks'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'
import { CONTACT } from '@/content/contact'
import { tx } from '@/lib/i18n'

export function CTABand({
  title = tx('مش لاقي الدورة المناسبة؟', "Can't find the right course?"),
  body = tx(
    'احكيلنا عن ابنك في استشارة قصيرة، والدكتور صالح يرشّحلك المسار اللي يناسبه.',
    'Tell us about your child in a short consultation, and Dr. Saleh will recommend the right path.',
  ),
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
          className="absolute -end-45 -top-50 size-130 animate-spin-slow rounded-full border-2 border-dashed border-white/14"
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
              {tx('كلّمنا على واتساب', 'Chat with us on WhatsApp')} <Icon name="arrowLeft" />
            </a>
            <Link to={routes.consultation} className={buttonClass({ variant: 'glass', size: 'lg' })}>
              {t('cta.bookPrivate')}
            </Link>
          </div>
        </div>
        <img
          className="absolute end-15 bottom-0 h-[92%] w-auto drop-shadow-[0_20px_40px_rgba(5,20,40,.45)] max-md:hidden"
          src="/assets/brand/saleh-cutout.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      </div>
    </section>
  )
}
