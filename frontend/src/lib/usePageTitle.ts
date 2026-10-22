import { useEffect } from 'react'
import { tx } from '@/lib/i18n'

const SITE = tx('د. صالح عبد الكريم', 'Dr. Saleh Abdelkarim')

/** Sets the tab title; pass nothing for the plain site name. */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE
  }, [title])
}
