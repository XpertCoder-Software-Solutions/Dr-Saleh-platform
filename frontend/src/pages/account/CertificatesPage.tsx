import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyCertificates, useMyCourses, type MyCertificate } from '@/api/account'
import { routes } from '@/app/routes'
import { useAuth, useGender } from '@/auth/hooks'
import { AccountShell, Panel, ProgressBar } from '@/components/account/AccountShell'
import { CertificateArt } from '@/components/account/CertificateArt'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { formatDate } from '@/lib/format'

function verifyLink(number: string) {
  return `${window.location.origin}${routes.verifyCertificate}?n=${encodeURIComponent(number)}`
}

export function CertificatesPage() {
  const g = useGender()
  const certs = useMyCertificates()
  const courses = useMyCourses()
  const owned = new Set((certs.data ?? []).map((c) => c.courseId))
  const upcoming = (courses.data ?? []).filter(
    (e) => e.course.certificateEnabled !== false && !owned.has(e.courseId),
  )

  return (
    <AccountShell
      active="certs"
      pageTitle="شهاداتي"
      title={<span className="text-sheen">شهاداتي</span>}
      body={g(
        'حمّل شهاداتك أو شاركها، وكل شهادة ليها رابط تحقق.',
        'حمّلي شهاداتك أو شاركيها، وكل شهادة ليها رابط تحقق.',
        'تحميل الشهادات ومشاركتها، وكل شهادة ليها رابط تحقق.',
      )}
    >
      {certs.isError ? (
        <ErrorState onRetry={() => certs.refetch()} />
      ) : certs.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : certs.data!.length === 0 ? (
        <Panel>
          <EmptyState
            icon="award"
            title="لسه مفيش شهادات"
            body={g(
              'خلّص أي دورة وهتطلعلك شهادتها هنا تلقائيًا.',
              'خلّصي أي دورة وهتطلعلك شهادتها هنا تلقائيًا.',
              'أول ما دورة تكمل، شهادتها بتظهر هنا تلقائيًا.',
            )}
          />
        </Panel>
      ) : (
        certs.data!.map((c) => <CertificateCard key={c.id} cert={c} />)
      )}

      {upcoming.length > 0 && (
        <Panel className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl">شهادات في الطريق</h2>
            <p className="text-sm text-muted">
              {g('كمّل الدورات دي', 'كمّلي الدورات دي', 'الدورات دي لما تكمل')} وهتطلعلك شهادتها تلقائيًا
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-4 rounded-tile bg-surface p-4 max-sm:flex-wrap">
                <span className="flex size-11 flex-none items-center justify-center rounded-xl border border-line bg-white text-muted">
                  <Icon name="lock" size={17} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <b className="text-ink">{e.course.titleAr}</b>
                  <ProgressBar value={e.completionPercentage} />
                </span>
                <Link to={routes.learn(e.courseId)} className={buttonClass({ variant: 'navy', size: 'sm' })}>
                  <Icon name="play" size={13} /> {g('كمّل', 'كمّلي', 'استكمال')}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AccountShell>
  )
}

function CertificateCard({ cert }: { cert: MyCertificate }) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const link = verifyLink(cert.certificateNumber)
  const holder = cert.user?.fullName || user?.fullName || ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('انسخ الرابط', link)
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `شهادة إتمام: ${cert.course.titleAr}`, url: link })
      } catch {
        // cancelled
      }
    } else copy()
  }

  return (
    <Panel className="grid grid-cols-[1fr_1.15fr] items-center gap-7 max-lg:grid-cols-1">
      <div className="flex flex-col gap-3 max-lg:order-2">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#E7F6EC] px-3 py-1 text-xs font-bold text-success">
          <Icon name="check" size={12} /> شهادة جاهزة
        </span>
        <h2 className="text-2xl leading-snug">{cert.course.titleAr}</h2>
        <p className="text-sm text-muted">
          اتصدرت في {formatDate(cert.issuedAt)} · رقم{' '}
          <span dir="ltr" className="font-bold text-ink">
            {cert.certificateNumber}
          </span>
        </p>
        <Link
          to={routes.certificatePrint(cert.id)}
          target="_blank"
          className={buttonClass({ variant: 'gold', block: true })}
        >
          <Icon name="download" size={16} /> تحميل PDF
        </Link>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" className={buttonClass({ variant: 'outline', size: 'sm' })} onClick={share}>
            <Icon name="link" size={14} /> مشاركة
          </button>
          <button type="button" className={buttonClass({ variant: 'outline', size: 'sm' })} onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'اتنسخ' : 'نسخ رابط التحقق'}
          </button>
        </div>
      </div>

      <CertificateArt
        holder={holder}
        courseTitle={cert.course.titleAr}
        number={cert.certificateNumber}
        issuedAt={cert.issuedAt}
        base={12}
      />
    </Panel>
  )
}
