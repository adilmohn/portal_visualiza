import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ProtectedRouteProps {
  requiredRole?: UserRole
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/area" replace />
  }

  return <Outlet />
}
