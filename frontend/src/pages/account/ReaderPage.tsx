import { useRef, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { myBooksApi, useMyBooks } from '@/api/account'
import { resolveAssetUrl } from '@/api/client'
import { routes } from '@/app/routes'
import { Icon } from '@/components/ui/Icon'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/States'
import { readAudioPosition, saveAudioPosition } from '@/lib/audio-position'
import { usePageTitle } from '@/lib/usePageTitle'
import { loc, tx } from '@/lib/i18n'

/** Reads a digital book (PDF in the browser) or plays an audio book the user owns. */
export function ReaderPage() {
  const { formatId = '' } = useParams()
  const books = useMyBooks()
  const owned = books.data?.items.find((b) => b.bookFormatId === formatId)
  const audio = owned?.formatType === 'Audio'
  usePageTitle(loc(owned?.book.titleAr, owned?.book.titleEn) ?? tx('كتبي', 'My books'))

  const file = useQuery({
    queryKey: ['me', 'book-url', formatId],
    queryFn: () => (audio ? myBooksApi.audioUrl(formatId) : myBooksApi.digitalUrl(formatId)),
    enabled: Boolean(owned),
    staleTime: 30 * 60_000,
    retry: 1,
  })
  const lastSave = useRef(0)
  const cover = resolveAssetUrl(owned?.book.coverImage)

  let body: ReactNode
  if (books.isLoading || (owned && file.isLoading)) {
    body = (
      <div className="flex flex-1 items-center justify-center text-blue-600">
        <Spinner />
      </div>
    )
  } else if (!owned) {
    body = (
      <div className="mx-auto mt-16 max-w-lg rounded-card bg-white p-8">
        <EmptyState
          icon="lock"
          title={tx('الكتاب ده مش في مكتبتك', "This book isn't in your library")}
          body={tx(
            'النسخ الرقمية والصوتية اللي بتشتريها بتظهر في صفحة كتبي.',
            'Digital and audio editions you buy appear in My books.',
          )}
          action={
            <Link to={routes.myBooks} className={buttonClass({ variant: 'gold' })}>
              {tx('كتبي', 'My books')}
            </Link>
          }
        />
      </div>
    )
  } else if (file.isError) {
    body = (
      <div className="mx-auto mt-16 max-w-lg rounded-card bg-white p-8">
        <EmptyState
          icon="alert"
          title={tx('مقدرناش نفتح الملف', "We couldn't open the file")}
          body={(file.error as Error).message}
          action={
            <button type="button" className={buttonClass({ variant: 'navy' })} onClick={() => file.refetch()}>
              {tx('جرّب تاني', 'Try again')}
            </button>
          }
        />
      </div>
    )
  } else if (audio) {
    body = (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <span className="h-72 w-52 bg-navy overflow-hidden rounded-xl shadow-photo">
          {cover && <img src={cover} alt="" className="size-full object-cover" />}
        </span>
        <div className="text-center">
          <h1 className="text-2xl">{loc(owned.book.titleAr, owned.book.titleEn)}</h1>
          <p className="text-muted">
            {tx('د. صالح عبد الكريم · كتاب صوتي', 'Dr. Saleh Abdelkarim · Audiobook')}
          </p>
        </div>
        <audio
          className="w-full"
          src={file.data!.url}
          controls
          controlsList="nodownload"
          onLoadedMetadata={(e) => {
            const pos = readAudioPosition(formatId)
            if (pos && pos < e.currentTarget.duration - 5) e.currentTarget.currentTime = pos
          }}
          onTimeUpdate={(e) => {
            if (Date.now() - lastSave.current < 5000) return
            lastSave.current = Date.now()
            saveAudioPosition(formatId, e.currentTarget.currentTime)
          }}
          onPause={(e) => saveAudioPosition(formatId, e.currentTarget.currentTime)}
        />
        <p className="text-center text-xs text-muted">
          {tx(
            'المنصة بتفتكر وقفت فين على الجهاز ده.',
            'The platform remembers where you stopped on this device.',
          )}
        </p>
      </div>
    )
  } else {
    body = (
      <iframe
        title={loc(owned.book.titleAr, owned.book.titleEn)}
        src={file.data!.url}
        className="w-full flex-1 border-0 bg-white"
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex flex-none items-center gap-4 border-b border-line bg-white px-5 py-3 max-sm:px-3">
        <Link to={routes.myBooks} className={buttonClass({ variant: 'outline', size: 'sm' })}>
          <Icon name="chevRight" size={15} /> {tx('كتبي', 'My books')}
        </Link>
        {owned && (
          <span className="flex min-w-0 items-center gap-3">
            <span className="h-11 w-8 flex-none bg-navy overflow-hidden rounded">
              {cover && <img src={cover} alt="" className="size-full object-cover" />}
            </span>
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-ink">{loc(owned.book.titleAr, owned.book.titleEn)}</b>
              <span className="text-xs text-muted">
                {audio ? tx('استماع', 'Listening') : tx('قراءة', 'Reading')}
              </span>
            </span>
          </span>
        )}
      </header>
      {body}
    </div>
  )
}
