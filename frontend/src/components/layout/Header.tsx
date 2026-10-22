import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth, useCopy } from '@/auth/hooks'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { routes } from '@/app/routes'
import { cn } from '@/lib/cn'
import { useActivity, useReadState } from '@/lib/activity'
import { NotificationItem } from '@/components/account/NotificationItem'
import { confirmAction } from '@/lib/confirm'
import { isEn, setLang, tx } from '@/lib/i18n'

const NAV = [
  { to: routes.home, label: tx('الرئيسية', 'Home'), end: true },
  { to: routes.about, label: tx('عن د. صالح', 'About') },
  { to: routes.courses, label: tx('الدورات', 'Courses') },
  { to: routes.library, label: tx('المكتبة', 'Library') },
  { to: routes.store, label: tx('المتجر', 'Store') },
  // The header keeps pointing to the original consultation page (decision with Amr).
  { to: routes.consultation, label: tx('الاستشارات', 'Consultations') },
  { to: routes.blog, label: tx('المقالات', 'Articles') },
  { to: routes.contact, label: tx('تواصل معنا', 'Contact') },
]

const ACCOUNT_MENU: { to: string; label: string; icon: IconName }[] = [
  { to: routes.dashboard, label: tx('نظرة عامة', 'Overview'), icon: 'grid' },
  { to: routes.myCourses, label: tx('دوراتي', 'My courses'), icon: 'video' },
  { to: routes.myBooks, label: tx('كتبي', 'My books'), icon: 'book' },
  { to: routes.certificates, label: tx('شهاداتي', 'Certificates'), icon: 'award' },
  { to: routes.orders, label: tx('طلباتي', 'My orders'), icon: 'receipt' },
  { to: routes.wishlist, label: tx('المفضلة', 'Wishlist'), icon: 'heart' },
  { to: routes.myConsultations, label: tx('استشاراتي', 'My consultations'), icon: 'chat' },
  { to: routes.profile, label: tx('الملف الشخصي', 'Profile'), icon: 'user' },
]

type Panel = 'menu' | 'notif' | 'mobile' | null

const iconBtn =
  'relative flex size-10.5 items-center justify-center rounded-full border-0 bg-transparent text-ink transition-colors hover:bg-hover hover:text-ink'
const dropdown =
  'absolute top-20 z-60 flex animate-dd-in flex-col gap-0.5 rounded-[22px] border border-line bg-white p-2.5 shadow-pop max-sm:inset-x-0 max-sm:top-18 max-sm:w-auto'
const menuItem =
  'flex min-h-11 w-full items-center gap-3 rounded-xl border-0 bg-transparent px-3 text-start text-[15px] text-ink hover:bg-hover hover:text-ink'

export function Header() {
  const { user, logout } = useAuth()
  const t = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const [panel, setPanel] = useState<Panel>(null)
  const [scrolled, setScrolled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const { data: cartSummary } = useQuery({
    queryKey: ['me', 'cart-summary'],
    queryFn: () => api.get<{ itemsCount: number }>('/cart/summary', { params: { currency: 'EGP' } }),
    enabled: Boolean(user),
    staleTime: 60_000,
  })
  const cartCount = cartSummary?.itemsCount ?? 0
  const { items: activity } = useActivity()
  const { isUnread, markRead, markAllRead } = useReadState()
  const unread = activity.filter(isUnread).length

  // Close panels on navigation, outside click and Escape.
  const [path, setPath] = useState(location.pathname)
  if (path !== location.pathname) {
    setPath(location.pathname)
    setPanel(null)
  }
  useEffect(() => {
    if (!panel) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPanel(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [panel])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p))
  const initial = user?.firstName?.charAt(0) ?? ''

  async function handleLogout() {
    setPanel(null)
    if (
      !(await confirmAction({
        title: tx('تسجّل خروج؟', 'Sign out?'),
        body: tx(
          'هتحتاج تدخل بالإيميل وكلمة السر تاني.',
          "You'll need your email and password to sign in again.",
        ),
        confirmLabel: tx('تسجيل الخروج', 'Sign out'),
        cancelLabel: tx('خليني', 'Stay'),
        tone: 'warning',
        icon: 'logout',
      }))
    )
      return
    await logout()
    navigate(routes.home)
  }

  return (
    // Floating white pill over the hero; the wrapper itself ignores clicks.
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-6 py-3.5 max-sm:px-4 max-sm:py-2.5"
      ref={rootRef}
    >
      <header
        className={cn(
          'pointer-events-auto relative mx-auto flex h-17.5 max-w-site items-center gap-5 rounded-full border bg-white/96 ps-5 pe-2.5 transition-shadow duration-300',
          'max-xl:justify-between max-sm:h-15.5 max-sm:gap-2 max-sm:ps-3.5 max-sm:pe-1.5',
          scrolled
            ? 'border-line shadow-[0_14px_34px_-20px_rgba(12,42,74,.45)] backdrop-blur-md'
            : 'border-white/70 shadow-[0_18px_40px_-22px_rgba(5,20,40,.55)]',
        )}
      >
        <Link to={routes.home} aria-label={tx('الرئيسية', 'Home')} className="flex flex-none">
          <img
            src="/assets/brand/logo-blue.webp"
            alt={tx('الدكتور صالح عبد الكريم', 'Dr. Saleh Abdelkarim')}
            width={102}
            height={46}
            className="h-11.5 w-auto max-sm:h-9.5"
          />
        </Link>

        <nav
          aria-label={tx('القائمة الرئيسية', 'Main menu')}
          className="flex flex-1 justify-center gap-0.5 max-xl:hidden"
        >
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex h-10.5 items-center rounded-full px-3.5 text-[15px] whitespace-nowrap transition-colors ltr:px-3',
                  isActive
                    ? 'bg-navy px-4 font-bold text-white hover:text-white'
                    : 'font-medium text-muted hover:bg-hover hover:text-ink',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            className={cn(iconBtn, 'font-head text-[13px] font-bold')}
            onClick={() => setLang(isEn ? 'ar' : 'en')}
            aria-label={isEn ? 'التصفح بالعربي' : 'Switch to English'}
            title={isEn ? 'العربية' : 'English'}
            lang={isEn ? 'ar' : 'en'}
          >
            {isEn ? 'ع' : 'EN'}
          </button>
          <Link
            to={routes.cart}
            aria-label={
              cartCount ? tx(`السلة، ${cartCount} عنصر`, `Cart, ${cartCount} items`) : tx('السلة', 'Cart')
            }
            className={iconBtn}
          >
            <Icon name="bag" />
            {cartCount > 0 && (
              <span className="absolute end-0.75 top-0.75 flex h-4.25 min-w-4.25 bg-gold items-center justify-center rounded-full border-2 border-white px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <button
                type="button"
                className={cn(iconBtn, panel === 'notif' && 'bg-hover')}
                aria-label={
                  unread
                    ? tx(`الإشعارات، ${unread} جديد`, `Notifications, ${unread} new`)
                    : tx('الإشعارات', 'Notifications')
                }
                aria-expanded={panel === 'notif'}
                onClick={() => toggle('notif')}
              >
                <Icon name="bell" />
                {unread > 0 && (
                  <span className="absolute end-0.75 top-0.75 flex h-4.25 min-w-4.25 items-center justify-center rounded-full border-2 border-white bg-danger-dot px-1 text-[11px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              <span className="mx-1.5 h-6 w-px bg-line" aria-hidden="true" />
              <button
                type="button"
                className={cn(
                  'flex h-11 items-center gap-2.25 rounded-full border border-line bg-white ps-3 pe-1.25 text-ink hover:bg-hover',
                  'max-sm:border-0 max-sm:px-1',
                  panel === 'menu' && 'bg-hover',
                )}
                aria-label={tx(`قائمة حسابي: ${user.fullName}`, `My account: ${user.fullName}`)}
                aria-expanded={panel === 'menu'}
                onClick={() => toggle('menu')}
              >
                <Avatar letter={initial} />
                <b className="text-sm max-sm:hidden">{user.firstName}</b>
                <Icon name="chevDown" size={16} className="max-sm:hidden" />
              </button>
            </>
          ) : (
            <>
              <span className="mx-1.5 h-6 w-px bg-line max-sm:hidden" aria-hidden="true" />
              <Link
                to={routes.login}
                className="flex h-10.5 items-center px-3 text-[15px] font-semibold text-ink max-sm:hidden"
              >
                {tx('دخول', 'Sign in')}
              </Link>
              <Link
                to={routes.register}
                className="flex h-11 bg-gold items-center rounded-full px-5.5 text-[15px] font-extrabold whitespace-nowrap text-navy transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:text-navy hover:shadow-[0_12px_26px_-12px_rgba(232,163,61,.8)] max-sm:hidden"
              >
                {t('cta.startFree')}
              </Link>
            </>
          )}

          <button
            type="button"
            className={cn(iconBtn, 'hidden max-xl:flex')}
            aria-label={tx('القائمة', 'Menu')}
            aria-expanded={panel === 'mobile'}
            onClick={() => toggle('mobile')}
          >
            <Icon name={panel === 'mobile' ? 'close' : 'menu'} />
          </button>
        </div>

        {panel === 'menu' && user && (
          <div role="menu" className={cn(dropdown, 'end-1.5 w-72.5')}>
            <div className="mb-1 flex bg-navy items-center gap-3 rounded-2xl p-3">
              <Avatar letter={initial} large />
              <span className="flex min-w-0 flex-col">
                <b className="text-white">{user.fullName}</b>
                <span className="truncate text-xs text-on-dark-muted">{user.email}</span>
              </span>
            </div>
            {ACCOUNT_MENU.map((m) => (
              <Link key={m.to} to={m.to} role="menuitem" className={menuItem}>
                <Icon name={m.icon} size={18} />
                {m.label}
              </Link>
            ))}
            {user.role === 'Admin' && (
              <Link to={routes.admin} role="menuitem" className={menuItem} reloadDocument={isEn}>
                <Icon name="grid" size={18} />
                {tx('لوحة التحكم', 'Dashboard')}
              </Link>
            )}
            <span className="mx-2 my-1.5 h-px bg-divider" />
            <button
              type="button"
              role="menuitem"
              className={cn(menuItem, 'font-semibold text-danger hover:text-danger')}
              onClick={handleLogout}
            >
              <Icon name="logout" size={18} />
              {tx('تسجيل الخروج', 'Sign out')}
            </button>
          </div>
        )}

        {panel === 'notif' && user && (
          <div
            role="dialog"
            aria-label={tx('الإشعارات', 'Notifications')}
            className={cn(dropdown, 'end-27.5 w-95 p-3.5')}
          >
            <div className="flex items-center justify-between px-1.5 pt-1 pb-2.5">
              <b className="font-head text-lg text-ink">{tx('الإشعارات', 'Notifications')}</b>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-bold text-blue-600 hover:bg-hover"
                >
                  <Icon name="check" size={15} />
                  {tx('تعليم الكل كمقروء', 'Mark all as read')}
                </button>
              )}
            </div>
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-3 py-7 text-[15px] text-muted">
                <span className="flex size-13 items-center justify-center rounded-2xl bg-surface-blue text-blue-600">
                  <Icon name="bell" size={22} />
                </span>
                {tx('مفيش إشعارات جديدة دلوقتي', 'No new notifications right now')}
              </div>
            ) : (
              <ul className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto">
                {activity.map((a) => (
                  <li key={a.id}>
                    <NotificationItem item={a} unread={isUnread(a)} onRead={() => markRead(a.id)} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              to={routes.notifications}
              className="mt-2 flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-t border-divider pt-2 text-sm font-bold text-blue-600 hover:text-blue-600"
            >
              {tx('عرض كل الإشعارات', 'See all notifications')}
              <Icon name="chevLeft" size={16} />
            </Link>
          </div>
        )}
      </header>

      {panel === 'mobile' && (
        <div className="pointer-events-auto mx-auto mt-2.5 max-w-site animate-dd-in rounded-card border border-line bg-white p-2.5 shadow-pop">
          <nav aria-label={tx('القائمة', 'Menu')} className="flex flex-col">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-13 items-center justify-between rounded-field px-3.5 font-semibold',
                    isActive ? 'bg-surface-blue text-blue-600' : 'text-ink',
                  )
                }
              >
                {n.label}
                <Icon name="chevLeft" size={18} />
              </NavLink>
            ))}
          </nav>
          {!user && (
            <div className="grid grid-cols-2 gap-2.5 px-1 pt-2.5 pb-1">
              <Link to={routes.login} className={buttonClass({ variant: 'outline', block: true })}>
                {tx('دخول', 'Sign in')}
              </Link>
              <Link to={routes.register} className={buttonClass({ variant: 'gold', block: true })}>
                {t('cta.startFree')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ letter, large }: { letter: string; large?: boolean }) {
  return (
    <span
      className={cn(
        'flex flex-none bg-gold items-center justify-center rounded-full font-extrabold text-navy',
        large ? 'size-11 text-lg' : 'size-8.5',
      )}
    >
      {letter}
    </span>
  )
}
