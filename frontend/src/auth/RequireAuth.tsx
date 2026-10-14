import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { routes } from '@/app/routes'
import { Spinner } from '@/components/ui/States'
import { useAuth } from './hooks'

/** Sends guests to login and brings them back to this page afterwards. */
export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-30 text-blue-600">
        <Spinner />
      </div>
    )
  }
  if (!user) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname + location.search }} />
  }
  if (admin && user.role !== 'Admin') return <Navigate to={routes.home} replace />
  return <>{children}</>
}
