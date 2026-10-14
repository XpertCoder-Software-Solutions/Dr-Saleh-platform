import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  accountKeys,
  profileApi,
  useMyBooks,
  useMyCertificates,
  useMyCourses,
  useWishlistAll,
} from '@/api/account'
import { resolveAssetUrl } from '@/api/client'
import { routes } from '@/app/routes'
import { useAuth, useGender } from '@/auth/hooks'
import { PageHero } from '@/components/layout/PageHero'
import { Icon, type IconName } from '@/components/ui/Icon'
import { innerClass, sectionClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { TONE_CLASS, type Tone } from '@/lib/order-status'
import { usePageTitle } from '@/lib/usePageTitle'

export type AccountSection =
  | 'dashboard'
  | 'courses'
  | 'books'
  | 'certs'
  | 'orders'
  | 'wishlist'
  | 'consults'
  | 'notifications'
  | 'referral'
  | 'profile'

const NAV: { id: AccountSection; label: string; to: string; icon: IconName; end?: boolean }[] = [
  { id: 'dashboard', label: 'نظرة عامة', to: routes.dashboard, icon: 'grid', end: true },
  { id: 'courses', label: 'دوراتي', to: routes.myCourses, icon: 'video' },
  { id: 'books', label: 'كتبي', to: routes.myBooks, icon: 'book' },
  { id: 'certs', label: 'شهاداتي', to: routes.certificates, icon: 'award' },
  { id: 'orders', label: 'طلباتي', to: routes.orders, icon: 'receipt' },
  { id: 'wishlist', label: 'المفضلة', to: routes.wishlist, icon: 'heart' },
  { id: 'consults', label: 'استشاراتي', to: routes.myConsultations, icon: 'chat' },
  { id: 'notifications', label: 'الإشعارات', to: routes.notifications, icon: 'bell' },
  { id: 'referral', label: 'ادعُ صديق', to: routes.referral, icon: 'heartHand' },
  { id: 'profile', label: 'الملف الشخصي', to: routes.profile, icon: 'user' },
]

const monthYear = new Intl.DateTimeFormat('ar-EG', {
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})

/** Avatar circle: the profile photo, or the first letter on gold. */
export function Avatar({ name, image, size = 56 }: { name: string; image?: string | null; size?: number }) {
  const src = resolveAssetUrl(image)
  return (
    <span
      className="flex flex-none bg-gold items-center justify-center overflow-hidden rounded-full border-[3px] border-white/50 font-head font-bold text-navy"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : name.trim().charAt(0) || '؟'}
    </span>
  )
}

function useBadges(): Partial<Record<AccountSection, number>> {
  const courses = useMyCourses()
  const books = useMyBooks()
  const certs = useMyCertificates()
  const wishlist = useWishlistAll()
  return {
    courses: courses.data?.length,
    books: books.data?.items.length,
    certs: certs.data?.length,
    wishlist: wishlist.data?.pagination.total,
  }
}

function Sidebar({ active }: { active: AccountSection }) {
  const { user, logout } = useAuth()
  const g = useGender()
  const navigate = useNavigate()
  const badges = useBadges()
  const profile = useQuery({ queryKey: accountKeys.profile, queryFn: profileApi.get, staleTime: 5 * 60_000 })
  const since = profile.data?.createdAt ? monthYear.format(new Date(profile.data.createdAt)) : null

  return (
    <aside aria-label="قائمة الحساب" className="flex flex-col gap-4 max-lg:hidden">
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-[0_30px_60px_-40px_rgba(12,42,74,.45)]">
        <div className="relative flex bg-navy items-center gap-3.5 overflow-hidden px-5 py-5.5">
          <div className="absolute inset-0 dots opacity-45" aria-hidden="true" />
          <span className="relative">
            <Avatar name={user?.fullName ?? ''} image={user?.profileImage} />
          </span>
          <span className="relative flex min-w-0 flex-col gap-0.5">
            <b className="truncate text-[17px] text-white">{user?.fullName}</b>
            {since && (
              <span className="text-[13px] text-on-dark">
                {g('عضو', 'عضوة', 'عضو')} منذ {since}
              </span>
            )}
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2.5">
          {NAV.map((n) => {
            const on = n.id === active
            const badge = badges[n.id]
            return (
              <NavLink
                key={n.id}
                to={n.to}
                end={n.end}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 text-[15px] transition-colors hover:bg-hover',
                  on
                    ? 'bg-linear-to-l from-[#F6FAFD] to-surface-blue font-bold text-ink shadow-[inset_-3px_0_0_var(--color-blue-400)]'
                    : 'font-medium text-text-2',
                )}
              >
                <Icon name={n.icon} size={19} className="flex-none" />
                <span className="flex-1">{n.label}</span>
                {!!badge && (
                  <span
                    className={cn(
                      'flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                      n.id === 'certs' ? 'bg-gold-soft text-gold-ink' : 'bg-surface-blue text-blue-600',
                    )}
                  >
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
          <div className="mx-2 my-1.5 h-px bg-divider" />
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate(routes.home)
            }}
            className="flex min-h-12 items-center gap-3 rounded-[14px] border-0 bg-transparent px-3.5 text-[15px] font-semibold text-danger hover:bg-red-50"
          >
            <Icon name="logout" size={19} />
            تسجيل الخروج
          </button>
        </nav>
      </div>
      <Link
        to={routes.referral}
        className="flex items-center gap-3.5 rounded-[22px] bg-linear-to-br from-[#FDF4E6] to-[#FBE3B5] p-4.5 text-ink"
      >
        <span className="flex size-11 flex-none bg-gold items-center justify-center rounded-[14px] text-navy">
          <Icon name="heartHand" size={20} />
        </span>
        <span className="flex flex-col gap-0.5">
          <b className="text-[15px]">ادعُ صديق واكسب</b>
          <span className="text-[13px] text-[#6B5A3E]">كوبون خصم أول ما صاحبك يشتري</span>
        </span>
      </Link>
    </aside>
  )
}

/** Mobile: the account menu becomes a scrolling row of pills under the hero. */
function MobileTabs({ active }: { active: AccountSection }) {
  return (
    <nav
      aria-label="قائمة الحساب"
      className="-mx-4 mb-5 flex gap-2 overflow-x-auto mask-fade-x px-4 pb-1 lg:hidden"
    >
      {NAV.map((n) => (
        <Link
          key={n.id}
          to={n.to}
          aria-current={n.id === active ? 'page' : undefined}
          className={cn(
            'flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap',
            n.id === active ? 'bg-navy border-navy text-white' : 'border-line bg-white text-text-2',
          )}
        >
          <Icon name={n.icon} size={15} />
          {n.label}
        </Link>
      ))}
    </nav>
  )
}

interface AccountShellProps {
  active: AccountSection
  title: ReactNode
  /** Plain-text page title for the browser tab. */
  pageTitle: string
  body?: ReactNode
  children: ReactNode
}

/** Hero + account sidebar frame shared by every page under /account. */
export function AccountShell({ active, title, pageTitle, body, children }: AccountShellProps) {
  usePageTitle(pageTitle)
  const label = NAV.find((n) => n.id === active)?.label ?? pageTitle
  return (
    <>
      <PageHero
        portrait={false}
        crumbs={[
          { label: 'الرئيسية', to: routes.home },
          ...(active === 'dashboard' ? [] : [{ label: 'حسابي', to: routes.dashboard }]),
          { label: active === 'dashboard' ? 'حسابي' : label },
        ]}
        title={title}
        body={body}
      />
      <section className={cn(sectionClass, 'relative z-2 -mt-14')}>
        <div className={innerClass}>
          <MobileTabs active={active} />
          <div className="grid grid-cols-[290px_1fr] items-start gap-6 max-lg:grid-cols-1">
            <div className="sticky top-27 max-lg:static max-lg:hidden">
              <Sidebar active={active} />
            </div>
            <div className="flex min-w-0 flex-col gap-6">{children}</div>
          </div>
        </div>
      </section>
    </>
  )
}

/** White rounded panel used for every block on account pages. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(12,42,74,.35)] max-sm:p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Filter pills with counts ("الكل 3 · بتتعلمها 2 · مكتملة 1"). */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-colors',
              on ? 'bg-navy border-navy text-white' : 'border-line bg-white text-text-2 hover:bg-hover',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('text-xs', on ? 'text-on-dark' : 'text-muted')}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Thin progress bar (blue, green when complete). */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="w-10 text-sm font-bold text-ink">{pct}%</span>
      <span
        className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDF2F7]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={cn('block h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-progress')}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  )
}

/** Rounded status label ("مدفوع", "مؤكدة"…). */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}
