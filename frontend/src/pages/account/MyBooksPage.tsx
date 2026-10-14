import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyBooks, type OwnedBook } from '@/api/account'
import { resolveAssetUrl } from '@/api/client'
import { routes } from '@/app/routes'
import { useGender } from '@/auth/hooks'
import { AccountShell, FilterTabs, Panel, ProgressBar } from '@/components/account/AccountShell'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { readAudioPosition } from '@/lib/audio-position'
import { durationLabel } from '@/lib/format'

type Filter = 'all' | 'Digital' | 'Audio'

export function MyBooksPage() {
  const g = useGender()
  const books = useMyBooks()
  const [filter, setFilter] = useState<Filter>('all')
  const list = books.data?.items ?? []
  const visible = list.filter((b) => filter === 'all' || b.formatType === filter)

  return (
    <AccountShell
      active="books"
      pageTitle="كتبي"
      title={
        <>
          كتبي <span className="text-sheen">الرقمية والصوتية</span>
        </>
      }
      body={g(
        'اقرأ أو اسمع كتبك من أي جهاز.',
        'اقرئي أو اسمعي كتبك من أي جهاز.',
        'القراءة والاستماع من أي جهاز.',
      )}
    >
      <Panel className="p-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'الكل', count: list.length },
            { id: 'Digital', label: 'رقمي', count: list.filter((b) => b.formatType === 'Digital').length },
            { id: 'Audio', label: 'صوتي', count: list.filter((b) => b.formatType === 'Audio').length },
          ]}
        />
      </Panel>

      {books.isError ? (
        <ErrorState onRetry={() => books.refetch()} />
      ) : books.isLoading ? (
        <Panel className="flex justify-center py-16 text-blue-600">
          <Spinner />
        </Panel>
      ) : list.length === 0 ? (
        <Panel>
          <EmptyState
            icon="book"
            title="مكتبتك لسه فاضية"
            body="النسخ الرقمية والصوتية اللي بتشتريها بتظهر هنا على طول."
            action={
              <Link to={routes.library} className={buttonClass({ variant: 'gold' })}>
                المكتبة
              </Link>
            }
          />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((b) => (
            <BookRow key={b.id} book={b} />
          ))}
        </ul>
      )}

      <Link
        to={routes.orders}
        className="flex items-center gap-4 rounded-card border border-line bg-white p-5 text-inherit hover:bg-hover"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-surface-blue text-blue-600">
          <Icon name="truck" size={18} />
        </span>
        <span className="flex flex-1 flex-col">
          <b className="text-ink">النسخ الورقية</b>
          <span className="text-sm text-muted">الكتب الورقية بتتابع طلبها من صفحة طلباتي.</span>
        </span>
        <span className="flex items-center gap-1 font-bold text-blue-600">
          طلباتي <Icon name="arrowLeft" size={16} />
        </span>
      </Link>
    </AccountShell>
  )
}

function BookRow({ book }: { book: OwnedBook }) {
  const g = useGender()
  const audio = book.formatType === 'Audio'
  const cover = resolveAssetUrl(book.book.coverImage)
  const pos = audio ? readAudioPosition(book.bookFormatId) : null
  const pct = pos && book.audioDuration ? (pos / book.audioDuration) * 100 : null

  return (
    <li className="flex items-center gap-5 rounded-card border border-line bg-white p-4 shadow-card max-sm:flex-wrap">
      <span className="flex h-28 w-20 flex-none bg-navy items-center justify-center overflow-hidden rounded-lg text-white shadow-[0_10px_24px_-10px_rgba(12,42,74,.6)]">
        {cover ? (
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <Icon name="book" size={26} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-gold-ink">
          <Icon name={audio ? 'headphones' : 'file'} size={12} />
          {audio ? 'كتاب صوتي' : 'رقمي PDF'}
        </span>
        <h3 className="text-lg">
          <Link to={routes.book(book.book.slug)} className="text-ink">
            {book.book.titleAr}
          </Link>
        </h3>
        <p className="text-sm text-muted">
          {audio
            ? pos
              ? `${g('وقفت', 'وقفتي', 'آخر وقفة')} عند ${durationLabel(pos)}${book.audioDuration ? ` من ${durationLabel(book.audioDuration)}` : ''}`
              : book.audioDuration
                ? `لسه ${g('مبدأتش', 'مبدأتيش', 'متبدأش')} · ${durationLabel(book.audioDuration)}`
                : 'كتاب صوتي'
            : 'نسخة PDF تتقري من المتصفح'}
        </p>
        {pct !== null && <ProgressBar value={pct} className="max-w-sm" />}
        {!book.isAvailable && <span className="text-xs text-danger">الكتاب ده مش متاح حاليًا</span>}
      </div>
      {book.isAvailable && book.hasFile ? (
        <Link
          to={routes.read(book.bookFormatId)}
          className={buttonClass({ variant: 'gold', className: 'max-sm:w-full' })}
        >
          <Icon name={audio ? 'play' : 'book'} size={16} />
          {audio
            ? pos
              ? g('كمّل الاستماع', 'كمّلي الاستماع', 'استكمال الاستماع')
              : g('ابدأ الاستماع', 'ابدئي الاستماع', 'استماع')
            : g('اقرأ', 'اقرئي', 'قراءة')}
        </Link>
      ) : (
        <span className="text-sm text-muted">الملف لسه مش جاهز</span>
      )}
    </li>
  )
}
