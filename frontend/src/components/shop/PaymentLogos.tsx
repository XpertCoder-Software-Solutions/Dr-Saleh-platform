import { cn } from '@/lib/cn'

const LOGOS = {
  applePay: { src: '/assets/payments/apple-pay.png', alt: 'Apple Pay' },
  visa: { src: '/assets/payments/visa.svg', alt: 'Visa' },
  mastercard: { src: '/assets/payments/mastercard.png', alt: 'Mastercard' },
  meeza: { src: '/assets/payments/meeza.png', alt: 'ميزة' },
  amex: { src: '/assets/payments/amex.png', alt: 'American Express' },
  vodafone: { src: '/assets/payments/vodafone-cash.png', alt: 'Vodafone Cash' },
  etisalat: { src: '/assets/payments/etisalat.png', alt: 'e& cash' },
  orange: { src: '/assets/payments/orange-money.svg', alt: 'Orange Cash' },
  we: { src: '/assets/payments/we-pay.png', alt: 'WE Pay' },
  paypal: { src: '/assets/payments/paypal.png', alt: 'PayPal' },
} as const

export type LogoName = keyof typeof LOGOS

/** Row of the official payment logos supplied for the site. */
export function PaymentLogos({ names, className }: { names: LogoName[]; className?: string }) {
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {names.map((n) => (
        <span key={n} className="flex h-7 items-center rounded-md border border-line bg-white px-1.5">
          <img src={LOGOS[n].src} alt={LOGOS[n].alt} className="h-4.5 w-auto max-w-12 object-contain" />
        </span>
      ))}
    </span>
  )
}
