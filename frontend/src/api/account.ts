import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/hooks'
import type { Course, CourseProgress, CourseSummary, Gender, Lesson, Pagination } from '@/types/api'
import { api } from './client'
import type { Profile } from './endpoints'
import type { WishlistItemType } from './wishlist'

// Every account query key starts with 'me' so logout clears them all.
export const accountKeys = {
  courses: ['me', 'courses'] as const,
  course: (id: string) => ['me', 'courses', id] as const,
  progress: (id: string) => ['me', 'courses', id, 'progress'] as const,
  books: ['me', 'books'] as const,
  certificates: ['me', 'certificates'] as const,
  orders: ['me', 'orders'] as const,
  wishlistAll: ['me', 'wishlist', 'all'] as const,
  consultations: ['me', 'consultations'] as const,
  referralCode: ['me', 'referral', 'code'] as const,
  referrals: ['me', 'referral', 'list'] as const,
  profile: ['me', 'profile'] as const,
}

// ---------- courses ----------

export interface Enrollment {
  id: string
  courseId: string
  purchasedAt: string
  startedAt: string | null
  completedAt: string | null
  completionPercentage: number
  updatedAt: string
  course: CourseSummary
}

export interface ContinueLesson {
  lessonId: string
  sectionId: string
  lessonType: Lesson['lessonType']
  titleAr: string
  titleEn?: string
  completionPercentage: number
}

export interface SignedUrl {
  url: string
  expiresAt: string
}

export const myCoursesApi = {
  list: () => api.get<Enrollment[]>('/my-courses'),
  get: (courseId: string) => api.get<Course>(`/my-courses/${courseId}`),
  progress: (courseId: string) => api.get<CourseProgress>(`/my-courses/${courseId}/progress`),
  continue: (courseId: string) => api.get<ContinueLesson | null>(`/my-courses/${courseId}/continue`),
  videoUrl: (courseId: string, lessonId: string) =>
    api.get<SignedUrl>(`/my-courses/${courseId}/lessons/${lessonId}/video-url`),
  pdfUrl: (courseId: string, lessonId: string) =>
    api.get<SignedUrl>(`/my-courses/${courseId}/lessons/${lessonId}/pdf-url`),
  saveProgress: (
    lessonId: string,
    body: { completionPercentage: number; watchedSeconds?: number; isCompleted?: boolean },
  ) => api.patch(`/my-courses/lessons/${lessonId}/progress`, body),
}

// ---------- books ----------

export type DigitalFormat = 'Digital' | 'Audio'

export interface OwnedBook {
  id: string
  purchasedAt: string
  bookFormatId: string
  formatType: DigitalFormat
  audioDuration: number | null
  hasFile: boolean
  isAvailable: boolean
  book: {
    id: string
    slug: string
    titleAr: string
    titleEn?: string
    coverImage: string | null
    isActive: boolean
  }
}

export const myBooksApi = {
  list: () => api.get<{ items: OwnedBook[] }>('/my-books'),
  digitalUrl: (formatId: string) => api.get<SignedUrl>(`/my-books/${formatId}/digital-url`),
  audioUrl: (formatId: string) => api.get<SignedUrl>(`/my-books/${formatId}/audio-url`),
}

// ---------- certificates ----------

export interface MyCertificate {
  id: string
  courseId: string
  certificateNumber: string
  issuedAt: string
  user: { fullName: string }
  course: CourseSummary
}

export const certificatesMeApi = {
  list: () => api.get<MyCertificate[]>('/my-certificates'),
  signedUrl: (courseId: string) => api.get<SignedUrl>(`/my-certificates/${courseId}/signed-url`),
}

// ---------- wishlist (full rows with item details) ----------

export interface WishlistRow {
  id: string
  itemType: WishlistItemType
  itemId: string
  createdAt: string
  item: {
    id: string
    itemType: WishlistItemType
    slug?: string
    nameAr: string
    nameEn?: string
    image: string | null
    priceEGP: number
    discountPriceEGP: number | null
    stock?: number | null
    isActive: boolean
  } | null
}

export const wishlistApi = {
  list: () =>
    api.get<{ items: WishlistRow[]; pagination: Pagination }>('/wishlist', { params: { limit: 100 } }),
  remove: (id: string) => api.delete(`/wishlist/${id}`),
}

// ---------- consultations ----------

export type ConsultStatus = 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface MyConsultation {
  id: string
  consultationTopic: string
  sessionType: string | null
  preferredTime: string | null
  status: ConsultStatus
  scheduledAt: string | null
  createdAt: string
  updatedAt?: string | null
  category: { id: string; nameAr: string; nameEn?: string } | null
}

export const myConsultationsApi = {
  list: () => api.get<{ items: MyConsultation[] }>('/consultations/mine'),
}

// ---------- referrals ----------

export interface ReferralRow {
  id: string
  isRewarded: boolean
  rewardedAt: string | null
  createdAt: string
  referredUser?: { fullName?: string; firstName?: string | null } | null
  rewardCoupon: {
    code: string
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    expiresAt: string
  } | null
}

export const referralsApi = {
  myCode: () => api.get<{ referral: { referralCode: string } }>('/referrals/my-code'),
  mine: () =>
    api.get<{ items: ReferralRow[]; pagination: Pagination }>('/referrals/my-referrals', {
      params: { limit: 50 },
    }),
}

// ---------- profile ----------

export interface ProfileUpdate {
  firstName?: string
  lastName?: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
}

export const profileApi = {
  get: () => api.get<Profile>('/users/profile'),
  update: (body: ProfileUpdate) => api.patch<Profile>('/users/profile', body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', body),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('profileImage', file)
    return api.post<Profile>('/users/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  removeImage: () => api.delete('/users/profile-image'),
}

// ---------- shared hooks (the sidebar badges and the pages read the same cache) ----------

export function useMyCourses() {
  const { user } = useAuth()
  return useQuery({ queryKey: accountKeys.courses, queryFn: myCoursesApi.list, enabled: Boolean(user) })
}

export function useMyBooks() {
  const { user } = useAuth()
  return useQuery({ queryKey: accountKeys.books, queryFn: myBooksApi.list, enabled: Boolean(user) })
}

export function useMyCertificates() {
  const { user } = useAuth()
  return useQuery({
    queryKey: accountKeys.certificates,
    queryFn: certificatesMeApi.list,
    enabled: Boolean(user),
  })
}

export function useWishlistAll() {
  const { user } = useAuth()
  return useQuery({ queryKey: accountKeys.wishlistAll, queryFn: wishlistApi.list, enabled: Boolean(user) })
}

export function useMyConsultations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: accountKeys.consultations,
    queryFn: myConsultationsApi.list,
    enabled: Boolean(user),
  })
}
