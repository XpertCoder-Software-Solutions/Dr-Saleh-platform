import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/api/client'
import { certificatesApi } from '@/api/endpoints'
import { HeroWave } from '@/components/layout/PageHero'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { ErrorState, Spinner } from '@/components/ui/States'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { keepScroll } from '@/lib/scroll'
import { loc, tx } from '@/lib/i18n'

/** Public page employers use to check a certificate number (also the QR code target). */
export function VerifyCertificatePage() {
  usePageTitle(tx('التحقق من شهادة', 'Verify a certificate'))
  const [params, setParams] = useSearchParams()
  const number = (params.get('n') ?? '').trim()
  const [draft, setDraft] = useState(number)

  const result = useQuery({
    queryKey: ['certificates', 'verify', number],
    queryFn: () => certificatesApi.verify(number),
    enabled: Boolean(number),
    retry: false,
  })
  const notFound = result.error instanceof ApiClientError && result.error.statusCode === 404

  function submit(e: FormEvent) {
    e.preventDefault()
    setParams(draft.trim() ? { n: draft.trim() } : {}, keepScroll)
  }

  return (
    <section className="relative overflow-hidden px-6 pt-33.5 pb-24 max-sm:px-4">
      <div className="absolute inset-x-0 top-0 h-110 bg-navy" aria-hidden="true">
        <div className="absolute inset-0 dots opacity-50" />
        <HeroWave />
      </div>
      <div className="relative mx-auto flex max-w-180 flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold text-white glass">
          <Icon name="shield" size={15} /> {tx('للجهات وأصحاب العمل', 'For organizations and employers')}
        </span>
        <h1 className="text-[clamp(30px,4.5vw,48px)] text-white">
          {tx('اتحقق من', 'Verify a')} <span className="text-sheen">{tx('شهادة', 'certificate')}</span>
        </h1>
        <p className="text-lg text-on-dark">
          {tx(
            'اكتب رقم الشهادة المكتوب تحت، أو امسح الـ QR اللي عليها.',
            'Enter the certificate number printed at the bottom, or scan its QR code.',
          )}
        </p>
        <form onSubmit={submit} className="flex w-full max-w-115 gap-2 rounded-card bg-white p-2 shadow-pop">
          <label className="flex flex-1 items-center px-3">
            <span className="sr-only">{tx('رقم الشهادة', 'Certificate number')}</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={tx('رقم الشهادة', 'Certificate number')}
              dir="ltr"
              className="w-full border-0 bg-transparent text-start text-lg font-bold tracking-wide text-ink uppercase outline-none"
            />
          </label>
          <button type="submit" className={buttonClass({ variant: 'gold' })}>
            {tx('تحقق', 'Verify')}
          </button>
        </form>

        <div className="mt-8 w-full">
          {!number ? null : result.isLoading ? (
            <div className="flex justify-center py-10 text-blue-600">
              <Spinner />
            </div>
          ) : notFound ? (
            <div className="overflow-hidden rounded-card bg-white text-start shadow-pop" role="status">
              <div className="flex items-center gap-3 bg-red-50 px-6 py-4 font-bold text-danger">
                <span className="flex size-9 items-center justify-center rounded-full bg-danger text-white">
                  <Icon name="close" size={18} />
                </span>
                {tx('مفيش شهادة بالرقم ده', 'No certificate with this number')}
              </div>
              <p className="p-6 leading-loose text-muted">
                {tx(
                  'اتأكد من الرقم وحاول تاني. لو متأكد إن الرقم صحيح، كلّمنا وهنراجعه.',
                  "Check the number and try again. If you're sure it's correct, contact us and we'll look into it.",
                )}
              </p>
            </div>
          ) : result.isError ? (
            <ErrorState onRetry={() => result.refetch()} />
          ) : result.data ? (
            <div className="overflow-hidden rounded-card bg-white text-start shadow-pop" role="status">
              <div className="flex items-center gap-3 bg-green-50 px-6 py-4 font-bold text-green-800">
                <span className="flex size-9 items-center justify-center rounded-full bg-success text-white">
                  <Icon name="check" size={18} />
                </span>
                {tx('شهادة صحيحة وصادرة من المنصة', 'Valid certificate issued by the platform')}
              </div>
              <div className="flex flex-wrap items-center gap-8 p-7">
                <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1">
                  <div className="col-span-full">
                    <dt className="text-xs text-muted">{tx('اسم المتدرب', 'Trainee name')}</dt>
                    <dd className="font-head text-2xl font-bold text-ink">{result.data.holderName}</dd>
                  </div>
                  <div className="col-span-full">
                    <dt className="text-xs text-muted">{tx('الدورة', 'Course')}</dt>
                    <dd className="text-lg font-bold text-ink">
                      {loc(result.data.course.titleAr, result.data.course.titleEn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{tx('تاريخ الإصدار', 'Issue date')}</dt>
                    <dd className="font-bold text-ink">{formatDate(result.data.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{tx('رقم الشهادة', 'Certificate number')}</dt>
                    <dd className="font-bold text-ink" dir="ltr">
                      {result.data.certificateNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{tx('المحاضر', 'Instructor')}</dt>
                    <dd className="font-bold text-ink">{tx('د. صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}</dd>
                  </div>
                </dl>
                <div className="flex flex-col items-center gap-2 max-sm:mx-auto">
                  <span className="flex size-28 items-center justify-center rounded-full border-2 border-dashed border-gold p-2">
                    <span className="flex size-full bg-gold items-center justify-center rounded-full text-navy">
                      <Icon name="award" size={44} />
                    </span>
                  </span>
                  <span className="text-xs text-muted">{tx('ختم المنصة', 'Platform seal')}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
