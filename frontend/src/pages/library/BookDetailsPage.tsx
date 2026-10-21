import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError, resolveAssetUrl } from '@/api/client'
import { booksApi } from '@/api/endpoints'
import { useAddToCart } from '@/api/cart'
import { useWishlist } from '@/api/wishlist'
import { useCopy } from '@/auth/hooks'
import { routes } from '@/app/routes'
import { BookCoverArt } from '@/components/catalog/BookCard'
import { Gallery } from '@/components/catalog/Gallery'
import { QuantityStepper } from '@/components/catalog/QuantityStepper'
import { CTABand } from '@/components/layout/CTABand'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass, innerClass, sectionClass } from '@/components/ui/button'
import { Alert, ErrorState, Spinner } from '@/components/ui/States'
import { Highlight } from '@/components/ui/Highlight'
import { cn } from '@/lib/cn'
import { activeFormats, bookStartPrice, FORMAT_LABEL, formatPrice } from '@/lib/catalog'
import { durationLabel, formatMoney } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import type { Book, BookFormat, BookFormatType } from '@/types/api'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useRegion } from '@/lib/region'

const FORMAT_ICON: Record<BookFormatType, IconName> = {
  Physical: 'bookClosed',
  Digital: 'file',
  Audio: 'headphones',
}
const FORMAT_NOTE: Record<BookFormatType, string> = {
  Physical: 'يوصلك خلال 2 لـ 4 أيام عمل',
  Digital: 'PDF يتفتح فورًا بعد الدفع',
  Audio: 'تسمعه فورًا بعد الدفع',
}

export function BookDetailsPage() {
  const { slug = '' } = useParams()
  const {
    data: book,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['books', 'slug', slug],
    queryFn: () => booksApi.bySlug(slug),
  })
  usePageTitle(book?.titleAr ?? 'الكتاب')

  if ((error instanceof ApiClientError && error.statusCode === 404) || (book && !book.isActive))
    return <NotFoundPage />
  if (isError) {
    return (
      <div className="mx-auto max-w-140 px-6 pt-36 pb-20">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }
  if (isLoading || !book) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-30 text-blue-600">
        <Spinner />
      </div>
    )
  }
  return <BookDetails book={book} />
}

function BookDetails({ book }: { book: Book }) {
  const { currency } = useRegion()
  const t = useCopy()
  const navigate = useNavigate()
  const formats = activeFormats(book)
  const [formatId, setFormatId] = useState(formats[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cart = useAddToCart()
  const wishlist = useWishlist('BOOK')

  const format = formats.find((f) => f.id === formatId)
  const price = format ? formatPrice(format, book, currency) : { current: bookStartPrice(book, currency), old: null }
  const physical = format?.formatType === 'Physical'
  const outOfStock = physical && (format?.stock ?? 0) <= 0
  const [head, ...tail] = book.titleAr.split(' ')

  const gallery = useMemo(() => {
    const items = [
      {
        key: 'cover',
        label: 'الغلاف',
        main: <BookCoverArt book={book} className="h-auto max-h-90 w-60 tilt" />,
        thumb: <BookCoverArt book={book} size="sm" />,
      },
    ]
    for (const img of [...book.images].sort((a, b) => a.displayOrder - b.displayOrder)) {
      const src = resolveAssetUrl(img.imageUrl)!
      items.push({
        key: img.id,
        label: 'صورة من الكتاب',
        main: <img src={src} alt="" className="max-h-full max-w-full rounded-xl object-contain" />,
        thumb: <img src={src} alt="" className="size-full object-cover" />,
      })
    }
    return items
  }, [book])

  async function add(goToCart: boolean) {
    if (!format) return
    setError(null)
    try {
      const ok = await cart.add({ itemType: 'BOOK', itemId: format.id, quantity: physical ? qty : 1 })
      if (!ok) return
      setAdded(true)
      if (goToCart) navigate(routes.cart)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصلت مشكلة، حاول تاني.')
    }
  }

  return (
    <>
      <section className="px-6 pt-30 pb-16 max-sm:px-4 max-sm:pt-26">
        <div className={cn(innerClass, 'flex flex-col gap-6')}>
          <nav aria-label="مسار الصفحة" className="text-sm text-muted">
            <Link to={routes.home}>الرئيسية</Link> / <Link to={routes.library}>المكتبة</Link> /{' '}
            <span aria-current="page" className="text-ink">
              {book.titleAr}
            </span>
          </nav>
          <div className="grid grid-cols-2 items-start gap-8 max-lg:grid-cols-1">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {book.isFeatured && (
                  <span className="bg-gold rounded-full px-3 py-1 text-[13px] font-extrabold text-navy">
                    الأكثر مبيعًا
                  </span>
                )}
                {book.category && (
                  <span className="rounded-full bg-surface-blue px-3 py-1 text-[13px] font-bold text-blue-600">
                    {book.category.nameAr}
                  </span>
                )}
              </div>
              <h1 className="text-[clamp(32px,4.5vw,48px)] leading-tight">
                <Highlight text={tail.length ? `${head} *${tail.join(' ')}*` : head} />
              </h1>
              <p className="text-sm text-muted">تأليف: د. صالح عبد الكريم</p>

              {formats.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <b className="text-ink">اختار النسخة</b>
                  <div
                    className="grid grid-cols-3 gap-3 max-sm:grid-cols-1"
                    role="radiogroup"
                    aria-label="النسخة"
                  >
                    {formats.map((f) => (
                      <FormatOption
                        key={f.id}
                        format={f}
                        book={book}
                        selected={f.id === formatId}
                        onPick={() => setFormatId(f.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
                {format && (
                  <span
                    className={cn('text-[15px] font-semibold', outOfStock ? 'text-danger' : 'text-success')}
                  >
                    ●{' '}
                    {outOfStock ? 'نفدت النسخة الورقية حاليًا' : `متوفر · ${FORMAT_NOTE[format.formatType]}`}
                  </span>
                )}
                {physical && !outOfStock && (
                  <div className="flex items-center justify-between">
                    <b className="text-ink">الكمية</b>
                    <QuantityStepper value={qty} onChange={setQty} max={format?.stock ?? 99} />
                  </div>
                )}
                {error && <Alert tone="error">{error}</Alert>}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    className={buttonClass({ variant: 'gold', size: 'lg', className: 'flex-1' })}
                    disabled={!format || outOfStock || cart.isPending}
                    onClick={() => add(false)}
                  >
                    {cart.isPending ? (
                      <Spinner />
                    ) : added ? (
                      <>
                        <Icon name="check" /> اتضاف للسلة
                      </>
                    ) : (
                      <>
                        {t('cta.addToCart')}
                        {price.current != null && ` · ${formatMoney(price.current * (physical ? qty : 1), currency)}`}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={buttonClass({
                      variant: 'outline',
                      size: 'lg',
                      className: cn(
                        'w-14 flex-none px-0',
                        wishlist.has(book.id) && 'text-danger-dot hover:text-danger-dot',
                      ),
                    })}
                    aria-pressed={wishlist.has(book.id)}
                    aria-label={wishlist.has(book.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    onClick={() => wishlist.toggle(book.id)}
                  >
                    <Icon name="heart" filled={wishlist.has(book.id)} />
                  </button>
                </div>
                {added && (
                  <Link to={routes.cart} className="text-center font-bold">
                    روح للسلة <Icon name="arrowLeft" size={16} className="inline" />
                  </Link>
                )}
              </div>
            </div>

            <Gallery
              className="max-lg:order-first"
              items={gallery}
              stageClass="bg-linear-135 from-blue-600 to-blue-400"
              badge={
                formats.some((f) => f.formatType === 'Audio') ? (
                  <span className="absolute bottom-5 left-5 z-1 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-float">
                    <span className="flex size-9 bg-gold items-center justify-center rounded-xl text-navy">
                      <Icon name="headphones" size={18} />
                    </span>
                    <span className="flex flex-col text-sm">
                      <b className="text-ink">بصوت الدكتور</b>
                      {formats.find((f) => f.formatType === 'Audio')?.audioDuration ? (
                        <span className="text-xs text-muted">
                          {durationLabel(formats.find((f) => f.formatType === 'Audio')!.audioDuration!)}{' '}
                          استماع
                        </span>
                      ) : null}
                    </span>
                  </span>
                ) : undefined
              }
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={cn(innerClass, 'flex flex-col gap-4 rounded-panel p-9 gborder max-sm:p-6')}>
          <h2 className="text-[26px]">نبذة عن الكتاب</h2>
          <div className="flex flex-col gap-3 text-[17px] leading-[1.95] text-text-2">
            {book.descriptionAr
              .split(/\n+/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </div>
      </section>

      <MoreBooks current={book} />

      <CTABand
        title="عايز تطبّق اللي في الكتاب خطوة بخطوة؟"
        body="الدورات بتحوّل أفكار الكتب لخطوات عملية بالفيديو، مع شهادة في الآخر."
      />
    </>
  )
}

function FormatOption({
  format,
  book,
  selected,
  onPick,
}: {
  format: BookFormat
  book: Book
  selected: boolean
  onPick: () => void
}) {
  const { currency } = useRegion()
  const price = formatPrice(format, book, currency)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className="flex flex-col items-start gap-1.5 rounded-tile border-2 border-line bg-white p-4 text-start transition-colors hover:border-blue-300 aria-checked:border-blue-400 aria-checked:bg-surface-blue"
    >
      <Icon name={FORMAT_ICON[format.formatType]} className="text-blue-600" />
      <b className="text-ink">{FORMAT_LABEL[format.formatType]}</b>
      {price.current != null && (
        <span className="text-[15px] font-bold text-ink">
          {formatMoney(price.current, currency)}
          {price.old != null && (
            <s className="ms-1.5 text-xs font-normal text-muted-2">{formatMoney(price.old, currency)}</s>
          )}
        </span>
      )}
    </button>
  )
}

function MoreBooks({ current }: { current: Book }) {
  const { currency } = useRegion()
  const { data } = useQuery({ queryKey: ['books'], queryFn: booksApi.list })
  const others = (data ?? []).filter((b) => b.isActive && b.id !== current.id).slice(0, 4)
  if (!others.length) return null
  return (
    <section className={sectionClass}>
      <div className={innerClass}>
        <SectionHeader
          eyebrow="من المكتبة"
          icon="book"
          title={<Highlight text="اطّلع على *المزيد* من الكتب" />}
          more={{ to: routes.library, label: 'المكتبة' }}
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {others.map((b) => {
            const p = bookStartPrice(b, currency)
            return (
              <Link
                key={b.id}
                to={routes.book(b.slug)}
                className="glow-card flex items-center gap-4 rounded-card border border-line bg-white p-4 text-text hover:text-text"
              >
                <BookCoverArt book={b} size="sm" className="h-22 w-16" />
                <span className="flex min-w-0 flex-col gap-1">
                  <b className="truncate text-ink">{b.titleAr}</b>
                  <span className="text-xs text-muted">
                    {activeFormats(b)
                      .map((f) => FORMAT_LABEL[f.formatType])
                      .join(' · ')}
                  </span>
                  {p != null && <b className="text-ink">{formatMoney(p, currency)}</b>}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
