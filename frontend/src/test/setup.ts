import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:3001',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock_key',
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () => <div>Outlet</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock react-query
vi.mock('react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useMutation: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock zustand
vi.mock('zustand', () => ({
  create: () => () => ({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    setAuth: vi.fn(),
    updateUser: vi.fn(),
    clearAuth: vi.fn(),
    setLoading: vi.fn(),
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
  },
}))