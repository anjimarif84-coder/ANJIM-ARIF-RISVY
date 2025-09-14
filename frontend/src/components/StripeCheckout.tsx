import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { X, CreditCard, Lock } from 'lucide-react'
import { apiClient } from '../lib/api'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  courseId: string
  onClose: () => void
}

const CheckoutForm: React.FC<{ courseId: string; onClose: () => void }> = ({ courseId, onClose }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Create payment intent
      const { data } = await apiClient.post<{
        success: boolean
        data: { clientSecret: string; sessionId: string }
      }>('/payments/create-payment-intent', {
        courseId,
        successUrl: `${window.location.origin}/courses/${courseId}?payment=success`,
        cancelUrl: `${window.location.origin}/courses/${courseId}?payment=cancelled`,
      })

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
      } else {
        toast.success('Payment successful! You are now enrolled.')
        onClose()
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label">Card Information</label>
        <div className="border border-gray-300 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center text-sm text-gray-500">
        <Lock className="w-4 h-4 mr-2" />
        Your payment information is secure and encrypted
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="btn-primary flex-1 flex items-center justify-center"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </form>
  )
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ courseId, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Complete Your Purchase</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm courseId={courseId} onClose={onClose} />
        </Elements>
      </div>
    </div>
  )
}