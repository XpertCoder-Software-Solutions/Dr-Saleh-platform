import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { contactApi } from '@/api/endpoints'
import { useAuth, useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { CONTACT, SOCIAL } from '@/content/contact'
import { PageHero } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { ChoiceChips, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, Spinner } from '@/components/ui/States'
import { Highlight } from '@/components/ui/Highlight'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { warnFormErrors } from '@/lib/formErrors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TOPICS = [
  { value: 'دورة', label: 'دورة' },
  { value: 'طلب أو شحن', label: 'طلب أو شحن' },
  { value: 'الدفع', label: 'الدفع' },
  { value: 'حسابي', label: 'حسابي' },
  { value: 'حاجة تانية', label: 'حاجة تانية' },
]

const FAQS = [
  { q: 'إمتى بيتفتح لي محتوى الدورة؟', a: 'فور تأكيد الدفع، والدورة بتفضل متاحة لك مدى الحياة من أي جهاز.' },
  { q: 'الكتاب الورقي بيوصل في قد إيه؟', a: 'من 2 لـ 4 أيام عمل داخل مصر، وهيوصلك رقم تتبّع على الواتساب.' },
  { q: 'ممكن أسترجع فلوسي؟', a: 'أيوه، حسب سياسة الاسترداد. كلّمنا من الفورم هنا واكتب رقم الطلب.' },
]

const CHANNELS: {
  label: string
  /** One or more numbers; each one is a link when it has an href. */
  value: { label: string; href?: string }[]
  cta: string
  href?: string
  icon: IconName
  bg: string
  dark?: boolean
}[] = [
  {
    label: 'واتساب',
    value: [CONTACT.whatsapp],
    cta: 'ابدأ محادثة',
    href: CONTACT.whatsapp.href,
    icon: 'whatsapp',
    bg: 'linear-gradient(135deg, #1B8A5A 0%, #2FB36A 100%)',
  },
  {
    label: 'من داخل مصر',
    value: CONTACT.phonesEgypt,
    cta: 'اتصل بينا',
    href: CONTACT.phonesEgypt[0].href,
    icon: 'phone',
    bg: 'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)',
  },
  {
    label: 'من خارج مصر',
    value: [CONTACT.phoneIntl],
    cta: 'اتصل بينا',
    href: CONTACT.phoneIntl.href,
    icon: 'globe',
    bg: 'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 50%, #7CD3FF 100%)',
  },
  {
    label: 'مواعيد العمل',
    value: [{ label: CONTACT.hours.days }],
    cta: CONTACT.hours.time,
    icon: 'clock',
    bg: 'linear-gradient(135deg, #F7CF7E 0%, #E8A33D 100%)',
    dark: true,
  },
]

export function ContactPage() {
  usePageTitle('تواصل معنا')
  const t = useCopy()
  const { user } = useAuth()
  const [form, setForm] = useState({
    topic: 'دورة',
    name: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'phone' | 'message', string>>>({})
  const [faq, setFaq] = useState(0)
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const send = useMutation({
    mutationFn: () =>
      contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        // The API has no topic field, so it leads the message.
        message: `[${form.topic}] ${form.message.trim()}`,
      }),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const er: typeof errors = {}
    if (form.name.trim().length < 2) er.name = 'اكتب اسمك.'
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'البريد الإلكتروني مش صحيح.'
    if (!isValidPhone(form.phone)) er.phone = 'اكتب رقم صحيح نقدر نكلمك عليه.'
    if (form.message.trim().length < 5) er.message = 'اكتب رسالتك.'
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) send.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'تواصل معنا' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            بنرد عادةً خلال يوم عمل
          </>
        }
        title={
          <>
            إحنا هنا <span className="text-sheen">عشان نسمعك</span>
          </>
        }
        body="عندك سؤال عن دورة أو طلب أو استشارة؟ كلّمنا من أي قناة تريحك، أو ابعتلنا رسالة وفريقنا هيرد عليك."
      >
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {CHANNELS.map((c) => (
            <div
              key={c.label}
              className="flex flex-col gap-2 rounded-card bg-white p-5 text-text shadow-[0_30px_60px_-36px_rgba(5,20,40,.6)]"
            >
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-[14px]',
                  c.dark ? 'text-navy' : 'text-white',
                )}
                style={{ background: c.bg }}
              >
                <Icon name={c.icon} />
              </span>
              <span className="mt-1 text-sm text-muted">{c.label}</span>
              <b className="flex flex-col font-head text-lg text-ink">
                {c.value.map((v) =>
                  v.href ? (
                    <a
                      key={v.label}
                      href={v.href}
                      dir="ltr"
                      className="self-start text-ink hover:text-blue-600"
                    >
                      {v.label}
                    </a>
                  ) : (
                    <span key={v.label}>{v.label}</span>
                  ),
                )}
              </b>
              {c.href ? (
                <a
                  href={c.href}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-bold"
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.cta} <Icon name="arrowLeft" size={14} />
                </a>
              ) : (
                <span className="mt-auto text-sm font-bold text-blue-500">{c.cta}</span>
              )}
            </div>
          ))}
        </div>
      </PageHero>

      <section className={cn(sectionClass, 'pt-10')}>
        <div className={cn(innerClass, 'grid grid-cols-[1.4fr_1fr] items-start gap-7 max-lg:grid-cols-1')}>
          <div className="rounded-card border border-line bg-white p-7 max-sm:p-5">
            {send.isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
                <span className="flex size-18 animate-pop items-center justify-center rounded-full bg-green-50 text-success">
                  <Icon name="check" size={36} strokeWidth={2.5} />
                </span>
                <h2 className="text-[28px]">وصلتنا رسالتك</h2>
                <p className="max-w-105 leading-loose text-muted">
                  هنرد عليك على الإيميل أو الموبايل خلال يوم عمل.
                </p>
                <button
                  type="button"
                  className={buttonClass({ variant: 'outline' })}
                  onClick={() => send.reset()}
                >
                  ابعت رسالة تانية
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <div>
                  <h2 className="text-[28px]">
                    <Highlight text="ابعتلنا *رسالة*" />
                  </h2>
                  <p className="mt-1 text-sm text-muted">كل الخانات مطلوبة.</p>
                </div>
                <ChoiceChips
                  label="بخصوص إيه؟"
                  value={form.topic}
                  onChange={(v) => set('topic', v)}
                  options={TOPICS}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label="الاسم"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={errors.name}
                  />
                  <TextField
                    label="البريد الإلكتروني"
                    type="email"
                    ltr
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                  />
                </div>
                <PhoneField
                  label="رقم الهاتف أو الواتساب"
                  value={form.phone}
                  onChange={(v) => set('phone', v)}
                  error={errors.phone}
                />
                <TextAreaField
                  label="رسالتك"
                  rows={5}
                  placeholder="اكتب رسالتك هنا…"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  error={errors.message}
                  maxLength={2000}
                />
                {send.isError && <Alert tone="error">{(send.error as Error).message}</Alert>}
                <button
                  type="submit"
                  className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                  disabled={send.isPending}
                >
                  {send.isPending ? <Spinner label="جاري الإرسال" /> : 'ابعت الرسالة'}
                </button>
              </form>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex bg-navy flex-col gap-3 rounded-card p-6 text-white">
              <b className="font-head text-xl">محتاج استشارة خاصة؟</b>
              <p className="text-sm leading-relaxed text-on-dark">
                لو سؤالك عن موقف مع ابنك، الأفضل تحجز استشارة مع الدكتور صالح.
              </p>
              <Link
                to={routes.consultation}
                className={buttonClass({ variant: 'gold', size: 'sm', className: 'self-start' })}
              >
                {t('cta.book')}
              </Link>
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <b className="font-head text-lg text-ink">زورنا</b>
              <p className="flex items-start gap-2.5 text-[15px] leading-relaxed text-text">
                <Icon name="mapPin" size={18} className="mt-1 flex-none text-blue-600" />
                {CONTACT.address.label}
              </p>
              <p className="flex items-center gap-2.5 text-sm text-muted">
                <Icon name="clock" size={16} className="flex-none text-blue-600" />
                {CONTACT.hours.days}، {CONTACT.hours.time}
              </p>
              <a
                href={CONTACT.address.href}
                target="_blank"
                rel="noreferrer"
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'self-start' })}
              >
                <Icon name="mapPin" size={15} /> افتح على الخريطة
              </a>
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <b className="font-head text-lg text-ink">تابعنا</b>
              <div className="flex flex-wrap gap-2">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-hover hover:text-ink"
                  >
                    <Icon name={s.icon} size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col rounded-card border border-line bg-white p-5">
              <b className="mb-2 font-head text-lg text-ink">أسئلة سريعة</b>
              {FAQS.map((f, i) => (
                <div key={f.q} className="border-t border-divider first:border-t-0">
                  <button
                    type="button"
                    aria-expanded={faq === i}
                    onClick={() => setFaq(faq === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-3.5 text-start font-semibold text-ink"
                  >
                    {f.q}
                    <span className="text-blue-500">{faq === i ? '−' : '+'}</span>
                  </button>
                  {faq === i && <p className="pb-3.5 text-sm leading-relaxed text-muted">{f.a}</p>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
