import { useEffect } from 'react'

const SITE = 'د. صالح عبد الكريم'

/** Sets the tab title; pass nothing for the plain site name. */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE
  }, [title])
}
