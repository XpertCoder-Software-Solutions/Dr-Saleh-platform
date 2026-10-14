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

/** Reads a digital book (PDF in the browser) or plays an audio book the user owns. */
export function ReaderPage() {
  const { formatId = '' } = useParams()
  const books = useMyBooks()
  const owned = books.data?.items.find((b) => b.bookFormatId === formatId)
  const audio = owned?.formatType === 'Audio'
  usePageTitle(owned?.book.titleAr ?? 'كتبي')

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
          title="الكتاب ده مش في مكتبتك"
          body="النسخ الرقمية والصوتية اللي بتشتريها بتظهر في صفحة كتبي."
          action={
            <Link to={routes.myBooks} className={buttonClass({ variant: 'gold' })}>
              كتبي
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
          title="مقدرناش نفتح الملف"
          body={(file.error as Error).message}
          action={
            <button type="button" className={buttonClass({ variant: 'navy' })} onClick={() => file.refetch()}>
              جرّب تاني
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
          <h1 className="text-2xl">{owned.book.titleAr}</h1>
          <p className="text-muted">د. صالح عبد الكريم · كتاب صوتي</p>
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
        <p className="text-center text-xs text-muted">المنصة بتفتكر وقفت فين على الجهاز ده.</p>
      </div>
    )
  } else {
    body = (
      <iframe title={owned.book.titleAr} src={file.data!.url} className="w-full flex-1 border-0 bg-white" />
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex flex-none items-center gap-4 border-b border-line bg-white px-5 py-3 max-sm:px-3">
        <Link to={routes.myBooks} className={buttonClass({ variant: 'outline', size: 'sm' })}>
          <Icon name="chevRight" size={15} /> كتبي
        </Link>
        {owned && (
          <span className="flex min-w-0 items-center gap-3">
            <span className="h-11 w-8 flex-none bg-navy overflow-hidden rounded">
              {cover && <img src={cover} alt="" className="size-full object-cover" />}
            </span>
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-ink">{owned.book.titleAr}</b>
              <span className="text-xs text-muted">{audio ? 'استماع' : 'قراءة'}</span>
            </span>
          </span>
        )}
      </header>
      {body}
    </div>
  )
}
