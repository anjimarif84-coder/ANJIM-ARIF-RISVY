import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { vi } from 'vitest'
import Login from '../pages/Login'
import { useAuthStore } from '../stores/authStore'

// Mock the auth store
vi.mock('../stores/authStore')

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Login Page', () => {
  const mockLogin = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      login: mockLogin,
    })

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })
  })

  it('renders login form', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  it('calls login function with correct data', async () => {
    mockLogin.mockResolvedValueOnce({})

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  it('has link to signup page', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const signupLink = screen.getByRole('link', { name: /create a new account/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})