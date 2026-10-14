/** Course grid: at most 3 per row; fewer cards keep their width instead of stretching. */
export const courseGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(max(290px,calc((100%-48px)/3)),1fr))] gap-6 max-sm:grid-cols-1'

/** Catalog grid next to the filter sidebar (narrower minimum). */
export const catalogGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(max(250px,calc((100%-48px)/3)),1fr))] gap-6 max-sm:grid-cols-1'
