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

/** Public page employers use to check a certificate number (also the QR code target). */
export function VerifyCertificatePage() {
  usePageTitle('التحقق من شهادة')
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
    setParams(draft.trim() ? { n: draft.trim() } : {})
  }

  return (
    <section className="relative overflow-hidden px-6 pt-33.5 pb-24 max-sm:px-4">
      <div className="absolute inset-x-0 top-0 h-110 bg-navy" aria-hidden="true">
        <div className="absolute inset-0 dots opacity-50" />
        <HeroWave />
      </div>
      <div className="relative mx-auto flex max-w-180 flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold text-white glass">
          <Icon name="shield" size={15} /> للجهات وأصحاب العمل
        </span>
        <h1 className="text-[clamp(30px,4.5vw,48px)] text-white">
          اتحقق من <span className="text-sheen">شهادة</span>
        </h1>
        <p className="text-lg text-on-dark">اكتب رقم الشهادة المكتوب تحت، أو امسح الـ QR اللي عليها.</p>
        <form onSubmit={submit} className="flex w-full max-w-115 gap-2 rounded-card bg-white p-2 shadow-pop">
          <label className="flex flex-1 items-center px-3">
            <span className="sr-only">رقم الشهادة</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="رقم الشهادة"
              dir="ltr"
              className="w-full border-0 bg-transparent text-right text-lg font-bold tracking-wide text-ink uppercase outline-none"
            />
          </label>
          <button type="submit" className={buttonClass({ variant: 'gold' })}>
            تحقق
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
                مفيش شهادة بالرقم ده
              </div>
              <p className="p-6 leading-loose text-muted">
                اتأكد من الرقم وحاول تاني. لو متأكد إن الرقم صحيح، كلّمنا وهنراجعه.
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
                شهادة صحيحة وصادرة من المنصة
              </div>
              <div className="flex flex-wrap items-center gap-8 p-7">
                <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 max-sm:grid-cols-1">
                  <div className="col-span-full">
                    <dt className="text-xs text-muted">اسم المتدرب</dt>
                    <dd className="font-head text-2xl font-bold text-ink">{result.data.holderName}</dd>
                  </div>
                  <div className="col-span-full">
                    <dt className="text-xs text-muted">الدورة</dt>
                    <dd className="text-lg font-bold text-ink">{result.data.course.titleAr}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">تاريخ الإصدار</dt>
                    <dd className="font-bold text-ink">{formatDate(result.data.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">رقم الشهادة</dt>
                    <dd className="font-bold text-ink" dir="ltr">
                      {result.data.certificateNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">المحاضر</dt>
                    <dd className="font-bold text-ink">د. صالح عبد الكريم</dd>
                  </div>
                </dl>
                <div className="flex flex-col items-center gap-2 max-sm:mx-auto">
                  <span className="flex size-28 items-center justify-center rounded-full border-2 border-dashed border-gold p-2">
                    <span className="flex size-full bg-gold items-center justify-center rounded-full text-navy">
                      <Icon name="award" size={44} />
                    </span>
                  </span>
                  <span className="text-xs text-muted">ختم المنصة</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
