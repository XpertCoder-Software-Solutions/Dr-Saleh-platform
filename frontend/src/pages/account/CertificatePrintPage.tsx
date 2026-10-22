import { Link, useParams } from 'react-router-dom'
import { useMyCertificates } from '@/api/account'
import { routes } from '@/app/routes'
import { useAuth } from '@/auth/hooks'
import { CertificateArt } from '@/components/account/CertificateArt'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/States'
import { usePageTitle } from '@/lib/usePageTitle'
import { loc, tx } from '@/lib/i18n'

/** Full-page certificate laid out for A4 landscape; "Save as PDF" in the print dialog makes the file. */
export function CertificatePrintPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const certs = useMyCertificates()
  const cert = certs.data?.find((c) => c.id === id)
  usePageTitle(cert ? `شهادة ${loc(cert.course.titleAr, cert.course.titleEn)}` : 'شهادة')

  return (
    <div className="min-h-dvh bg-surface print:bg-white">
      <style>{'@page { size: A4 landscape; margin: 10mm }'}</style>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 print:hidden">
        <Link to={routes.certificates} className={buttonClass({ variant: 'outline', size: 'sm' })}>
          <Icon name="chevRight" size={15} /> {tx('شهاداتي', 'My certificates')}
        </Link>
        <span className="text-sm text-muted max-sm:hidden">
          {tx('من نافذة الطباعة اختار «حفظ كـ PDF»', 'In the print dialog, choose “Save as PDF”')}
        </span>
        <button
          type="button"
          className={buttonClass({ variant: 'gold', size: 'sm' })}
          disabled={!cert}
          onClick={() => window.print()}
        >
          <Icon name="download" size={15} /> {tx('طباعة / حفظ PDF', 'Print / save PDF')}
        </button>
      </div>
      <main className="mx-auto max-w-[1100px] p-8 max-sm:p-3 print:max-w-none print:p-0">
        {certs.isLoading ? (
          <div className="flex justify-center py-32 text-blue-600">
            <Spinner />
          </div>
        ) : !cert ? (
          <div className="mx-auto max-w-lg rounded-card bg-white p-8">
            <EmptyState
              icon="award"
              title={tx('الشهادة دي مش موجودة في حسابك', "This certificate isn't in your account")}
            />
          </div>
        ) : (
          <CertificateArt
            holder={cert.user?.fullName || user?.fullName || ''}
            courseTitle={loc(cert.course.titleAr, cert.course.titleEn)}
            number={cert.certificateNumber}
            issuedAt={cert.issuedAt}
            base={22}
          />
        )}
      </main>
    </div>
  )
}
