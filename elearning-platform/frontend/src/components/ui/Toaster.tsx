import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToasterState {
  toasts: Toast[]
}

class ToastManager {
  private listeners: Array<(toasts: Toast[]) => void> = []
  private toasts: Toast[] = []

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private emit() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    }

    this.toasts.push(newToast)
    this.emit()

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id)
    }, newToast.duration)
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.emit()
  }

  clear() {
    this.toasts = []
    this.emit()
  }
}

export const toastManager = new ToastManager()

// Helper functions
export const toast = {
  success: (title: string, message?: string) => 
    toastManager.add({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    toastManager.add({ type: 'error', title, message }),
  warning: (title: string, message?: string) => 
    toastManager.add({ type: 'warning', title, message }),
  info: (title: string, message?: string) => 
    toastManager.add({ type: 'info', title, message }),
}

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  const iconClass = "h-5 w-5"
  
  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />
    case 'error':
      return <XCircleIcon className={`${iconClass} text-red-500`} />
    case 'warning':
      return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />
    case 'info':
      return <InformationCircleIcon className={`${iconClass} text-blue-500`} />
    default:
      return null
  }
}

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className={`${bgColor[toast.type]} border rounded-lg p-4 shadow-sm animate-slide-down`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ToastIcon type={toast.type} />
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            onClick={() => onRemove(toast.id)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts)
    return unsubscribe
  }, [])

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={toastManager.remove.bind(toastManager)}
        />
      ))}
    </div>
  )
}