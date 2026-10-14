import { useGender } from '@/auth/hooks'
import { Icon } from '@/components/ui/Icon'
import { formatDate } from '@/lib/format'

interface Props {
  holder: string
  courseTitle: string
  number: string
  issuedAt: string
  /** Base font size in px; everything inside scales from it. */
  base?: number
}

/** The certificate itself. Sized in em so the card preview and the printable page share one layout. */
export function CertificateArt({ holder, courseTitle, number, issuedAt, base = 14 }: Props) {
  const g = useGender()
  return (
    <div
      className="relative overflow-hidden rounded-[0.9em] border border-[#EADBB8] bg-[#FFFDF8] p-[0.8em] print:rounded-none print:border-0"
      style={{ fontSize: base }}
    >
      <div className="absolute -top-[3em] -left-[3em] size-[10em] rotate-45 bg-navy" aria-hidden="true" />
      <div
        className="absolute -right-[3em] -bottom-[3em] size-[8em] rotate-45 bg-gold opacity-70"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-[0.45em] rounded-[0.5em] border-2 border-[#E8D3A2] px-[2em] py-[2.2em] text-center">
        <img src="/assets/brand/logo-blue.webp" alt="منصة د. صالح عبد الكريم" className="h-[3.6em] w-auto" />
        <span className="text-[0.9em] font-bold tracking-wide text-gold-ink">شهادة إتمام</span>
        <span className="text-[0.85em] text-muted">تشهد المنصة بأن</span>
        <b className="font-head text-[2em] leading-tight text-ink">{holder}</b>
        <span className="text-[0.85em] text-muted">{g('أتمّ', 'أتمّت', 'أتمّ')} بنجاح دورة</span>
        <b className="text-[1.15em] text-blue-600">{courseTitle}</b>
        <div className="mt-[1em] flex w-full items-end justify-between text-[0.8em] text-muted">
          <span className="flex flex-col items-start">
            <b className="text-ink">{formatDate(issuedAt)}</b>
            <span>
              رقم: <span dir="ltr">{number}</span>
            </span>
          </span>
          <span className="flex size-[3.6em] bg-gold items-center justify-center rounded-full text-navy shadow-gold">
            <Icon name="award" size={base * 1.6} />
          </span>
          <span className="flex flex-col items-end">
            <b className="text-ink">د. صالح عبد الكريم</b>
            <span>المستشار النفسي والتربوي</span>
          </span>
        </div>
      </div>
    </div>
  )
}
