import '@testing-library/jest-dom'
import { beforeAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

// Mock environment variables
beforeAll(() => {
  process.env.VITE_API_URL = 'http://localhost:3001/api'
  process.env.VITE_APP_NAME = 'ELearning Platform'
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})