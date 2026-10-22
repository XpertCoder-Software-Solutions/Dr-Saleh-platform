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
import { tx } from '@/lib/i18n'

const CREDENTIALS: { icon: IconName; text: string }[] = [
  { icon: 'user', text: tx('المستشار النفسي والتربوي', 'Psychological & parenting consultant') },
  {
    icon: 'home',
    text: tx(
      'رئيس مركز السعادة للاستشارات النفسية والتربوية',
      'Head of Al-Saada Center for Psychological & Parenting Consultations',
    ),
  },
  {
    icon: 'video',
    text: tx('مقدّم برنامج «فن التربية» على قناة الرحمة', 'Host of “The Art of Parenting” on Al-Rahma TV'),
  },
  { icon: 'book', text: tx('مؤلف كتاب «فن تربية الأبناء»', 'Author of “The Art of Parenting”') },
]

// Topics from his «فن التربية» episodes on Al-Rahma TV.
const TOPICS = [
  tx('التربية بالثواب والعقاب', 'Parenting with rewards and consequences'),
  tx('علاج الكذب عند الأبناء', 'Dealing with lying in children'),
  tx('فرط الحركة', 'Hyperactivity'),
  tx('العناد', 'Stubbornness'),
  tx('خناقات الإخوات', 'Sibling fights'),
  tx('ضعف الشخصية والثقة بالنفس', 'Low self-esteem and confidence'),
  tx('الحوار والاستماع للأبناء', 'Talking and listening to children'),
  tx('الفجوة بين الأجيال', 'The generation gap'),
  tx('أخطاء شائعة في التربية', 'Common parenting mistakes'),
  tx('السعادة الزوجية', 'A happy marriage'),
]

const IDEAS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'heart',
    title: tx('الحب غير المشروط', 'Unconditional love'),
    body: tx(
      'الطفل يحس إنه محبوب عشان هو، مش عشان درجاته أو سلوكه.',
      'Children feel loved for who they are, not for their grades or behavior.',
    ),
  },
  {
    icon: 'chat',
    title: tx('الحوار قبل العقاب', 'Talk before punishment'),
    body: tx('نفهم السبب الأول، وبعدين نتصرف.', 'First understand why, then act.'),
  },
  {
    icon: 'shield',
    title: tx('حدود من غير عنف', 'Boundaries without violence'),
    body: tx(
      'قواعد واضحة وثابتة، بتتطبق بهدوء واحترام.',
      'Clear, consistent rules applied calmly and respectfully.',
    ),
  },
  {
    icon: 'sparkle',
    title: tx('خطوات عملية', 'Practical steps'),
    body: tx('كل فكرة معاها تطبيق تقدر تعمله النهارده.', 'Every idea comes with something you can do today.'),
  },
]

export function AboutPage() {
  usePageTitle(tx('عن د. صالح', 'About Dr. Saleh'))
  const t = useCopy()
  return (
    <>
      <PageHero
        crumbs={[
          { label: tx('الرئيسية', 'Home'), to: routes.home },
          { label: tx('عن د. صالح', 'About Dr. Saleh') },
        ]}
        eyebrow={
          <>
            <span className="size-2 animate-pulse-ring rounded-full bg-gold-light" />
            {tx('المستشار النفسي والتربوي', 'Psychological & parenting consultant')}
          </>
        }
        title={
          <>
            {tx('الدكتور', 'Dr.')}{' '}
            <span className="text-sheen">{tx('صالح عبد الكريم', 'Saleh Abdelkarim')}</span>
          </>
        }
        body={tx(
          'المستشار النفسي والتربوي، ومؤلف كتاب «فن تربية الأبناء». بيساعد الأهالي يربّوا أولاد أسوياء وواثقين في نفسهم، بأسلوب بسيط تقدر تطبقه في البيت.',
          'Psychological and parenting consultant, and author of “The Art of Parenting”. He helps parents raise balanced, self-confident children, in a simple way you can apply at home.',
        )}
      />

      <section className={cn(sectionClass, 'pt-12')}>
        <div className={cn(innerClass, 'grid grid-cols-[1.2fr_1fr] items-center gap-12 max-lg:grid-cols-1')}>
          <div className="flex flex-col gap-5">
            <span className={eyebrowClass}>
              <Icon name="quote" size={16} />
              {tx('الحكاية', 'The story')}
            </span>
            <h2 className="text-[clamp(26px,3.4vw,38px)] leading-snug">
              {tx(
                '«مش مطلوب إن ابنك يكون مثالي… المطلوب إنه يكون',
                '“Your child doesn’t need to be perfect… they need to be',
              )}{' '}
              <span className="uline text-ink-grad">
                {tx('سوي، واثق في نفسه', 'balanced and self-confident')}
              </span>
              {tx('، وقادر يتكيّف مع الدنيا.»', ', and able to adapt to the world.”')}
            </h2>
            <p className="text-[17px] leading-[1.9] text-text-2">
              {tx(
                'من سنين والدكتور صالح عبد الكريم بيدخل بيوت الأسر العربية من خلال برنامج «فن التربية» على قناة الرحمة، اللي بيرد فيه على أسئلة الأهالي عن مشاكل ولادهم اليومية: الكذب، والعناد، وفرط الحركة، وخناقات الإخوات، والثواب والعقاب.',
                'For years, Dr. Saleh Abdelkarim has been a guest in Arab homes through “The Art of Parenting” on Al-Rahma TV, answering parents’ questions about everyday challenges: lying, stubbornness, hyperactivity, sibling fights, rewards and consequences.',
              )}
            </p>
            <p className="text-[17px] leading-[1.9] text-text-2">
              {tx(
                'كمستشار نفسي وتربوي ورئيس مركز السعادة للاستشارات النفسية والتربوية، أسلوبه بيبدأ بالفهم والحوار، وبيقدّم لكل مشكلة خطوات عملية بسيطة تقدر تطبقها في البيت من غير مصطلحات معقدة.',
                'As a psychological and parenting consultant and head of Al-Saada Center, his approach starts with understanding and conversation, offering simple, practical steps for every problem that you can apply at home, without jargon.',
              )}
            </p>
            <p className="text-[17px] leading-[1.9] text-text-2">
              {tx(
                'المنصة دي بتجمع خبرته في مكان واحد: دورات مسجّلة تتفرج عليها في الوقت اللي يناسبك، وكتب، ومقالات، واستشارات خاصة لو محتاج حد يسمعك ويرشدك في موقف معيّن.',
                'This platform brings his experience together in one place: recorded courses you can watch whenever it suits you, books, articles, and private consultations when you need someone to listen and guide you.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={routes.consultation} className={buttonClass({ variant: 'gold' })}>
                <Icon name="chat" size={18} /> {t('cta.bookDoctor')}
              </Link>
              <Link to={routes.courses} className={buttonClass({ variant: 'outline' })}>
                <Icon name="video" size={18} /> {tx('شوف الدورات', 'See the courses')}
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
            eyebrow={tx('طريقته في التربية', 'His approach')}
            icon="sparkle"
            title={tx('أربع أفكار بيرجع لها دايمًا', 'Four ideas he always comes back to')}
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
          <SectionHeader
            center
            eyebrow={tx('فن التربية', 'The Art of Parenting')}
            icon="video"
            title={tx('مواضيع بيتكلم فيها', 'Topics he talks about')}
          />
          <p className="-mt-4 mb-7 text-center text-muted">
            {tx(
              'من حلقات برنامج «فن التربية» على قناة الرحمة، وكتير منها موجود على قناته على يوتيوب.',
              'From episodes of “The Art of Parenting” on Al-Rahma TV — many are on his YouTube channel.',
            )}
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
          <SectionHeader
            center
            eyebrow={tx('ظهر على', 'As seen on')}
            icon="video"
            title={tx('ضيف على شاشات وإذاعات عربية', 'A guest on Arab TV and radio')}
          />
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

      <CTABand
        title={tx('عندك سؤال عن ابنك؟', 'Have a question about your child?')}
        body={tx(
          'احجز استشارة خاصة مع الدكتور صالح، أونلاين من أي مكان.',
          'Book a private online consultation with Dr. Saleh, from anywhere.',
        )}
      />
    </>
  )
}
