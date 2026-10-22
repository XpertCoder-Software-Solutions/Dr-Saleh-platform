import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { tx } from '@/lib/i18n'

export function ConsultSuccess({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
      <span className="flex size-18 animate-pop items-center justify-center rounded-full bg-green-50 text-success">
        <Icon name="check" size={36} strokeWidth={2.5} />
      </span>
      <h2 className="text-[28px]">
        {name
          ? tx(`وصلنا طلبك يا ${name}`, `We got your request, ${name}`)
          : tx('وصلنا طلبك', 'We got your request')}
      </h2>
      <p className="max-w-110 leading-loose text-muted">
        {tx(
          'فريقنا هيكلمك على واتساب خلال 24 ساعة عشان نحدد الميعاد المناسب. وبعتنالك إيميل فيه تأكيد الطلب.',
          "Our team will message you on WhatsApp within 24 hours to set a suitable time. We've also emailed you a confirmation.",
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={routes.courses} className={buttonClass({ variant: 'navy' })}>
          {tx('تصفّح الدورات لحد ما نكلمك', 'Browse the courses while you wait')}
        </Link>
        <Link to={routes.home} className={buttonClass({ variant: 'outline' })}>
          {tx('الرئيسية', 'Home')}
        </Link>
      </div>
    </div>
  )
}
