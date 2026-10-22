import { resolveAssetUrl } from '@/api/client'
import { Icon, type IconName } from '@/components/ui/Icon'

const PALETTE: { grad: string; icon: IconName }[] = [
  { grad: 'linear-gradient(135deg, #0B2E52 0%, #1E5F96 55%, #3D9BD8 100%)', icon: 'bulb' },
  { grad: 'linear-gradient(135deg, #1E5F96 0%, #3D9BD8 55%, #7CD3FF 100%)', icon: 'list' },
  { grad: 'linear-gradient(135deg, #E8A33D 0%, #F2BC5E 55%, #F7CF7E 100%)', icon: 'message' },
  { grad: 'linear-gradient(135deg, #3B2F7A 0%, #6B55C9 55%, #9C8BEA 100%)', icon: 'sparkle' },
]

/** Stable pick from the palette so a course always gets the same cover colors. */
function coverTheme(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

interface Props {
  seed: string
  word: string
  tag?: string | null
  badge?: string | null
  image?: string | null
  height?: number
  wordSize?: number
}

export function CourseCover({ seed, word, tag, badge, image, height = 230, wordSize = 28 }: Props) {
  const theme = coverTheme(seed)
  const src = resolveAssetUrl(image)

  return (
    // Gradient and height come from data, so they stay inline.
    <div className="relative w-full overflow-hidden" style={{ height, background: theme.grad }}>
      {src ? (
        <img
          className="absolute inset-0 size-full cover-photo object-cover"
          src={src}
          alt=""
          loading="lazy"
        />
      ) : (
        <>
          <div className="absolute inset-0 dots opacity-55" aria-hidden="true" />
          <div
            className="absolute -end-22.5 -bottom-27.5 size-75 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.28)_0%,rgba(255,255,255,0)_70%)]"
            aria-hidden="true"
          />
          <div
            className="absolute -end-5 -bottom-10 size-47.5 animate-spin-slow rounded-full border-[1.5px] border-dashed border-white/35"
            aria-hidden="true"
          />
          <span
            className="absolute -start-2.5 top-1/2 -translate-y-1/2 font-head text-[120px] leading-none font-bold whitespace-nowrap text-white/7"
            aria-hidden="true"
          >
            {word}
          </span>
          <img
            className="absolute end-2.5 bottom-0 h-[94%] w-auto cover-photo drop-shadow-[0_14px_24px_rgba(5,20,40,.45)]"
            src="/assets/brand/saleh-cutout.webp"
            alt=""
            loading="lazy"
          />
          <div className="absolute start-4.5 bottom-4.5 flex w-[56%] flex-col items-start gap-2.5">
            <span className="flex size-11.5 cover-icon items-center justify-center rounded-[14px] text-white glass">
              <Icon name={theme.icon} size={22} />
            </span>
            <span
              className="font-head leading-tight font-bold text-white [text-shadow:0_2px_18px_rgba(0,0,0,.2)]"
              style={{ fontSize: wordSize }}
            >
              {word}
            </span>
          </div>
        </>
      )}
      {tag && (
        <span className="absolute start-4 top-4 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white glass">
          {tag}
        </span>
      )}
      {badge && (
        <span className="absolute end-4 top-4 bg-gold rounded-full px-3 py-1.5 text-[13px] font-extrabold text-navy shadow-[0_8px_18px_-8px_rgba(232,163,61,.9)]">
          {badge}
        </span>
      )}
    </div>
  )
}
