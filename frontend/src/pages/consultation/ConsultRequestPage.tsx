import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { consultationsApi } from '@/api/endpoints'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { CheckField, ChoiceChips, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { CountrySelectField } from '@/components/ui/CountrySelect'
import { Alert, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { ConsultSuccess } from './ConsultSuccess'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { warnFormErrors } from '@/lib/formErrors'
import { isEn, loc, tx } from '@/lib/i18n'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CHILD_AGES = [
  'أقل من 3 سنين',
  'من 3 لـ 6 سنين',
  'من 7 لـ 10 سنين',
  'من 11 لـ 14 سنة',
  'من 15 لـ 18 سنة',
  'أكبر من 18',
]
const RELATIONS = ['أم', 'أب', 'جد / جدة', 'مربي / مدرّس', 'أخرى']
// Values are saved in Arabic; these are the English labels.
const EN_LABEL: Record<string, string> = {
  'أقل من 3 سنين': 'Under 3',
  'من 3 لـ 6 سنين': '3 to 6',
  'من 7 لـ 10 سنين': '7 to 10',
  'من 11 لـ 14 سنة': '11 to 14',
  'من 15 لـ 18 سنة': '15 to 18',
  'أكبر من 18': 'Over 18',
  أم: 'Mother',
  أب: 'Father',
  'جد / جدة': 'Grandparent',
  'مربي / مدرّس': 'Caregiver / teacher',
  أخرى: 'Other',
}
const optionLabel = (a: string) => (isEn ? (EN_LABEL[a] ?? a) : a)
const SESSION_TYPES = [
  { value: 'video', label: tx('مكالمة فيديو', 'Video call') },
  { value: 'voice', label: tx('مكالمة صوتية', 'Voice call') },
  { value: 'any', label: tx('مش فارقة', "Doesn't matter") },
]
const TIMES = [
  { value: 'morning', label: tx('الصبح', 'Morning') },
  { value: 'afternoon', label: tx('بعد الضهر', 'Afternoon') },
  { value: 'evening', label: tx('بالليل', 'Evening') },
]

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'mail',
    title: tx('ابعت الطلب', 'Send the request'),
    body: tx('املأ الفورم في دقيقتين.', 'Fill in the form in two minutes.'),
  },
  {
    icon: 'whatsapp',
    title: tx('هنكلمك', "We'll contact you"),
    body: tx(
      'فريقنا بيتواصل معاك على واتساب خلال 24 ساعة.',
      'Our team contacts you on WhatsApp within 24 hours.',
    ),
  },
  {
    icon: 'calendar',
    title: tx('نحدد الميعاد', 'We set the time'),
    body: tx('بنتفق على الوقت المناسب وطريقة الدفع.', 'We agree on a suitable time and payment method.'),
  },
  {
    icon: 'video',
    title: tx('الجلسة', 'The session'),
    body: tx('أونلاين مع د. صالح بالفيديو أو صوت.', 'Online with Dr. Saleh, by video or voice.'),
  },
]

type Errors = Partial<
  Record<'fullName' | 'whatsApp' | 'email' | 'categoryId' | 'situation' | 'agree', string>
>

/** The newer detailed request form; submissions land in the admin's consultation requests. */
export function ConsultRequestPage() {
  usePageTitle(tx('طلب استشارة', 'Request a consultation'))
  const { user } = useAuth()
  const categories = useQuery({
    queryKey: ['consultations', 'categories'],
    queryFn: consultationsApi.categories,
  })
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    whatsApp: '',
    email: user?.email ?? '',
    country: 'مصر',
    city: '',
    categoryId: '',
    childAge: '',
    relation: '',
    sessionType: 'video',
    preferredTime: '',
    situation: '',
    agree: true,
  })
  const [errors, setErrors] = useState<Errors>({})
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = useMutation({
    mutationFn: () => {
      const category = categories.data?.find((c) => c.id === form.categoryId)
      return consultationsApi.submit({
        categoryId: form.categoryId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.whatsApp.trim(),
        whatsApp: form.whatsApp.trim(),
        country: [form.country, form.city.trim()].filter(Boolean).join('، ') || 'غير محدد',
        gender: user?.gender ?? undefined,
        consultationTopic: category?.name ?? loc(category?.nameAr, category?.nameEn) ?? 'استشارة',
        notes: form.situation.trim(),
        childAge: form.childAge || undefined,
        relation: form.relation || undefined,
        sessionType: form.sessionType || undefined,
        preferredTime: form.preferredTime || undefined,
      })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const er: Errors = {}
    if (form.fullName.trim().length < 3) er.fullName = tx('اكتب اسمك.', 'Enter your name.')
    if (!isValidPhone(form.whatsApp))
      er.whatsApp = tx('اكتب رقم واتساب صحيح.', 'Enter a valid WhatsApp number.')
    if (!EMAIL_RE.test(form.email.trim()))
      er.email = tx(
        'محتاجين الإيميل عشان نبعتلك تأكيد الطلب.',
        'We need your email to send you a confirmation.',
      )
    if (!form.categoryId) er.categoryId = tx('اختار نوع الاستشارة.', 'Choose the consultation type.')
    if (form.situation.trim().length < 10)
      er.situation = tx(
        'احكيلنا عن الموقف في سطرين على الأقل.',
        'Describe the situation in at least two lines.',
      )
    if (!form.agree)
      er.agree = tx(
        'محتاجين موافقتك عشان نكلمك على واتساب.',
        'We need your consent to contact you on WhatsApp.',
      )
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length === 0) submit.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[
          { label: tx('الرئيسية', 'Home'), to: routes.home },
          { label: tx('الاستشارات', 'Consultations'), to: routes.consultation },
          { label: tx('طلب استشارة', 'Request a consultation') },
        ]}
        title={
          <>
            {tx('اطلب', 'Request')} <span className="text-sheen">{tx('استشارتك', 'your consultation')}</span>
          </>
        }
        body={tx(
          'املأ الفورم وفريقنا هيكلمك على واتساب خلال 24 ساعة عشان نحدد معاك الميعاد المناسب. بياناتك سرية ومحدش بيشوفها غير الدكتور.',
          'Fill in the form and our team will message you on WhatsApp within 24 hours to set a suitable time. Your details are confidential and only the doctor sees them.',
        )}
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={cn(innerClass, 'grid grid-cols-[300px_1fr] items-start gap-7 max-lg:grid-cols-1')}>
          <aside className="flex flex-col gap-4 max-lg:order-last">
            <div className="flex bg-navy flex-col gap-4 rounded-card p-6 text-white">
              <b className="font-head text-xl">
                {tx('الاستشارة بتمشي إزاي؟', 'How does the consultation work?')}
              </b>
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex gap-3">
                  <span className="flex size-10 flex-none bg-gold items-center justify-center rounded-xl text-navy">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <span className="flex flex-col">
                    <b>
                      {i + 1}. {s.title}
                    </b>
                    <span className="text-sm text-on-dark">{s.body}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 text-sm text-text-2">
              {[
                ['shield', tx('كل اللي بتكتبه سري تمامًا', 'Everything you write is fully confidential')],
                ['clock', tx('الجلسة من 45 لـ 60 دقيقة', 'Sessions last 45–60 minutes')],
                ['globe', tx('من أي مكان في العالم', 'From anywhere in the world')],
              ].map(([icon, text]) => (
                <span key={text} className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-surface-blue text-blue-600">
                    <Icon name={icon as IconName} size={17} />
                  </span>
                  {text}
                </span>
              ))}
            </div>
          </aside>

          <div className="rounded-card bg-white p-7 shadow-[0_30px_60px_-36px_rgba(12,42,74,.5)] max-sm:p-5">
            {submit.isSuccess ? (
              <ConsultSuccess name={form.fullName.split(' ')[0]} />
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <div>
                  <h2 className="text-2xl">{tx('بياناتك', 'Your details')}</h2>
                  <p className="text-sm text-muted">
                    {tx('الحقول اللي عليها * مطلوبة', 'Fields marked * are required')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label={tx('الاسم *', 'Name *')}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    error={errors.fullName}
                  />
                  <PhoneField
                    label={tx('رقم الواتساب *', 'WhatsApp number *')}
                    value={form.whatsApp}
                    onChange={(v) => set('whatsApp', v)}
                    error={errors.whatsApp}
                  />
                  <TextField
                    label={tx('الإيميل *', 'Email *')}
                    type="email"
                    ltr
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                    hint={tx('بنبعتلك عليه تأكيد الطلب', "We'll send the confirmation here")}
                  />
                  <CountrySelectField
                    label={tx('الدولة', 'Country')}
                    value={form.country}
                    onChange={(v) => set('country', v)}
                  />
                  <TextField
                    label={tx('المدينة', 'City')}
                    labelAside={<span className="text-muted">{tx('(اختياري)', '(optional)')}</span>}
                    placeholder={tx('مثال: القاهرة', 'e.g. Cairo')}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>

                <hr className="border-divider" />
                <h2 className="text-2xl">{tx('عن الاستشارة', 'About the consultation')}</h2>
                <ChoiceChips
                  label={tx('نوع الاستشارة *', 'Consultation type *')}
                  value={form.categoryId}
                  onChange={(v) => set('categoryId', v)}
                  options={(categories.data ?? []).map((c) => ({
                    value: c.id,
                    label: c.name ?? loc(c.nameAr, c.nameEn),
                  }))}
                  error={errors.categoryId}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <SelectField
                    label={tx('سن الطفل', "Child's age")}
                    placeholder={tx('اختار', 'Choose')}
                    value={form.childAge}
                    onChange={(e) => set('childAge', e.target.value)}
                    options={CHILD_AGES.map((a) => ({ value: a, label: optionLabel(a) }))}
                  />
                  <SelectField
                    label={tx('علاقتك بالطفل', 'Your relation to the child')}
                    placeholder={tx('اختار', 'Choose')}
                    value={form.relation}
                    onChange={(e) => set('relation', e.target.value)}
                    options={RELATIONS.map((a) => ({ value: a, label: optionLabel(a) }))}
                  />
                </div>
                <ChoiceChips
                  label={tx('تحب الجلسة تكون', 'Preferred session type')}
                  hint={tx('بنحددها مع بعض في المكالمة', "We'll confirm it together on the call")}
                  value={form.sessionType}
                  onChange={(v) => set('sessionType', v)}
                  options={SESSION_TYPES}
                />
                <ChoiceChips
                  label={tx('أنسب وقت نكلمك فيه', 'Best time to call you')}
                  value={form.preferredTime}
                  onChange={(v) => set('preferredTime', v)}
                  options={TIMES}
                />
                <TextAreaField
                  label={tx('احكيلنا باختصار عن الموقف *', 'Briefly describe the situation *')}
                  rows={5}
                  placeholder={tx(
                    'مثال: ابني عنده 8 سنين وبقى عنيد جدًا الفترة الأخيرة، خصوصًا وقت المذاكرة...',
                    'e.g. My son is 8 and has become very stubborn lately, especially at study time...',
                  )}
                  value={form.situation}
                  onChange={(e) => set('situation', e.target.value)}
                  error={errors.situation}
                  hint={tx(
                    'مش لازم تفاصيل كتير، الدكتور هيسألك في الجلسة.',
                    'No need for much detail; the doctor will ask you in the session.',
                  )}
                  maxLength={2000}
                />
                <CheckField
                  checked={form.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                  label={tx(
                    'موافق إن فريق المنصة يتواصل معايا على واتساب',
                    'I agree to be contacted by the platform team on WhatsApp',
                  )}
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
                    <>
                      {tx('ابعت الطلب', 'Send the request')} <Icon name="mail" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted">
                  {tx(
                    'مفيش دفع دلوقتي. الدفع بيكون بعد ما نتفق على الميعاد.',
                    'No payment now. You pay after we agree on the time.',
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
