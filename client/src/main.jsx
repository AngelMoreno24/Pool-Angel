import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import { AuthContextProvider } from './context/AuthContext'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// staleTime: how long fetched data is considered "fresh" before React Query
// will refetch it in the background. 60 seconds is a reasonable default for
// data like customers/techs that doesn't change every second - tune per
// query later if some data needs to feel more real-time.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <QueryClientProvider client={queryClient}>

        <RouterProvider router={router} />    
      </QueryClientProvider>

    </AuthContextProvider>
  </StrictMode>,
)
