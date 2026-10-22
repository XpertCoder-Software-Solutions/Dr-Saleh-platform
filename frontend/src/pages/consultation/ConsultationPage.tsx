import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { consultationsApi } from '@/api/endpoints'
import { useAuth, useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { CheckField, ChoiceChips, TextAreaField, TextField } from '@/components/ui/fields'
import { CountrySelectField } from '@/components/ui/CountrySelect'
import { Alert, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Gender } from '@/types/api'
import { ConsultSuccess } from './ConsultSuccess'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { warnFormErrors } from '@/lib/formErrors'
import { isEn, loc, tx } from '@/lib/i18n'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<
  Record<
    'categoryId' | 'fullName' | 'email' | 'phone' | 'whatsApp' | 'age' | 'gender' | 'topic' | 'agree',
    string
  >
>

/** The original consultation page (the header link points here). */
export function ConsultationPage() {
  usePageTitle(tx('الاستشارات', 'Consultations'))
  const t = useCopy()
  const { user } = useAuth()
  const categories = useQuery({
    queryKey: ['consultations', 'categories'],
    queryFn: consultationsApi.categories,
  })

  const [form, setForm] = useState({
    categoryId: '',
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: '',
    whatsApp: '',
    country: 'مصر',
    age: '',
    gender: (user?.gender ?? '') as Gender | '',
    topic: '',
    notes: '',
    agree: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = useMutation({
    mutationFn: () =>
      consultationsApi.submit({
        categoryId: form.categoryId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        whatsApp: (form.whatsApp || form.phone).trim(),
        country: form.country,
        age: Number(form.age),
        gender: form.gender || undefined,
        consultationTopic: form.topic.trim(),
        notes: form.notes.trim() || undefined,
      }),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const er: Errors = {}
    if (!form.categoryId) er.categoryId = tx('اختار نوع الاستشارة.', 'Choose the consultation type.')
    if (form.fullName.trim().length < 3) er.fullName = tx('اكتب اسمك.', 'Enter your name.')
    if (!EMAIL_RE.test(form.email.trim()))
      er.email = tx('البريد الإلكتروني مش صحيح.', "That email doesn't look right.")
    if (!isValidPhone(form.phone))
      er.phone = tx('اكتب رقم صحيح للدولة اللي اخترتها.', 'Enter a valid number for the selected country.')
    if (form.whatsApp && !isValidPhone(form.whatsApp))
      er.whatsApp = tx('رقم الواتساب مش صحيح.', "That WhatsApp number doesn't look right.")
    if (!(Number(form.age) >= 1 && Number(form.age) <= 120)) er.age = tx('اكتب السن.', 'Enter the age.')
    if (!form.gender) er.gender = tx('اختار النوع.', 'Choose the gender.')
    if (form.topic.trim().length < 3)
      er.topic = tx('اكتب موضوع الاستشارة.', 'Describe the consultation topic.')
    if (!form.agree) er.agree = tx('لازم توافق على الشروط.', 'You need to accept the terms.')
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length === 0) submit.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[
          { label: tx('الرئيسية', 'Home'), to: routes.home },
          { label: tx('الاستشارات', 'Consultations') },
        ]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            {tx('جلسات أونلاين من أي مكان', 'Online sessions from anywhere')}
          </>
        }
        title={
          <>
            {isEn ? 'Book your consultation' : `${t('cta.book').split(' ')[0]} استشارتك`}{' '}
            <span className="text-sheen">{tx('مع د. صالح', 'with Dr. Saleh')}</span>
          </>
        }
        body={tx(
          'املأ بياناتك وفريقنا هيتواصل معاك في أقرب وقت لتحديد ميعاد الاستشارة المناسب ليك. بياناتك بتتحفظ بسرية تامة.',
          'Fill in your details and our team will contact you shortly to set a suitable time. Your details are kept strictly confidential.',
        )}
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_1.35fr] items-start gap-7 max-lg:grid-cols-1')}>
          <div className="flex flex-col gap-4 max-lg:order-last">
            <div className="flex flex-col gap-3 rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
              <b className="font-head text-xl text-ink">{tx('إزاي بتتم الاستشارة؟', 'How does it work?')}</b>
              {[
                tx('تملأ النموذج في دقيقتين', 'Fill in the form in two minutes'),
                tx('نكلمك على واتساب لتأكيد الميعاد', 'We message you on WhatsApp to confirm the time'),
                tx('جلسة خاصة مع د. صالح', 'A private session with Dr. Saleh'),
              ].map((s, i) => (
                <div
                  key={s}
                  className="flex items-center gap-3 rounded-tile bg-surface px-4 py-3.5 font-semibold text-ink"
                >
                  <span className="flex size-9 flex-none bg-gold items-center justify-center rounded-full font-extrabold text-navy">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
            <p className="flex items-start gap-3 rounded-card border border-line bg-white p-5 text-sm leading-relaxed text-muted">
              <Icon name="lock" size={18} className="mt-0.5 flex-none text-blue-600" />
              {tx(
                'جميع بياناتك بتتحفظ بسرية تامة، وبنستخدمها بس للتواصل معاك بخصوص الحجز.',
                'All your details are kept confidential and used only to contact you about the booking.',
              )}
            </p>
            <Link
              to={routes.consultRequest}
              className="flex items-center justify-between rounded-card border border-line bg-white p-5 font-bold"
            >
              {tx(
                'عندك ولاد ومحتاج تحكي الموقف بالتفصيل؟ استخدم الفورم المفصّل',
                'Have children and need to describe the situation in detail? Use the detailed form',
              )}
              <Icon name="arrowLeft" size={18} />
            </Link>
          </div>

          <div className="rounded-card bg-white p-7 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-5">
            {submit.isSuccess ? (
              <ConsultSuccess name={form.fullName.split(' ')[0]} />
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <ChoiceChips
                  label={tx('نوع الاستشارة', 'Consultation type')}
                  value={form.categoryId}
                  onChange={(v) => set('categoryId', v)}
                  options={(categories.data ?? []).map((c) => ({
                    value: c.id,
                    label: c.name ?? loc(c.nameAr, c.nameEn),
                  }))}
                  error={errors.categoryId}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label={tx('الاسم بالكامل', 'Full name')}
                    placeholder={tx('مثال: أحمد محمد', 'e.g. Ahmed Mohamed')}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    error={errors.fullName}
                  />
                  <TextField
                    label={tx('البريد الإلكتروني', 'Email')}
                    type="email"
                    ltr
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                  />
                  <PhoneField
                    label={tx('رقم الهاتف', 'Phone number')}
                    value={form.phone}
                    onChange={(v) => set('phone', v)}
                    error={errors.phone}
                  />
                  <PhoneField
                    label={tx('رقم الواتساب', 'WhatsApp number')}
                    value={form.whatsApp}
                    onChange={(v) => set('whatsApp', v)}
                    error={errors.whatsApp}
                    hint={tx('لو مختلف عن رقم الهاتف', 'If different from the phone number')}
                  />
                </div>
                <div className="grid grid-cols-[1.3fr_0.7fr_1fr] gap-4 max-sm:grid-cols-2">
                  <CountrySelectField
                    label={tx('الدولة', 'Country')}
                    value={form.country}
                    onChange={(v) => set('country', v)}
                    className="max-sm:col-span-2"
                  />
                  <TextField
                    label={tx('السن', 'Age')}
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="35"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value.replace(/\D/g, ''))}
                    error={errors.age}
                  />
                  <ChoiceChips
                    label={tx('النوع', 'Gender')}
                    value={form.gender}
                    onChange={(v) => set('gender', v)}
                    options={[
                      { value: 'Male' as const, label: tx('ذكر', 'Male') },
                      { value: 'Female' as const, label: tx('أنثى', 'Female') },
                    ]}
                    error={errors.gender}
                  />
                </div>
                <TextField
                  label={tx('موضوع الاستشارة', 'Consultation topic')}
                  placeholder={tx(
                    'مثال: عناد ابني (6 سنين) وقت المذاكرة',
                    "e.g. my son's (6) stubbornness at study time",
                  )}
                  value={form.topic}
                  onChange={(e) => set('topic', e.target.value)}
                  error={errors.topic}
                />
                <TextAreaField
                  label={tx('تفاصيل إضافية', 'More details')}
                  labelAside={<span className="text-muted">{tx('(اختياري)', '(optional)')}</span>}
                  placeholder={tx('احكيلنا باختصار عن الموقف...', 'Tell us briefly about the situation...')}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  maxLength={2000}
                />
                <CheckField
                  checked={form.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                  label={
                    <>
                      {tx('أوافق على', 'I agree to the')}{' '}
                      <Link to={routes.terms}>{tx('شروط الاستخدام', 'terms of use')}</Link> {tx('و', 'and')}{' '}
                      <Link to={routes.privacy}>{tx('سياسة الخصوصية', 'privacy policy')}</Link>.
                    </>
                  }
                />
                {errors.agree && <span className="-mt-3 text-sm text-danger">{errors.agree}</span>}
                {submit.isError && <Alert tone="error">{(submit.error as Error).message}</Alert>}
                <button
                  type="submit"
                  className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? (
                    <Spinner label={tx('جاري الإرسال', 'Sending')} />
                  ) : (
                    tx('إرسال طلب الاستشارة', 'Send consultation request')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div
          className={cn(
            innerClass,
            'flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-white px-7 py-5',
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-blue text-blue-600">
              <Icon name="message" />
            </span>
            <span className="flex flex-col">
              <b className="text-ink">{tx('سؤالك مش عن استشارة؟', 'Not about a consultation?')}</b>
              <span className="text-sm text-muted">
                {tx(
                  'لو عندك استفسار عن دورة أو طلب أو دفع، كلّمنا من صفحة التواصل.',
                  'For questions about a course, an order or payment, reach us on the contact page.',
                )}
              </span>
            </span>
          </span>
          <Link to={routes.contact} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            {tx('تواصل معنا', 'Contact us')} <Icon name="arrowLeft" size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
