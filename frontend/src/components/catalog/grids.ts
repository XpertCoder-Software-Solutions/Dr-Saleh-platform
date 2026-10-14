/** Up to 4 per row; fewer books keep their width. */
export const booksGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(max(220px,calc((100%-72px)/4)),1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3'

export const productsGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(max(230px,calc((100%-72px)/4)),1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3'

export const articlesGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(max(260px,calc((100%-48px)/3)),1fr))] gap-6 max-sm:grid-cols-1'
