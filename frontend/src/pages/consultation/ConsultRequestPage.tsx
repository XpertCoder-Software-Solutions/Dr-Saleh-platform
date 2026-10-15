import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { consultationsApi } from '@/api/endpoints'
import { useAuth } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { CheckField, ChoiceChips, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, Spinner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { ConsultSuccess } from './ConsultSuccess'
import { PhoneField } from '@/components/ui/PhoneField'
import { isValidPhone } from '@/lib/phone'
import { warnFormErrors } from '@/lib/formErrors'

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
const SESSION_TYPES = [
  { value: 'video', label: 'مكالمة فيديو' },
  { value: 'voice', label: 'مكالمة صوتية' },
  { value: 'any', label: 'مش فارقة' },
]
const TIMES = [
  { value: 'morning', label: 'الصبح' },
  { value: 'afternoon', label: 'بعد الضهر' },
  { value: 'evening', label: 'بالليل' },
]

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'mail', title: 'ابعت الطلب', body: 'املأ الفورم في دقيقتين.' },
  { icon: 'whatsapp', title: 'هنكلمك', body: 'فريقنا بيتواصل معاك على واتساب خلال 24 ساعة.' },
  { icon: 'calendar', title: 'نحدد الميعاد', body: 'بنتفق على الوقت المناسب وطريقة الدفع.' },
  { icon: 'video', title: 'الجلسة', body: 'أونلاين مع د. صالح بالفيديو أو صوت.' },
]

type Errors = Partial<
  Record<'fullName' | 'whatsApp' | 'email' | 'categoryId' | 'situation' | 'agree', string>
>

/** The newer detailed request form; submissions land in the admin's consultation requests. */
export function ConsultRequestPage() {
  usePageTitle('طلب استشارة')
  const { user } = useAuth()
  const categories = useQuery({
    queryKey: ['consultations', 'categories'],
    queryFn: consultationsApi.categories,
  })
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    whatsApp: '',
    email: user?.email ?? '',
    city: 'مصر',
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
        country: form.city.trim() || 'غير محدد',
        gender: user?.gender ?? undefined,
        consultationTopic: category?.name ?? category?.nameAr ?? 'استشارة',
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
    if (form.fullName.trim().length < 3) er.fullName = 'اكتب اسمك.'
    if (!isValidPhone(form.whatsApp)) er.whatsApp = 'اكتب رقم واتساب صحيح.'
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'محتاجين الإيميل عشان نبعتلك تأكيد الطلب.'
    if (!form.categoryId) er.categoryId = 'اختار نوع الاستشارة.'
    if (form.situation.trim().length < 10) er.situation = 'احكيلنا عن الموقف في سطرين على الأقل.'
    if (!form.agree) er.agree = 'محتاجين موافقتك عشان نكلمك على واتساب.'
    setErrors(er)
    warnFormErrors(er)
    if (Object.keys(er).length === 0) submit.mutate()
  }

  return (
    <>
      <PageHero
        crumbs={[
          { label: 'الرئيسية', to: routes.home },
          { label: 'الاستشارات', to: routes.consultation },
          { label: 'طلب استشارة' },
        ]}
        title={
          <>
            اطلب <span className="text-sheen">استشارتك</span>
          </>
        }
        body="املأ الفورم وفريقنا هيكلمك على واتساب خلال 24 ساعة عشان نحدد معاك الميعاد المناسب. بياناتك سرية ومحدش بيشوفها غير الدكتور."
      />

      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={cn(innerClass, 'grid grid-cols-[300px_1fr] items-start gap-7 max-lg:grid-cols-1')}>
          <aside className="flex flex-col gap-4 max-lg:order-last">
            <div className="flex bg-navy flex-col gap-4 rounded-card p-6 text-white">
              <b className="font-head text-xl">الاستشارة بتمشي إزاي؟</b>
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
                ['shield', 'كل اللي بتكتبه سري تمامًا'],
                ['clock', 'الجلسة من 45 لـ 60 دقيقة'],
                ['globe', 'من أي مكان في العالم'],
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
                  <h2 className="text-2xl">بياناتك</h2>
                  <p className="text-sm text-muted">الحقول اللي عليها * مطلوبة</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <TextField
                    label="الاسم *"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    error={errors.fullName}
                  />
                  <PhoneField
                    label="رقم الواتساب *"
                    value={form.whatsApp}
                    onChange={(v) => set('whatsApp', v)}
                    error={errors.whatsApp}
                  />
                  <TextField
                    label="الإيميل *"
                    type="email"
                    ltr
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                    hint="بنبعتلك عليه تأكيد الطلب"
                  />
                  <TextField
                    label="البلد / المدينة"
                    placeholder="مصر، القاهرة"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>

                <hr className="border-divider" />
                <h2 className="text-2xl">عن الاستشارة</h2>
                <ChoiceChips
                  label="نوع الاستشارة *"
                  value={form.categoryId}
                  onChange={(v) => set('categoryId', v)}
                  options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name ?? c.nameAr }))}
                  error={errors.categoryId}
                />
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <SelectField
                    label="سن الطفل"
                    placeholder="اختار"
                    value={form.childAge}
                    onChange={(e) => set('childAge', e.target.value)}
                    options={CHILD_AGES.map((a) => ({ value: a, label: a }))}
                  />
                  <SelectField
                    label="علاقتك بالطفل"
                    placeholder="اختار"
                    value={form.relation}
                    onChange={(e) => set('relation', e.target.value)}
                    options={RELATIONS.map((a) => ({ value: a, label: a }))}
                  />
                </div>
                <ChoiceChips
                  label="تحب الجلسة تكون"
                  hint="بنحددها مع بعض في المكالمة"
                  value={form.sessionType}
                  onChange={(v) => set('sessionType', v)}
                  options={SESSION_TYPES}
                />
                <ChoiceChips
                  label="أنسب وقت نكلمك فيه"
                  value={form.preferredTime}
                  onChange={(v) => set('preferredTime', v)}
                  options={TIMES}
                />
                <TextAreaField
                  label="احكيلنا باختصار عن الموقف *"
                  rows={5}
                  placeholder="مثال: ابني عنده 8 سنين وبقى عنيد جدًا الفترة الأخيرة، خصوصًا وقت المذاكرة..."
                  value={form.situation}
                  onChange={(e) => set('situation', e.target.value)}
                  error={errors.situation}
                  hint="مش لازم تفاصيل كتير، الدكتور هيسألك في الجلسة."
                  maxLength={2000}
                />
                <CheckField
                  checked={form.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                  label="موافق إن فريق المنصة يتواصل معايا على واتساب"
                />
                {errors.agree && <span className="-mt-3 text-sm text-danger">{errors.agree}</span>}
                {submit.isError && <Alert tone="error">{(submit.error as Error).message}</Alert>}
                <button
                  type="submit"
                  className={buttonClass({ variant: 'gold', size: 'lg', block: true })}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? (
                    <Spinner label="جاري الإرسال" />
                  ) : (
                    <>
                      ابعت الطلب <Icon name="mail" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted">
                  مفيش دفع دلوقتي. الدفع بيكون بعد ما نتفق على الميعاد.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
