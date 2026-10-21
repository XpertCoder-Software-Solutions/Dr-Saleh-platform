import '@/styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiClientError } from '@/api/client'
import { AuthProvider } from '@/auth/AuthContext'
import { router } from '@/app/router'
import { Toaster } from '@/components/ui/Toaster'
import { ConfirmHost } from '@/components/ui/ConfirmHost'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (404, 403…); retry network/server errors twice.
      retry: (count, error) =>
        !(error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) && count < 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
        <ConfirmHost />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
