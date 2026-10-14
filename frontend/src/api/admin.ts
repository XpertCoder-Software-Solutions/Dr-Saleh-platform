import type { Course, CourseReview, CourseSummary, Gender, Pagination } from '@/types/api'
import { api } from './client'
import type { ConsultStatus } from './account'
import type { Order, OrderStatus, PaymentStatus, ShippingStatus } from './shop'

// Every admin query key starts with 'admin'.
export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  revenue: (period: RevenuePeriod) => ['admin', 'revenue', period] as const,
  dashOrders: ['admin', 'dash-orders'] as const,
  dashUsers: ['admin', 'dash-users'] as const,
  orders: ['admin', 'orders'] as const,
  consultations: ['admin', 'consultations'] as const,
  students: ['admin', 'students'] as const,
  student: (id: string) => ['admin', 'students', id] as const,
  courses: ['admin', 'courses'] as const,
  course: (id: string) => ['admin', 'courses', id] as const,
}

// ---------- dashboard ----------

export interface Overview {
  totalUsers: number
  totalCourses: number
  totalBooks: number
  totalProducts: number
  totalOrders: number
  totalRevenueEGP: number
  totalRevenueUSD: number
  pendingOrders: number
  paidOrders: number
  failedPayments: number
  consultationRequestsCount: number
  contactMessagesCount: number
}

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecentOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currency: string
  totalAmount: number
  createdAt: string
  customerName: string
}

export const dashboardApi = {
  overview: () => api.get<{ overview: Overview }>('/admin/dashboard/overview'),
  revenue: (period: RevenuePeriod) =>
    api.get<{ revenue: { items: { date: string; revenue: number }[] } }>('/admin/dashboard/revenue', {
      params: { period, currency: 'EGP' },
    }),
  orders: () =>
    api.get<{
      orders: {
        ordersByStatus: Record<OrderStatus, number>
        paymentsByStatus: Record<PaymentStatus, number>
        recentOrders: RecentOrder[]
      }
    }>('/admin/dashboard/orders'),
  users: () =>
    api.get<{ users: { totalUsers: number; activeUsers: number; newUsersThisMonth: number } }>(
      '/admin/dashboard/users',
    ),
}

// ---------- orders ----------

export interface AdminOrder extends Order {
  user: { id: string; fullName: string; email: string; phoneNumber: string } | null
  payments?: { provider: string; status: PaymentStatus; amount: number }[]
}

export const adminOrdersApi = {
  list: (q: {
    page?: number
    limit?: number
    status?: OrderStatus
    paymentStatus?: PaymentStatus
    shippingStatus?: ShippingStatus
    search?: string
  }) => api.get<{ items: AdminOrder[]; pagination: Pagination }>('/admin/orders', { params: q }),
  get: (id: string) => api.get<{ order: AdminOrder }>(`/admin/orders/${id}`),
  setStatus: (id: string, body: { status?: OrderStatus; paymentStatus?: PaymentStatus }) =>
    api.patch<{ order: AdminOrder }>(`/admin/orders/${id}/status`, body),
  setShipping: (
    id: string,
    body: { shippingStatus?: ShippingStatus; trackingNumber?: string; shippingCarrier?: string },
  ) => api.patch<{ order: AdminOrder }>(`/admin/orders/${id}/shipping`, body),
}

// ---------- consultation requests ----------

export interface ConsultRequest {
  id: string
  fullName: string
  age: number | null
  gender: string | null
  country: string
  phone: string
  whatsApp: string
  email: string
  consultationTopic: string
  notes: string | null
  childAge: string | null
  relation: string | null
  sessionType: string | null
  preferredTime: string | null
  status: ConsultStatus
  scheduledAt: string | null
  adminNotes: string | null
  createdAt: string
  category: { id: string; nameAr: string } | null
}

export const adminConsultApi = {
  list: (q: { page?: number; limit?: number; status?: ConsultStatus; search?: string }) =>
    api.get<{ requests: ConsultRequest[]; pagination: Pagination }>('/admin/consultations', { params: q }),
  update: (
    id: string,
    body: { status?: ConsultStatus; scheduledAt?: string | null; adminNotes?: string | null },
  ) => api.patch<{ request: ConsultRequest }>(`/admin/consultations/${id}`, body),
}

// ---------- students ----------

export interface Student {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  gender: Gender | null
  profileImage: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  coursesCount: number
  ordersCount: number
  totalPaidEGP: number
}

export interface StudentDetails extends Student {
  courses: { courseId: string; titleAr: string; purchasedAt: string; completionPercentage: number }[]
  recentOrders: {
    id: string
    orderNumber: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    totalAmount: number
    createdAt: string
  }[]
}

export interface NewStudent {
  fullName: string
  email: string
  phoneNumber: string
  password?: string
  gender?: Gender
  courseIds?: string[]
}

export const studentsApi = {
  list: (q: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get<{ items: Student[]; newThisMonth: number; pagination: Pagination }>('/admin/students', {
      params: q,
    }),
  get: (id: string) => api.get<{ student: StudentDetails }>(`/admin/students/${id}`),
  create: (body: NewStudent) =>
    api.post<{ student: Student; temporaryPassword: string }>('/admin/students', body),
  setActive: (id: string, isActive: boolean) => api.patch(`/admin/students/${id}`, { isActive }),
  grantCourses: (id: string, courseIds: string[]) =>
    api.post<{ granted: number; alreadyOwned: number }>(`/admin/students/${id}/courses`, { courseIds }),
}

// ---------- courses ----------

export interface CourseInput {
  categoryId: string
  titleAr: string
  titleEn: string
  shortDescriptionAr: string
  shortDescriptionEn: string
  descriptionAr: string
  descriptionEn: string
  promoVideoUrl?: string
  priceEGP: number
  priceUSD: number
  discountPriceEGP?: number | null
  discountPriceUSD?: number | null
  certificateEnabled?: boolean
  isFeatured?: boolean
  isHomeDisplay?: boolean
  isActive?: boolean
}

export interface LessonPatch {
  titleAr?: string
  titleEn?: string
  isPreview?: boolean
  isActive?: boolean
  displayOrder?: number
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

export const adminCoursesApi = {
  list: (q: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<{ courses: CourseSummary[]; pagination: Pagination }>('/admin/courses', {
      params: { limit: 100, ...q },
    }),
  get: (id: string) => api.get<Course>(`/admin/courses/${id}`),
  categories: () => api.get<{ id: string; nameAr: string; isActive: boolean }[]>('/admin/course-categories'),
  create: (body: CourseInput) => api.post<{ course: Course }>('/admin/courses', body),
  update: (id: string, body: Partial<CourseInput>) =>
    api.patch<{ course: Course }>(`/admin/courses/${id}`, body),
  remove: (id: string) => api.delete(`/admin/courses/${id}`),
  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData()
    form.append('thumbnailImage', file)
    return api.post<{ course: Course }>(`/admin/courses/${id}/thumbnail`, form, multipart)
  },
  addSection: (courseId: string, body: { titleAr: string; titleEn: string; displayOrder: number }) =>
    api.post(`/admin/courses/${courseId}/sections`, body),
  updateSection: (id: string, body: { titleAr?: string; titleEn?: string; isActive?: boolean }) =>
    api.patch(`/admin/sections/${id}`, body),
  removeSection: (id: string) => api.delete(`/admin/sections/${id}`),
  addLesson: (
    sectionId: string,
    input: {
      titleAr: string
      titleEn: string
      displayOrder: number
      isPreview: boolean
      durationSeconds?: number
    },
    files: { video?: File; pdf?: File },
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData()
    form.append('titleAr', input.titleAr)
    form.append('titleEn', input.titleEn)
    form.append('displayOrder', String(input.displayOrder))
    form.append('isPreview', String(input.isPreview))
    if (input.durationSeconds) form.append('videoDurationSeconds', String(Math.round(input.durationSeconds)))
    if (files.video) form.append('video', files.video)
    if (files.pdf) form.append('pdf', files.pdf)
    return api.post(`/admin/sections/${sectionId}/lessons/upload`, form, {
      ...multipart,
      timeout: 0,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
  },
  updateLesson: (id: string, body: LessonPatch) => api.patch(`/admin/lessons/${id}`, body),
  replaceLessonMedia: (
    id: string,
    files: { video?: File; pdf?: File },
    durationSeconds?: number,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData()
    if (files.video) form.append('video', files.video)
    if (files.pdf) form.append('pdf', files.pdf)
    if (durationSeconds) form.append('videoDurationSeconds', String(Math.round(durationSeconds)))
    return api.post(`/admin/lessons/${id}/media`, form, {
      ...multipart,
      timeout: 0,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
  },
  removeLesson: (id: string) => api.delete(`/admin/lessons/${id}`),
}

// ---------- catalog: books, products, articles ----------

type FormValue = string | number | boolean | null | undefined | File | string[]

/** Multipart body from a plain object; empty values are left out, arrays repeat the key. */
export function toFormData(fields: Record<string, FormValue>) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => form.append(k, x))
    else form.append(k, v instanceof File ? v : String(v))
  }
  return form
}

export interface NamedCategory {
  id: string
  nameAr: string
  nameEn: string
  isActive?: boolean
  shippingCost?: number
}

export interface AdminBookFormat {
  id: string
  formatType: 'Physical' | 'Digital' | 'Audio'
  sku?: string | null
  stock?: number | null
  weight?: number | null
  priceEGP?: number | null
  discountPriceEGP?: number | null
  priceUSD?: number | null
  discountPriceUSD?: number | null
  audioDuration?: number | null
  isActive: boolean
  hasReaderFile?: boolean
  hasAudioFile?: boolean
}

export interface AdminBook {
  id: string
  categoryId: string
  slug: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  coverImage: string | null
  priceEGP: number
  discountPriceEGP: number | null
  priceUSD: number
  discountPriceUSD: number | null
  isFeatured: boolean
  isHomeDisplay: boolean
  isActive: boolean
  formats?: AdminBookFormat[]
  category?: NamedCategory | null
}

export interface AdminProduct {
  id: string
  categoryId: string
  slug: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  coverImage: string | null
  priceEGP: number
  discountPriceEGP: number | null
  priceUSD: number
  discountPriceUSD: number | null
  stock: number
  sku: string | null
  isFeatured: boolean
  isHomeDisplay: boolean
  isActive?: boolean
  category?: NamedCategory | null
}

export interface AdminArticle {
  id: string
  categoryId: string
  slug: string
  titleAr: string
  titleEn: string
  shortContentAr: string
  shortContentEn: string
  contentAr: string
  contentEn: string
  coverImage: string | null
  isFeatured: boolean
  isHomeDisplay: boolean
  isActive: boolean
  publishedAt?: string | null
  createdAt: string
  category?: NamedCategory | null
  tags?: { id: string; nameAr: string }[]
}

export const catalogApi = {
  books: () => api.get<AdminBook[]>('/books'),
  book: (id: string) => api.get<AdminBook>(`/books/${id}`),
  bookCategories: () => api.get<NamedCategory[]>('/book-categories'),
  createBook: (fields: Record<string, FormValue>) =>
    api.post<AdminBook>('/books', toFormData(fields), multipart),
  updateBook: (id: string, fields: Record<string, FormValue>) =>
    api.patch<AdminBook>(`/books/${id}`, toFormData(fields), multipart),
  addFormat: (bookId: string, fields: Record<string, FormValue>) =>
    api.post(`/books/${bookId}/formats`, toFormData(fields), { ...multipart, timeout: 0 }),
  updateFormat: (formatId: string, fields: Record<string, FormValue>) =>
    api.patch(`/books/formats/${formatId}`, toFormData(fields), { ...multipart, timeout: 0 }),
  removeFormat: (formatId: string) => api.delete(`/books/formats/${formatId}`),

  products: () =>
    api.get<{ products: AdminProduct[]; pagination: Pagination }>('/admin/products', {
      params: { limit: 100 },
    }),
  productCategories: () => api.get<NamedCategory[]>('/admin/product-categories'),
  createProduct: (fields: Record<string, FormValue>) =>
    api.post<{ product: AdminProduct }>('/admin/products', toFormData(fields), multipart),
  updateProduct: (id: string, fields: Record<string, FormValue>) =>
    api.patch<{ product: AdminProduct }>(`/admin/products/${id}`, toFormData(fields), multipart),

  articles: () =>
    api.get<{ articles: AdminArticle[]; pagination: Pagination }>('/admin/articles', {
      params: { limit: 100 },
    }),
  articleCategories: () => api.get<NamedCategory[]>('/admin/article-categories'),
  articleTags: () => api.get<NamedCategory[]>('/admin/article-tags'),
  createArticle: (fields: Record<string, FormValue>) =>
    api.post<{ article: AdminArticle }>('/admin/articles', toFormData(fields), multipart),
  updateArticle: (id: string, fields: Record<string, FormValue>) =>
    api.patch<{ article: AdminArticle }>(`/admin/articles/${id}`, toFormData(fields), multipart),
  removeArticle: (id: string) => api.delete(`/admin/articles/${id}`),
}

// ---------- course reviews ----------

export type AdminReview = CourseReview & {
  user: { id: string; fullName: string; email: string; phoneNumber?: string | null } | null
  course: { id: string; titleAr: string }
}

export const adminReviewsApi = {
  list: (params: { page?: number; limit?: number; courseId?: string; isActive?: boolean; rating?: number }) =>
    api.get<{ reviews: AdminReview[]; pagination: Pagination }>('/admin/course-reviews', { params }),
  setActive: (id: string, isActive: boolean) =>
    api.patch<{ review: AdminReview }>(`/admin/course-reviews/${id}`, { isActive }),
}
