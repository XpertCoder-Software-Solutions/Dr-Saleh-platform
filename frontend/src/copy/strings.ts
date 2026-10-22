// Gender-aware copy. Each key has three versions and the UI picks one from the
// signed-in user's gender: guest (no account, or gender not set) reads neutral,
// male reads masculine, female reads feminine. See the CopyGender board.
// `{name}` is replaced with the user's first name; `*word*` marks the highlighted
// word in a section title (rendered by <Highlight>).

export type Audience = 'guest' | 'male' | 'female'

/** Arabic per audience, plus one English version. */
type Variants = Record<Audience, string> & { en: string }

export const strings = {
  'cta.start': {
    guest: 'يلا نبدأ',
    male: 'ابدأ رحلتك التعليمية',
    female: 'ابدئي رحلتك التعليمية',
    en: 'Get started',
  },
  'cta.startFree': {
    guest: 'ابدأ مجانًا',
    male: 'ابدأ مجانًا',
    female: 'ابدئي مجانًا',
    en: 'Start for free',
  },
  'cta.continue': {
    guest: 'استكمال الدرس',
    male: 'كمّل الدرس',
    female: 'كمّلي الدرس',
    en: 'Continue the lesson',
  },
  'cta.book': {
    guest: 'اطلب استشارة',
    male: 'احجز استشارتك',
    female: 'احجزي استشارتك',
    en: 'Request a consultation',
  },
  'cta.bookPrivate': {
    guest: 'اطلب استشارة خاصة',
    male: 'احجز استشارة خاصة',
    female: 'احجزي استشارة خاصة',
    en: 'Request a private consultation',
  },
  'cta.bookNow': {
    guest: 'اطلب استشارتك الآن',
    male: 'احجز استشارتك الآن',
    female: 'احجزي استشارتك الآن',
    en: 'Request your consultation',
  },
  'cta.bookDoctor': {
    guest: 'اطلب جلسة مع الدكتور',
    male: 'احجز جلسة مع الدكتور',
    female: 'احجزي جلسة مع الدكتور',
    en: 'Book a session with the doctor',
  },
  'cta.enroll': {
    guest: 'اشترك في الدورة',
    male: 'اشترك في الدورة',
    female: 'اشتركي في الدورة',
    en: 'Enroll in the course',
  },
  'cta.addToCart': { guest: 'أضف للسلة', male: 'أضف للسلة', female: 'أضيفي للسلة', en: 'Add to cart' },
  greet: {
    guest: 'أهلًا بيكم',
    male: 'أهلًا بيك يا {name}',
    female: 'أهلًا بيكي يا {name}',
    en: 'Welcome, {name}',
  },
  'dash.sub': {
    guest: 'رحلتكم كلها في مكان واحد',
    male: 'كمّل رحلتك وتابع دوراتك',
    female: 'كمّلي رحلتك وتابعي دوراتك',
    en: 'Continue your journey and follow your courses',
  },
  'cart.empty': {
    guest: 'السلة فاضية… يلا نختار أول دورة',
    male: 'سلتك فاضية، ابدأ بأول دورة',
    female: 'سلتك فاضية، ابدئي بأول دورة',
    en: 'Your cart is empty. Start with your first course',
  },
  'pw.confirm': {
    guest: 'تأكيد كلمة السر',
    male: 'اكتبها تاني',
    female: 'اكتبيها تاني',
    en: 'Confirm password',
  },
  'ref.cta': {
    guest: 'ادعوا صحابكم واكسبوا',
    male: 'ادعي صاحبك واكسب',
    female: 'ادعي صاحبتك واكسبي',
    en: 'Invite friends and earn',
  },
  'home.hero.body': {
    guest:
      'برامج تربوية عملية مع الدكتور صالح عبد الكريم بتساعدكم تبنوا شخصية أولادكم بثقة وهدوء، في كل مرحلة من عمرهم، وبأسلوب بسيط تقدروا تطبقوه من النهارده.',
    male: 'برامج تربوية عملية مع الدكتور صالح عبد الكريم تساعدك تبني شخصية ابنك بثقة وهدوء، في كل مرحلة من عمره، وبأسلوب بسيط تقدر تطبقه من النهارده.',
    female:
      'برامج تربوية عملية مع الدكتور صالح عبد الكريم تساعدك تبني شخصية ابنك بثقة وهدوء، في كل مرحلة من عمره، وبأسلوب بسيط تقدري تطبقيه من النهارده.',
    en: 'Practical parenting programs with Dr. Saleh Abdelkarim that help you build your child’s character with confidence and calm, at every age, in a simple way you can apply from today.',
  },
  'home.consult.title': {
    guest: 'في موقف مش عارفين تتصرفوا فيه مع أولادكم؟',
    male: 'في موقف مش عارف تتصرف فيه مع ابنك؟',
    female: 'في موقف مش عارفة تتصرفي فيه مع ابنك؟',
    en: 'Facing a situation with your child you don’t know how to handle?',
  },
  'home.consult.body': {
    guest:
      'احكولنا باختصار، وفريقنا هيتواصل معاكم لتحديد ميعاد مناسب مع الدكتور. بياناتكم بتتحفظ بسرية تامة.',
    male: 'احكيلنا باختصار، وفريقنا هيتواصل معاك لتحديد ميعاد مناسب مع الدكتور. بياناتك بتتحفظ بسرية تامة.',
    female:
      'احكيلنا باختصار، وفريقنا هيتواصل معاكي لتحديد ميعاد مناسب مع الدكتور. بياناتك بتتحفظ بسرية تامة.',
    en: 'Tell us briefly, and our team will contact you to set a suitable time with the doctor. Your details are kept strictly confidential.',
  },
  'home.consult.step1': {
    guest: 'اختاروا نوع الاستشارة واكتبوا الموضوع',
    male: 'اختار نوع الاستشارة واكتب الموضوع',
    female: 'اختاري نوع الاستشارة واكتبي الموضوع',
    en: 'Choose the consultation type and describe the topic',
  },
  'home.consult.step2': {
    guest: 'نتواصل معاكم على واتساب لتحديد الميعاد',
    male: 'نتواصل معاك على واتساب لتحديد الميعاد',
    female: 'نتواصل معاكي على واتساب لتحديد الميعاد',
    en: 'We contact you on WhatsApp to set the time',
  },
  'home.courses.title': {
    guest: 'دورات *تغيّر* طريقة التعامل مع الأولاد',
    male: 'دورات *تغيّر* طريقة تعاملك مع أولادك',
    female: 'دورات *تغيّر* طريقة تعاملك مع أولادك',
    en: 'Courses that *change* how you deal with your children',
  },
  'home.books.title': {
    guest: 'اقرأوا… أو *اسمعوا* في الطريق',
    male: 'اقرأ… أو *اسمع* وانت في الطريق',
    female: 'اقرئي… أو *اسمعي* وانتي في الطريق',
    en: 'Read… or *listen* on the go',
  },
  'courses.hero.body': {
    guest: 'دورات مسجّلة بشهادة، تتفرجوا عليها في الوقت اللي يناسبكم ومن أي جهاز.',
    male: 'دورات مسجّلة بشهادة، تتفرج عليها في الوقت اللي يناسبك ومن أي جهاز.',
    female: 'دورات مسجّلة بشهادة، تتفرجي عليها في الوقت اللي يناسبك ومن أي جهاز.',
    en: 'Recorded courses with a certificate. Watch them whenever it suits you, on any device.',
  },
  'auth.login.sub': {
    guest: 'سجّل دخولك عشان تكمّل دوراتك',
    male: 'سجّل دخولك عشان تكمّل دوراتك',
    female: 'سجّلي دخولك عشان تكمّلي دوراتك',
    en: 'Sign in to continue your courses',
  },
  'search.placeholder': {
    guest: 'دوّر على دورة…',
    male: 'دوّر على دورة…',
    female: 'دوّري على دورة…',
    en: 'Search for a course…',
  },
} satisfies Record<string, Variants>

export type CopyKey = keyof typeof strings
