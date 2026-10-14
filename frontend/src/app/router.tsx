import type React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { SiteLayout } from './Layout'
import { RequireAuth } from '@/auth/RequireAuth'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminLayout } from '@/components/admin/AdminLayout'

// Pages from the design that come in the next phases.

// Account pages (each its own chunk), all behind login.
const accountPages = {
  DashboardPage: () => import('@/pages/account/DashboardPage'),
  MyCoursesPage: () => import('@/pages/account/MyCoursesPage'),
  PlayerPage: () => import('@/pages/account/PlayerPage'),
  MyBooksPage: () => import('@/pages/account/MyBooksPage'),
  ReaderPage: () => import('@/pages/account/ReaderPage'),
  CertificatePrintPage: () => import('@/pages/account/CertificatePrintPage'),
  InvoicePage: () => import('@/pages/account/InvoicePage'),
  NotificationsPage: () => import('@/pages/account/NotificationsPage'),
  CertificatesPage: () => import('@/pages/account/CertificatesPage'),
  OrdersPage: () => import('@/pages/account/OrdersPage'),
  WishlistPage: () => import('@/pages/account/WishlistPage'),
  MyConsultationsPage: () => import('@/pages/account/MyConsultationsPage'),
  ReferralPage: () => import('@/pages/account/ReferralPage'),
  ProfilePage: () => import('@/pages/account/ProfilePage'),
}
const account = (name: keyof typeof accountPages) => authPage(accountPages[name], name)

// Admin pages render inside <AdminLayout> (its own sidebar, no site header).
const adminPages = {
  AdminDashboardPage: () => import('@/pages/admin/AdminDashboardPage'),
  AdminOrdersPage: () => import('@/pages/admin/AdminOrdersPage'),
  AdminConsultRequestsPage: () => import('@/pages/admin/AdminConsultRequestsPage'),
  AdminSchedulePage: () => import('@/pages/admin/AdminSchedulePage'),
  AdminUsersPage: () => import('@/pages/admin/AdminUsersPage'),
  AdminCoursesPage: () => import('@/pages/admin/AdminCoursesPage'),
  AdminCourseEditPage: () => import('@/pages/admin/AdminCourseEditPage'),
  AdminCatalogPage: () => import('@/pages/admin/AdminCatalogPage'),
  AdminBlogPage: () => import('@/pages/admin/AdminBlogPage'),
  AdminReviewsPage: () => import('@/pages/admin/AdminReviewsPage'),
  AdminSettingsPage: () => import('@/pages/admin/AdminSettingsPage'),
}
const admin = (name: keyof typeof adminPages) => page(adminPages[name], name)

/** Lazy route: the page's module is fetched on first visit. */
function page(load: () => Promise<Record<string, unknown>>, name: string) {
  return async () => ({ Component: (await load())[name] as React.ComponentType })
}

/** Lazy route that needs a signed-in user. */
function authPage(load: () => Promise<Record<string, unknown>>, name: string) {
  return async () => {
    const Page = (await load())[name] as React.ComponentType
    return {
      Component: () => (
        <RequireAuth>
          <Page />
        </RequireAuth>
      ),
    }
  }
}

// Home loads with the app; every other page is its own chunk, fetched on first visit.
export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'courses',
        lazy: async () => ({ Component: (await import('@/pages/courses/CoursesPage')).CoursesPage }),
      },
      {
        path: 'courses/:id',
        lazy: async () => ({
          Component: (await import('@/pages/courses/CourseDetailsPage')).CourseDetailsPage,
        }),
      },
      { path: 'library', lazy: page(() => import('@/pages/library/LibraryPage'), 'LibraryPage') },
      {
        path: 'library/:slug',
        lazy: page(() => import('@/pages/library/BookDetailsPage'), 'BookDetailsPage'),
      },
      { path: 'store', lazy: page(() => import('@/pages/store/StorePage'), 'StorePage') },
      {
        path: 'store/:slug',
        lazy: page(() => import('@/pages/store/ProductDetailsPage'), 'ProductDetailsPage'),
      },
      { path: 'blog', lazy: page(() => import('@/pages/blog/BlogPage'), 'BlogPage') },
      { path: 'blog/:slug', lazy: page(() => import('@/pages/blog/ArticlePage'), 'ArticlePage') },
      {
        path: 'consultation',
        lazy: page(() => import('@/pages/consultation/ConsultationPage'), 'ConsultationPage'),
      },
      {
        path: 'consultation/request',
        lazy: page(() => import('@/pages/consultation/ConsultRequestPage'), 'ConsultRequestPage'),
      },
      { path: 'contact', lazy: page(() => import('@/pages/contact/ContactPage'), 'ContactPage') },
      { path: 'about', lazy: page(() => import('@/pages/about/AboutPage'), 'AboutPage') },
      { path: 'search', lazy: page(() => import('@/pages/search/SearchPage'), 'SearchPage') },
      {
        path: 'certificates/verify',
        lazy: page(() => import('@/pages/certificates/VerifyCertificatePage'), 'VerifyCertificatePage'),
      },
      { path: 'legal/:doc', lazy: page(() => import('@/pages/legal/LegalPage'), 'LegalPage') },
      { path: 'cart', lazy: authPage(() => import('@/pages/checkout/CartPage'), 'CartPage') },
      { path: 'checkout', lazy: authPage(() => import('@/pages/checkout/CheckoutPage'), 'CheckoutPage') },
      { path: 'checkout/pay/:orderId', lazy: authPage(() => import('@/pages/checkout/PayPage'), 'PayPage') },
      { path: 'checkout/result', lazy: authPage(() => import('@/pages/checkout/ResultPage'), 'ResultPage') },
      { path: 'account', lazy: account('DashboardPage') },
      { path: 'account/courses', lazy: account('MyCoursesPage') },
      { path: 'account/books', lazy: account('MyBooksPage') },
      { path: 'account/certificates', lazy: account('CertificatesPage') },
      { path: 'account/orders', lazy: account('OrdersPage') },
      { path: 'account/wishlist', lazy: account('WishlistPage') },
      { path: 'account/consultations', lazy: account('MyConsultationsPage') },
      { path: 'account/notifications', lazy: account('NotificationsPage') },
      { path: 'account/referral', lazy: account('ReferralPage') },
      { path: 'account/profile', lazy: account('ProfilePage') },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: (
      <RequireAuth admin>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, lazy: admin('AdminDashboardPage') },
      { path: 'orders', lazy: admin('AdminOrdersPage') },
      { path: 'consult-requests', lazy: admin('AdminConsultRequestsPage') },
      { path: 'schedule', lazy: admin('AdminSchedulePage') },
      { path: 'users', lazy: admin('AdminUsersPage') },
      { path: 'courses', lazy: admin('AdminCoursesPage') },
      { path: 'courses/:id', lazy: admin('AdminCourseEditPage') },
      { path: 'catalog', lazy: admin('AdminCatalogPage') },
      { path: 'blog', lazy: admin('AdminBlogPage') },
      { path: 'reviews', lazy: admin('AdminReviewsPage') },
      { path: 'settings', lazy: admin('AdminSettingsPage') },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Full-screen learning views (no site header/footer).
  { path: 'learn/:courseId', lazy: account('PlayerPage') },
  { path: 'read/:formatId', lazy: account('ReaderPage') },
  { path: 'certificate/:id', lazy: account('CertificatePrintPage') },
  { path: 'invoice/:orderId', lazy: account('InvoicePage') },
  { path: 'login', lazy: async () => ({ Component: (await import('@/pages/auth/LoginPage')).LoginPage }) },
  {
    path: 'register',
    lazy: async () => ({ Component: (await import('@/pages/auth/RegisterPage')).RegisterPage }),
  },
  {
    path: 'verify-email',
    lazy: async () => ({ Component: (await import('@/pages/auth/VerifyEmailPage')).VerifyEmailPage }),
  },
  {
    path: 'forgot-password',
    lazy: async () => ({ Component: (await import('@/pages/auth/ForgotPasswordPage')).ForgotPasswordPage }),
  },
])
