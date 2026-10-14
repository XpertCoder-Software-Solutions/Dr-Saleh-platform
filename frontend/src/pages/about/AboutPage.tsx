import { Link } from 'react-router-dom'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { PageHero } from '@/components/layout/PageHero'
import { CTABand } from '@/components/layout/CTABand'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass, eyebrowClass, innerClass, sectionClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/usePageTitle'
import { CHANNELS } from '@/pages/home/channels'
import { SOCIAL } from '@/content/contact'

const CREDENTIALS: { icon: IconName; text: string }[] = [
  { icon: 'user', text: 'المستشار النفسي والتربوي' },
  { icon: 'home', text: 'رئيس مركز السعادة للاستشارات النفسية والتربوية' },
  { icon: 'video', text: 'مقدّم برنامج «فن التربية» على قناة الرحمة' },
  { icon: 'book', text: 'مؤلف كتاب «فن تربية الأبناء»' },
]

// Topics from his «فن التربية» episodes on Al-Rahma TV.
const TOPICS = [
  'التربية بالثواب والعقاب',
  'علاج الكذب عند الأبناء',
  'فرط الحركة',
  'العناد',
  'خناقات الإخوات',
  'ضعف الشخصية والثقة بالنفس',
  'الحوار والاستماع للأبناء',
  'الفجوة بين الأجيال',
  'أخطاء شائعة في التربية',
  'السعادة الزوجية',
]

const IDEAS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'heart', title: 'الحب غير المشروط', body: 'الطفل يحس إنه محبوب عشان هو، مش عشان درجاته أو سلوكه.' },
  { icon: 'chat', title: 'الحوار قبل العقاب', body: 'نفهم السبب الأول، وبعدين نتصرف.' },
  { icon: 'shield', title: 'حدود من غير عنف', body: 'قواعد واضحة وثابتة، بتتطبق بهدوء واحترام.' },
  { icon: 'sparkle', title: 'خطوات عملية', body: 'كل فكرة معاها تطبيق تقدر تعمله النهارده.' },
]

export function AboutPage() {
  usePageTitle('عن د. صالح')
  const t = useCopy()
  return (
    <>
      <PageHero
        crumbs={[{ label: 'الرئيسية', to: routes.home }, { label: 'عن د. صالح' }]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            المستشار النفسي والتربوي
          </>
        }
        title={
          <>
            الدكتور <span className="text-sheen">صالح عبد الكريم</span>
          </>
        }
        body="المستشار النفسي والتربوي، ومؤلف كتاب «فن تربية الأبناء». بيساعد الأهالي يربّوا أولاد أسوياء وواثقين في نفسهم، بأسلوب بسيط تقدر تطبقه في البيت."
      />

      <section className={cn(sectionClass, 'pt-12')}>
        <div className={cn(innerClass, 'grid grid-cols-[1.2fr_1fr] items-center gap-12 max-lg:grid-cols-1')}>
          <div className="flex flex-col gap-5">
            <span className={eyebrowClass}>
              <Icon name="quote" size={16} />
              الحكاية
            </span>
            <h2 className="text-[clamp(26px,3.4vw,38px)] leading-snug">
              «مش مطلوب إن ابنك يكون مثالي… المطلوب إنه يكون{' '}
              <span className="uline text-ink-grad">سوي، واثق في نفسه</span>، وقادر يتكيّف مع الدنيا.»
            </h2>
            <p className="text-[17px] leading-[1.9] text-text-2">
              من سنين والدكتور صالح عبد الكريم بيدخل بيوت الأسر العربية من خلال برنامج «فن التربية» على قناة
              الرحمة، اللي بيرد فيه على أسئلة الأهالي عن مشاكل ولادهم اليومية: الكذب، والعناد، وفرط الحركة،
              وخناقات الإخوات، والثواب والعقاب.
            </p>
            <p className="text-[17px] leading-[1.9] text-text-2">
              كمستشار نفسي وتربوي ورئيس مركز السعادة للاستشارات النفسية والتربوية، أسلوبه بيبدأ بالفهم
              والحوار، وبيقدّم لكل مشكلة خطوات عملية بسيطة تقدر تطبقها في البيت من غير مصطلحات معقدة.
            </p>
            <p className="text-[17px] leading-[1.9] text-text-2">
              المنصة دي بتجمع خبرته في مكان واحد: دورات مسجّلة تتفرج عليها في الوقت اللي يناسبك، وكتب،
              ومقالات، واستشارات خاصة لو محتاج حد يسمعك ويرشدك في موقف معيّن.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={routes.consultation} className={buttonClass({ variant: 'gold' })}>
                <Icon name="chat" size={18} /> {t('cta.bookDoctor')}
              </Link>
              <Link to={routes.courses} className={buttonClass({ variant: 'outline' })}>
                <Icon name="video" size={18} /> شوف الدورات
              </Link>
            </div>
          </div>
          <ul className="flex stagger flex-col gap-3">
            {CREDENTIALS.map((c) => (
              <li
                key={c.text}
                className="flex items-center gap-3.5 rounded-tile border border-line bg-white p-4 font-semibold text-ink"
              >
                <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
                  <Icon name={c.icon} />
                </span>
                {c.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={innerClass}>
          <SectionHeader
            center
            eyebrow="طريقته في التربية"
            icon="sparkle"
            title="أربع أفكار بيرجع لها دايمًا"
          />
          <div className="grid stagger grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {IDEAS.map((idea) => (
              <div
                key={idea.title}
                className="glow-card flex flex-col gap-3 rounded-card border border-line bg-white p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-[14px] bg-surface-blue text-blue-600">
                  <Icon name={idea.icon} />
                </span>
                <b className="font-head text-xl text-ink">{idea.title}</b>
                <p className="leading-relaxed text-muted">{idea.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={innerClass}>
          <SectionHeader center eyebrow="فن التربية" icon="video" title="مواضيع بيتكلم فيها" />
          <p className="-mt-4 mb-7 text-center text-muted">
            من حلقات برنامج «فن التربية» على قناة الرحمة، وكتير منها موجود على قناته على يوتيوب.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TOPICS.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-line bg-white px-4.5 py-2.5 font-semibold text-ink"
              >
                {topic}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className={buttonClass({ variant: 'outline', size: 'sm' })}
              >
                <Icon name={s.icon} size={16} /> {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={innerClass}>
          <SectionHeader center eyebrow="ظهر على" icon="video" title="ضيف على شاشات وإذاعات عربية" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {CHANNELS.map((c) => (
              <span
                key={c.src}
                className="flex h-22 items-center justify-center rounded-tile border border-line bg-white px-3"
              >
                <img src={c.src} alt={c.name} loading="lazy" className="max-h-14 w-auto" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <CTABand title="عندك سؤال عن ابنك؟" body="احجز استشارة خاصة مع الدكتور صالح، أونلاين من أي مكان." />
    </>
  )
}
