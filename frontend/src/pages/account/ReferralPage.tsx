import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accountKeys, referralsApi } from '@/api/account'
import { routes } from '@/app/routes'
import { useCopy, useGender } from '@/auth/hooks'
import { AccountShell, Panel, StatusPill } from '@/components/account/AccountShell'
import { Highlight } from '@/components/ui/Highlight'
import { Icon, type IconName } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { ErrorState, Spinner } from '@/components/ui/States'
import { formatDate, formatEGP } from '@/lib/format'
import { isEn, tx } from '@/lib/i18n'

// Captured once per page load; precise enough to grey out expired coupons.
const LOADED_AT = Date.now()

export function ReferralPage() {
  const g = useGender()
  const t = useCopy()
  const code = useQuery({ queryKey: accountKeys.referralCode, queryFn: referralsApi.myCode })
  const refs = useQuery({ queryKey: accountKeys.referrals, queryFn: referralsApi.mine })
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const value = code.data?.referral.referralCode ?? ''
  const link = `${window.location.origin}${routes.register}?ref=${value}`
  const items = refs.data?.items ?? []
  const rewarded = items.filter((r) => r.isRewarded)
  const coupons = items.filter((r) => r.rewardCoupon)
  const message = tx(
    `سجّل في منصة د. صالح عبد الكريم للتربية بالكود ${value}: ${link}`,
    `Join Dr. Saleh Abdelkarim's parenting platform with code ${value}: ${link}`,
  )

  async function copy(text: string, what: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt(tx('انسخ', 'Copy'), text)
    }
  }

  const stats: { icon: IconName; value: string | number; label: string; tint: string }[] = [
    {
      icon: 'link',
      value: refs.data?.pagination.total ?? 0,
      label: tx('صحاب سجّلوا بكودك', 'Friends who signed up with your code'),
      tint: 'bg-surface-blue text-blue-600',
    },
    {
      icon: 'check',
      value: rewarded.length,
      label: tx('اشتروا أول مرة', 'Made a first purchase'),
      tint: 'bg-[#E7F6EC] text-success',
    },
    {
      icon: 'heartHand',
      value: coupons.length,
      label: tx('كوبونات خصم ليك', 'Your discount coupons'),
      tint: 'bg-gold-soft text-gold-ink',
    },
  ]

  return (
    <AccountShell
      active="referral"
      pageTitle={tx('ادعُ صديق', 'Invite a friend')}
      title={
        <Highlight text={g('ادعُ *صحابك*', 'ادعي *صحابك*', 'ادعوا *صحابكم*', 'Invite *your friends*')} />
      }
      body={g(
        'شارك كودك، وكل صاحب يشتري بيه بيطلعلك كوبون خصم.',
        'شاركي كودك، وكل صاحبة تشتري بيه بيطلعلك كوبون خصم.',
        'كل صاحب يسجّل بالكود ويشتري، بيطلع لصاحب الكود كوبون خصم.',
        'Share your code, and you get a discount coupon for every friend who buys with it.',
      )}
    >
      <div className="relative grid bg-navy grid-cols-[1fr_200px] items-center gap-6 overflow-hidden rounded-card p-8 text-white max-md:grid-cols-1 max-sm:p-5">
        <div className="absolute inset-0 dots opacity-40" aria-hidden="true" />
        <div className="relative flex flex-col gap-4">
          <h2 className="text-[28px] leading-snug text-white">{t('ref.cta')}</h2>
          <p className="leading-loose text-on-dark">
            {isEn
              ? 'Your friend signs up with this code, and once they place their first order you get a discount coupon for your next order.'
              : `${g('صاحبك', 'صاحبتك', 'صاحبك')} يسجّل بالكود ده، وأول ما يشتري أول طلب، بيطلعلك كوبون خصم تستخدمه في أي طلب جاي.`}
          </p>
          {code.isLoading ? (
            <Spinner />
          ) : code.isError ? (
            <p className="text-sm text-on-dark">
              {tx('مقدرناش نجيب كودك دلوقتي.', "We couldn't load your code right now.")}
            </p>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 p-2 ps-5">
              <b dir="ltr" className="flex-1 text-center font-head text-2xl tracking-[.2em]">
                {value}
              </b>
              <button
                type="button"
                className={buttonClass({ variant: 'gold', size: 'sm' })}
                onClick={() => copy(value, 'code')}
              >
                <Icon name={copied === 'code' ? 'check' : 'copy'} size={14} />{' '}
                {copied === 'code' ? tx('اتنسخ', 'Copied') : tx('نسخ الكود', 'Copy code')}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: 'glass', size: 'sm' })}
            >
              <Icon name="whatsapp" size={15} /> {tx('واتساب', 'WhatsApp')}
            </a>
            <button
              type="button"
              className={buttonClass({ variant: 'glass', size: 'sm' })}
              disabled={!value}
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ text: message, url: link })
                  } catch {
                    // cancelled
                  }
                } else copy(link, 'link')
              }}
            >
              <Icon name={copied === 'link' ? 'check' : 'link'} size={15} />{' '}
              {copied === 'link' ? tx('اتنسخ', 'Copied') : tx('مشاركة اللينك', 'Share link')}
            </button>
          </div>
        </div>
        <span className="relative mx-auto flex size-40 bg-gold animate-floaty items-center justify-center rounded-[36px] text-navy shadow-gold max-md:hidden">
          <Icon name="heartHand" size={64} />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {stats.map((s) => (
          <Panel key={s.label} className="flex items-center gap-4 p-5">
            <span className={`flex size-11 items-center justify-center rounded-xl ${s.tint}`}>
              <Icon name={s.icon} size={18} />
            </span>
            <span className="flex flex-col">
              <b className="font-head text-[26px] leading-none text-ink">{s.value}</b>
              <span className="text-sm text-muted">{s.label}</span>
            </span>
          </Panel>
        ))}
      </div>

      {refs.isError ? (
        <ErrorState onRetry={() => refs.refetch()} />
      ) : (
        coupons.length > 0 && (
          <Panel className="flex flex-col gap-3">
            <h2 className="text-xl">{tx('كوبوناتك من الدعوات', 'Your referral coupons')}</h2>
            <ul className="flex flex-col gap-2.5">
              {coupons.map((r) => {
                const c = r.rewardCoupon!
                const expired = new Date(c.expiresAt).getTime() < LOADED_AT
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-4 rounded-tile border border-dashed border-gold bg-[#FFFBF2] p-4 max-sm:flex-wrap"
                  >
                    <b dir="ltr" className="font-head text-lg tracking-wider text-ink">
                      {c.code}
                    </b>
                    <span className="flex-1 text-sm text-text-2">
                      {tx('خصم', 'Discount')} {c.type === 'PERCENTAGE' ? `${c.value}%` : formatEGP(c.value)} ·{' '}
                      {tx('لحد', 'until')} {formatDate(c.expiresAt)}
                    </span>
                    {expired ? (
                      <StatusPill tone="muted">{tx('انتهى', 'Expired')}</StatusPill>
                    ) : (
                      <button
                        type="button"
                        className={buttonClass({ variant: 'outline', size: 'sm' })}
                        onClick={() => copy(c.code, 'code')}
                      >
                        <Icon name="copy" size={13} /> {tx('نسخ', 'Copy')}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-muted">
              {tx('اكتب الكوبون في خطوة الدفع.', 'Enter the coupon at the payment step.')}
            </p>
          </Panel>
        )
      )}

      <Panel className="flex flex-col gap-5">
        <h2 className="text-xl">{tx('إزاي بتشتغل؟', 'How it works')}</h2>
        <ol className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          {[
            [
              g('ابعت الكود', 'ابعتي الكود', 'ابعتوا الكود', 'Send the code'),
              g(
                'شارك كودك أو اللينك مع صحابك.',
                'شاركي كودك أو اللينك مع صحابك.',
                'الكود أو اللينك يتبعت للصحاب.',
                'Share your code or link with your friends.',
              ),
            ],
            [
              tx('يسجّلوا بالكود', 'They sign up with the code'),
              tx(
                'يكتبوه في خانة «كود دعوة» وهما بيعملوا الحساب، أو يفتحوا اللينك على طول.',
                'They enter it in the “Invite code” field when creating their account, or just open the link.',
              ),
            ],
            [
              g('تكسب كوبون', 'تكسبي كوبون', 'كوبون خصم', 'Earn a coupon'),
              tx(
                'أول ما صاحبك يدفع أول طلب، الكوبون بيظهر هنا.',
                'As soon as your friend pays for their first order, the coupon shows up here.',
              ),
            ],
          ].map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2 rounded-tile bg-surface p-5">
              <span className="flex size-8 bg-gold items-center justify-center rounded-full font-bold text-navy">
                {i + 1}
              </span>
              <b className="text-ink">{title}</b>
              <span className="text-sm leading-relaxed text-muted">{body}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </AccountShell>
  )
}
