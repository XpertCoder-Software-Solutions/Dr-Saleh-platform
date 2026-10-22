import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { tx } from '@/lib/i18n'

/** Public site shell: floating header, page, footer. */
export function SiteLayout() {
  return (
    <>
      <a
        href="#main"
        className="absolute start-4 -top-25 z-100 rounded-sm bg-ink px-4 py-2.5 text-white focus:top-4 focus:text-white"
      >
        {tx('انتقل للمحتوى', 'Skip to content')}
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
