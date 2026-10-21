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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<
  Record<
    'categoryId' | 'fullName' | 'email' | 'phone' | 'whatsApp' | 'age' | 'gender' | 'topic' | 'agree',
    string
  >
>

/** The original consultation page (the header link points here). */
export function ConsultationPage() {
  usePageTitle('الاستشارات')
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
    if (!form.categoryId) er.categoryId = 'اختار نوع الاستشارة.'
    if (form.fullName.trim().length < 3) er.fullName = 'اكتب اسمك.'
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'البريد الإلكتروني مش صحيح.'
    if (!isValidPhone(form.phone)) er.phone = 'اكتب رقم صحيح للدولة اللي اخترتها.'
    if (form.whatsApp && !isValidPhone(form.whatsApp)) er.whatsApp = 'رقم الواتساب مش صحيح.'
    if (!(Number(form.age) >= 1 && Number(form.age) <= 120)) er.age = 'اكتب السن.'
    if (!form.gender) er.gender = 'اختار النوع.'
    if (form.topic.trim().length < 3) er.topic = 'اكتب موضوع الاستشارة.'
    if (!form.agree) er.agree = 'لازم توافق على الشروط.'
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length === 0) submit.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'الاستشارات' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            جلسات أونلاين من أي مكان
          </>
        }
        title={
          <>
            {t('cta.book').split(' ')[0]} استشارتك <span className="text-sheen">مع د. صالح</span>
          </>
        }
        body="املأ بياناتك وفريقنا هيتواصل معاك في أقرب وقت لتحديد ميعاد الاستشارة المناسب ليك. بياناتك بتتحفظ بسرية تامة."
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={cn(innerClass, 'grid grid-cols-[1fr_1.35fr] items-start gap-7 max-lg:grid-cols-1')}>
          <div className="flex flex-col gap-4 max-lg:order-last">
            <div className="flex flex-col gap-3 rounded-card bg-white p-6 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)]">
              <b className="font-head text-xl text-ink">إزاي بتتم الاستشارة؟</b>
              {['تملأ النموذج في دقيقتين', 'نكلمك على واتساب لتأكيد الميعاد', 'جلسة خاصة مع د. صالح'].map(
                (s, i) => (
                  <div
                    key={s}
                    className="flex items-center gap-3 rounded-tile bg-surface px-4 py-3.5 font-semibold text-ink"
                  >
                    <span className="flex size-9 flex-none bg-gold items-center justify-center rounded-full font-extrabold text-navy">
                      {i + 1}
                    </span>
                    {s}
                  </div>
                ),
              )}
            </div>
            <p className="flex items-start gap-3 rounded-card border border-line bg-white p-5 text-sm leading-relaxed text-muted">
              <Icon name="lock" size={18} className="mt-0.5 flex-none text-blue-600" />
              جميع بياناتك بتتحفظ بسرية تامة، وبنستخدمها بس للتواصل معاك بخصوص الحجز.
            </p>
            <Link
              to={routes.consultRequest}
              className="flex items-center justify-between rounded-card border border-line bg-white p-5 font-bold"
            >
              عندك ولاد ومحتاج تحكي الموقف بالتفصيل؟ استخدم الفورم المفصّل
              <Icon name="arrowLeft" size={18} />
            </Link>
          </div>

          <div className="rounded-card bg-white p-7 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-5">
            {submit.isSuccess ? (
              <ConsultSuccess name={form.fullName.split(' ')[0]} />
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <ChoiceChips
                  label="نوع الاستشارة"
                  value={form.categoryId}
                  onChange={(v) => set('categoryId', v)}
                  options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name ?? c.nameAr }))}
                  error={errors.categoryId}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label="الاسم بالكامل"
                    placeholder="مثال: أحمد محمد"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    error={errors.fullName}
                  />
                  <TextField
                    label="البريد الإلكتروني"
                    type="email"
                    ltr
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                  />
                  <PhoneField
                    label="رقم الهاتف"
                    value={form.phone}
                    onChange={(v) => set('phone', v)}
                    error={errors.phone}
                  />
                  <PhoneField
                    label="رقم الواتساب"
                    value={form.whatsApp}
                    onChange={(v) => set('whatsApp', v)}
                    error={errors.whatsApp}
                    hint="لو مختلف عن رقم الهاتف"
                  />
                </div>
                <div className="grid grid-cols-[1.3fr_0.7fr_1fr] gap-4 max-sm:grid-cols-2">
                  <CountrySelectField
                    label="الدولة"
                    value={form.country}
                    onChange={(v) => set('country', v)}
                    className="max-sm:col-span-2"
                  />
                  <TextField
                    label="السن"
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="35"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value.replace(/\D/g, ''))}
                    error={errors.age}
                  />
                  <ChoiceChips
                    label="النوع"
                    value={form.gender}
                    onChange={(v) => set('gender', v)}
                    options={[
                      { value: 'Male' as const, label: 'ذكر' },
                      { value: 'Female' as const, label: 'أنثى' },
                    ]}
                    error={errors.gender}
                  />
                </div>
                <TextField
                  label="موضوع الاستشارة"
                  placeholder="مثال: عناد ابني (6 سنين) وقت المذاكرة"
                  value={form.topic}
                  onChange={(e) => set('topic', e.target.value)}
                  error={errors.topic}
                />
                <TextAreaField
                  label="تفاصيل إضافية"
                  labelAside={<span className="text-muted">(اختياري)</span>}
                  placeholder="احكيلنا باختصار عن الموقف..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  maxLength={2000}
                />
                <CheckField
                  checked={form.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                  label={
                    <>
                      أوافق على <Link to={routes.terms}>شروط الاستخدام</Link> و
                      <Link to={routes.privacy}>سياسة الخصوصية</Link>.
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
                  {submit.isPending ? <Spinner label="جاري الإرسال" /> : 'إرسال طلب الاستشارة'}
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
              <b className="text-ink">سؤالك مش عن استشارة؟</b>
              <span className="text-sm text-muted">
                لو عندك استفسار عن دورة أو طلب أو دفع، كلّمنا من صفحة التواصل.
              </span>
            </span>
          </span>
          <Link to={routes.contact} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            تواصل معنا <Icon name="arrowLeft" size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
