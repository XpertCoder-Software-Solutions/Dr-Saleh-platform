import type {
  Book,
  Category,
  Course,
  CourseListData,
  CourseReview,
  CourseReviewListData,
  CourseSummary,
  Gender,
  LoginData,
  Pagination,
  RegisterData,
} from '@/types/api'
import { api } from './client'

// ---------- auth ----------

export interface RegisterInput {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  gender?: Gender
  referralCode?: string
}

export const authApi = {
  login: (input: { email: string; password: string }) => api.post<LoginData>('/auth/login', input),
  register: (input: RegisterInput) => api.post<RegisterData>('/auth/register', input),
  verifyEmail: (input: { email: string; otp: string }) =>
    api.post<Record<string, never>>('/auth/verify-email', input),
  resendVerification: (email: string) =>
    api.post<Record<string, never>>('/auth/resend-email-verification', { email }),
  forgotPassword: (email: string) => api.post<Record<string, never>>('/auth/forgot-password', { email }),
  /** Step 2 of forgot-password: checks the emailed code, returns a token for step 3. */
  verifyResetOtp: (input: { email: string; otp: string }) =>
    api.post<{ resetToken: string; expiresInSeconds: number }>('/auth/verify-reset-otp', input),
  resetPassword: (input: { email: string; resetToken: string; newPassword: string }) =>
    api.post<Record<string, never>>('/auth/reset-password', input),
  logout: () => api.post<Record<string, never>>('/auth/logout'),
}

/** GET /users/profile (note: first/last name and `phone`, not fullName/phoneNumber). */
export interface Profile {
  id: string
  firstName: string
  lastName?: string | null
  email: string
  phone: string
  profileImage?: string | null
  gender?: Gender | null
  dateOfBirth?: string | null
  emailVerifiedAt?: string | null
  role: string
  isActive: boolean
  createdAt: string
}

export const usersApi = {
  profile: () => api.get<Profile>('/users/profile'),
}

// ---------- courses ----------

export interface CourseQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isFeatured?: boolean
}

export const coursesApi = {
  list: (query: CourseQuery) => api.get<CourseListData>('/courses', { params: query }),
  home: () => api.get<CourseSummary[]>('/courses/home'),
  featured: () => api.get<CourseSummary[]>('/courses/featured'),
  categories: () => api.get<Category[]>('/courses/categories'),
  byId: (id: string) => api.get<Course>(`/courses/${id}`),
  reviews: (courseId: string, page = 1, limit = 10) =>
    api.get<CourseReviewListData>(`/courses/${courseId}/reviews`, { params: { page, limit } }),
  /** Best recent reviews across all courses, for the home page. */
  featuredReviews: (limit = 6) =>
    api.get<{ reviews: FeaturedReview[] }>('/course-reviews/featured', { params: { limit } }),
}

export type FeaturedReview = CourseReview & { course: { id: string; titleAr: string } }

// ---------- library ----------

export interface NamedCategory {
  id: string
  name?: string
  nameAr: string
  nameEn?: string
}

export const booksApi = {
  /** Returns every book (the endpoint is shared with admin); filter isActive on the client. */
  list: () => api.get<Book[]>('/books'),
  bySlug: (slug: string) => api.get<Book>(`/books/slug/${encodeURIComponent(slug)}`),
  categories: () => api.get<NamedCategory[]>('/book-categories'),
}

// ---------- store ----------

/** Product as returned by the public endpoints with lang=ar (name/description localized). */
export interface StoreProduct {
  id: string
  name: string
  description: string
  slug: string
  coverImage?: string | null
  priceEGP: number
  discountPriceEGP?: number | null
  priceUSD: number
  discountPriceUSD?: number | null
  stock: number
  sku?: string | null
  isFeatured: boolean
  isHomeDisplay: boolean
  category?: NamedCategory | null
  images?: { id: string; imageUrl: string; displayOrder: number }[]
  createdAt: string
}

export interface ProductQuery {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
  isHomeDisplay?: boolean
  isFeatured?: boolean
}

export const productsApi = {
  list: (query: ProductQuery) =>
    api.get<{ products: StoreProduct[]; pagination: Pagination }>('/products', {
      params: { lang: 'ar', ...query },
    }),
  bySlug: (slug: string) =>
    api.get<StoreProduct>(`/products/slug/${encodeURIComponent(slug)}`, { params: { lang: 'ar' } }),
  categories: () => api.get<NamedCategory[]>('/product-categories', { params: { lang: 'ar' } }),
}

// ---------- articles ----------

export interface ArticleSummary {
  id: string
  slug: string
  title: string
  shortContent?: string | null
  content?: string | null
  coverImage?: string | null
  viewsCount?: number
  isFeatured?: boolean
  createdAt: string
  category?: { id: string; name: string } | null
  tags?: { id: string; name: string }[]
}

export interface ArticleQuery {
  page?: number
  limit?: number
  categoryId?: string
  tagId?: string
  search?: string
  isFeatured?: boolean
}

export const articlesApi = {
  list: (query: ArticleQuery) =>
    api.get<{ articles: ArticleSummary[]; pagination: Pagination }>('/articles', {
      params: { lang: 'ar', ...query },
    }),
  bySlug: (slug: string) =>
    api.get<ArticleSummary>(`/articles/slug/${encodeURIComponent(slug)}`, { params: { lang: 'ar' } }),
  categories: () => api.get<NamedCategory[]>('/article-categories', { params: { lang: 'ar' } }),
  tags: () => api.get<NamedCategory[]>('/article-tags', { params: { lang: 'ar' } }),
}

// ---------- consultations & contact ----------

export interface ConsultationRequestInput {
  categoryId: string
  fullName: string
  email: string
  phone: string
  whatsApp: string
  country: string
  consultationTopic: string
  notes?: string
  age?: number
  gender?: Gender
  childAge?: string
  relation?: string
  sessionType?: string
  preferredTime?: string
}

export const consultationsApi = {
  categories: () => api.get<NamedCategory[]>('/consultation-categories', { params: { lang: 'ar' } }),
  submit: (input: ConsultationRequestInput) => api.post<Record<string, never>>('/consultations', input),
}

export const contactApi = {
  submit: (input: { name: string; email: string; phone: string; message: string }) =>
    api.post<Record<string, never>>('/contact-us', input),
}

// ---------- certificates ----------

export interface CertificateVerification {
  certificateNumber: string
  issuedAt: string
  holderName: string
  course: { id: string; titleAr: string; titleEn: string }
}

export const certificatesApi = {
  verify: (number: string) =>
    api.get<CertificateVerification>(`/certificates/verify/${encodeURIComponent(number)}`),
}
