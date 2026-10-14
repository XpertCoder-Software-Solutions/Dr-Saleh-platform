import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'

export function ConsultSuccess({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
      <span className="flex size-18 animate-pop items-center justify-center rounded-full bg-green-50 text-success">
        <Icon name="check" size={36} strokeWidth={2.5} />
      </span>
      <h2 className="text-[28px]">{name ? `وصلنا طلبك يا ${name}` : 'وصلنا طلبك'}</h2>
      <p className="max-w-110 leading-loose text-muted">
        فريقنا هيكلمك على واتساب خلال 24 ساعة عشان نحدد الميعاد المناسب. وبعتنالك إيميل فيه تأكيد الطلب.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={routes.courses} className={buttonClass({ variant: 'navy' })}>
          تصفّح الدورات لحد ما نكلمك
        </Link>
        <Link to={routes.home} className={buttonClass({ variant: 'outline' })}>
          الرئيسية
        </Link>
      </div>
    </div>
  )
}
