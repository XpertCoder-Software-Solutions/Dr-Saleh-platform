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
import { tx } from '@/lib/i18n'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TOPICS = [
  { value: 'دورة', label: tx('دورة', 'A course') },
  { value: 'طلب أو شحن', label: tx('طلب أو شحن', 'An order or shipping') },
  { value: 'الدفع', label: tx('الدفع', 'Payment') },
  { value: 'حسابي', label: tx('حسابي', 'My account') },
  { value: 'حاجة تانية', label: tx('حاجة تانية', 'Something else') },
]

const FAQS = [
  {
    q: tx('إمتى بيتفتح لي محتوى الدورة؟', 'When does the course open for me?'),
    a: tx(
      'فور تأكيد الدفع، والدورة بتفضل متاحة لك مدى الحياة من أي جهاز.',
      'As soon as payment is confirmed, and it stays available to you for life on any device.',
    ),
  },
  {
    q: tx('الكتاب الورقي بيوصل في قد إيه؟', 'How long does a paperback take to arrive?'),
    a: tx(
      'من 2 لـ 4 أيام عمل داخل مصر، وهيوصلك رقم تتبّع على الواتساب.',
      "2–4 business days within Egypt, and you'll get a tracking number on WhatsApp.",
    ),
  },
  {
    q: tx('ممكن أسترجع فلوسي؟', 'Can I get a refund?'),
    a: tx(
      'أيوه، حسب سياسة الاسترداد. كلّمنا من الفورم هنا واكتب رقم الطلب.',
      'Yes, according to the refund policy. Contact us using this form and include your order number.',
    ),
  },
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
    label: tx('واتساب', 'WhatsApp'),
    value: [CONTACT.whatsapp],
    cta: tx('ابدأ محادثة', 'Start a chat'),
    href: CONTACT.whatsapp.href,
    icon: 'whatsapp',
    bg: 'linear-gradient(135deg, #1B8A5A 0%, #2FB36A 100%)',
  },
  {
    label: tx('من داخل مصر', 'Within Egypt'),
    value: CONTACT.phonesEgypt,
    cta: tx('اتصل بينا', 'Call us'),
    href: CONTACT.phonesEgypt[0].href,
    icon: 'phone',
    bg: 'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)',
  },
  {
    label: tx('من خارج مصر', 'Outside Egypt'),
    value: [CONTACT.phoneIntl],
    cta: tx('اتصل بينا', 'Call us'),
    href: CONTACT.phoneIntl.href,
    icon: 'globe',
    bg: 'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 50%, #7CD3FF 100%)',
  },
  {
    label: tx('مواعيد العمل', 'Working hours'),
    value: [{ label: CONTACT.hours.days }],
    cta: CONTACT.hours.time,
    icon: 'clock',
    bg: 'linear-gradient(135deg, #F7CF7E 0%, #E8A33D 100%)',
    dark: true,
  },
]

export function ContactPage() {
  usePageTitle(tx('تواصل معنا', 'Contact us'))
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
    if (form.name.trim().length < 2) er.name = tx('اكتب اسمك.', 'Enter your name.')
    if (!EMAIL_RE.test(form.email.trim()))
      er.email = tx('البريد الإلكتروني مش صحيح.', "That email doesn't look right.")
    if (!isValidPhone(form.phone))
      er.phone = tx('اكتب رقم صحيح نقدر نكلمك عليه.', 'Enter a number we can reach you on.')
    if (form.message.trim().length < 5) er.message = tx('اكتب رسالتك.', 'Write your message.')
    setErrors(er)
    warnFormErrors(er)
    if (!Object.keys(er).length) send.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[
          { label: tx('الرئيسية', 'Home'), to: routes.home },
          { label: tx('تواصل معنا', 'Contact us') },
        ]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            {tx('بنرد عادةً خلال يوم عمل', 'We usually reply within one business day')}
          </>
        }
        title={
          <>
            {tx('إحنا هنا', "We're here")} <span className="text-sheen">{tx('عشان نسمعك', 'to listen')}</span>
          </>
        }
        body={tx(
          'عندك سؤال عن دورة أو طلب أو استشارة؟ كلّمنا من أي قناة تريحك، أو ابعتلنا رسالة وفريقنا هيرد عليك.',
          'Have a question about a course, an order or a consultation? Reach us however suits you, or send a message and our team will reply.',
        )}
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
                <h2 className="text-[28px]">{tx('وصلتنا رسالتك', 'We got your message')}</h2>
                <p className="max-w-105 leading-loose text-muted">
                  {tx(
                    'هنرد عليك على الإيميل أو الموبايل خلال يوم عمل.',
                    "We'll reply by email or phone within one business day.",
                  )}
                </p>
                <button
                  type="button"
                  className={buttonClass({ variant: 'outline' })}
                  onClick={() => send.reset()}
                >
                  {tx('ابعت رسالة تانية', 'Send another message')}
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <div>
                  <h2 className="text-[28px]">
                    <Highlight text={tx('ابعتلنا *رسالة*', 'Send us a *message*')} />
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {tx('كل الخانات مطلوبة.', 'All fields are required.')}
                  </p>
                </div>
                <ChoiceChips
                  label={tx('بخصوص إيه؟', 'What is it about?')}
                  value={form.topic}
                  onChange={(v) => set('topic', v)}
                  options={TOPICS}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label={tx('الاسم', 'Name')}
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={errors.name}
                  />
                  <TextField
                    label={tx('البريد الإلكتروني', 'Email')}
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
                  label={tx('رقم الهاتف أو الواتساب', 'Phone or WhatsApp number')}
                  value={form.phone}
                  onChange={(v) => set('phone', v)}
                  error={errors.phone}
                />
                <TextAreaField
                  label={tx('رسالتك', 'Your message')}
                  rows={5}
                  placeholder={tx('اكتب رسالتك هنا…', 'Write your message here…')}
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
                  {send.isPending ? (
                    <Spinner label={tx('جاري الإرسال', 'Sending')} />
                  ) : (
                    tx('ابعت الرسالة', 'Send message')
                  )}
                </button>
              </form>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex bg-navy flex-col gap-3 rounded-card p-6 text-white">
              <b className="font-head text-xl">{tx('محتاج استشارة خاصة؟', 'Need a private consultation?')}</b>
              <p className="text-sm leading-relaxed text-on-dark">
                {tx(
                  'لو سؤالك عن موقف مع ابنك، الأفضل تحجز استشارة مع الدكتور صالح.',
                  'If your question is about a situation with your child, it’s best to book a consultation with Dr. Saleh.',
                )}
              </p>
              <Link
                to={routes.consultation}
                className={buttonClass({ variant: 'gold', size: 'sm', className: 'self-start' })}
              >
                {t('cta.book')}
              </Link>
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <b className="font-head text-lg text-ink">{tx('زورنا', 'Visit us')}</b>
              <p className="flex items-start gap-2.5 text-[15px] leading-relaxed text-text">
                <Icon name="mapPin" size={18} className="mt-1 flex-none text-blue-600" />
                {CONTACT.address.label}
              </p>
              <p className="flex items-center gap-2.5 text-sm text-muted">
                <Icon name="clock" size={16} className="flex-none text-blue-600" />
                {CONTACT.hours.days}
                {tx('، ', ', ')}
                {CONTACT.hours.time}
              </p>
              <a
                href={CONTACT.address.href}
                target="_blank"
                rel="noreferrer"
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'self-start' })}
              >
                <Icon name="mapPin" size={15} /> {tx('افتح على الخريطة', 'Open in Maps')}
              </a>
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <b className="font-head text-lg text-ink">{tx('تابعنا', 'Follow us')}</b>
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
              <b className="mb-2 font-head text-lg text-ink">{tx('أسئلة سريعة', 'Quick questions')}</b>
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
