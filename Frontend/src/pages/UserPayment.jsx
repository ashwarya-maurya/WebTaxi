import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RideDataContext } from '../context/RideContext'
import { SocketDataContext } from '../context/SocketContext'
import api from '../services/api'

const UserPayment = () => {
  const { ride, resetRide, setActiveRide } = useContext(RideDataContext)
  const { getSocket } = useContext(SocketDataContext)
  const navigate = useNavigate()
  const activeRide = ride.activeRide

  const [method, setMethod] = useState('upi')
  const [isLoading, setIsLoading] = useState(!activeRide.rideId)
  const [paymentMessage, setPaymentMessage] = useState('')

  const finishPaymentFlow = useCallback(() => {
    resetRide()
    navigate('/home', { replace: true })
  }, [navigate, resetRide])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handlePaymentConfirmed = (data) => {
      if (activeRide.rideId && String(data?.rideId) !== String(activeRide.rideId)) return
      finishPaymentFlow()
    }

    socket.on('payment-confirmed', handlePaymentConfirmed)
    return () => socket.off('payment-confirmed', handlePaymentConfirmed)
  }, [activeRide.rideId, finishPaymentFlow, getSocket])

  useEffect(() => {
    if (activeRide.rideId) return

    let isCurrent = true

    api.get('/rides/current')
      .then((response) => {
        if (!isCurrent) return

        const currentRide = response.data.ride
        if (!currentRide || currentRide.paymentStatus === 'paid') {
          finishPaymentFlow()
          return
        }

        setActiveRide(currentRide)
        if (currentRide.status !== 'completed') {
          navigate('/riding', { replace: true })
          return
        }

        setIsLoading(false)
      })
      .catch(() => {
        if (isCurrent) {
          setPaymentMessage('Could not restore the completed ride. Please try again.')
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [activeRide.rideId, finishPaymentFlow, navigate, setActiveRide])

  const handlePay = () => {
    setPaymentMessage(
      method === 'upi'
        ? 'Payment submitted. Waiting for the captain to confirm receipt.'
        : 'Card payments are not connected yet. Please arrange payment with the captain.'
    )
  }

  if (isLoading) {
    return <div className='h-screen flex items-center justify-center'><p>Loading payment details...</p></div>
  }

  return (
    <div className='min-h-screen w-full bg-webtaxi-canvas text-webtaxi-ink flex flex-col'>
      <div className='flex-1 p-6 flex flex-col justify-between'>
        <div>
          <button type='button' onClick={finishPaymentFlow} aria-label='Return home' className='fixed right-5 top-7 inline-flex items-center justify-center h-10 w-10 rounded-full bg-webtaxi-sand text-user-primary'>
            <i className='ri-arrow-right-line text-xl'></i>
          </button>

          <h2 className='text-3xl font-bold text-webtaxi-ink mb-1'>Payment</h2>
          <p className='text-sm text-webtaxi-charcoal/70 mb-6'>Complete your ride payment securely</p>

          <div className='bg-webtaxi-sand p-5 rounded-2xl mb-6 flex justify-between items-center'>
            <div>
              <h3 className='font-semibold text-webtaxi-ink'>Trip Fare</h3>
              <p className='text-sm text-webtaxi-charcoal/70 mt-1'>{activeRide.pickup || 'Pickup'} → {activeRide.destination || 'Destination'}</p>
            </div>
            <div className='text-right'>
              <h3 className='text-3xl font-bold text-webtaxi-ink'>{activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}</h3>
              <p className='text-xs text-webtaxi-charcoal/70'>Total</p>
            </div>
          </div>

          <h3 className='font-semibold text-webtaxi-ink mb-3'>Choose Payment Method</h3>
          <div className='flex flex-col gap-3'>
            <button type='button' onClick={() => setMethod('upi')} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between text-left ${method === 'upi' ? 'border-user-accent bg-webtaxi-sand' : 'border-webtaxi-charcoal/30'}`}>
              <span><span className='block font-medium'>UPI / QR</span><span className='block text-xs text-webtaxi-charcoal/70'>Pay using any UPI app</span></span>
              <i className='ri-qr-code-line text-xl'></i>
            </button>
            <button type='button' onClick={() => setMethod('card')} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between text-left ${method === 'card' ? 'border-user-accent bg-webtaxi-sand' : 'border-webtaxi-charcoal/30'}`}>
              <span><span className='block font-medium'>Card</span><span className='block text-xs text-webtaxi-charcoal/70'>Debit / Credit Card</span></span>
              <i className='ri-bank-card-line text-xl'></i>
            </button>
          </div>

          {paymentMessage && <p className='text-sm text-webtaxi-charcoal/80 mt-4'>{paymentMessage}</p>}
        </div>

        <div className='mt-8'>
          <button type='button' onClick={handlePay} className='w-full bg-user-primary text-webtaxi-canvas p-4 rounded-2xl font-semibold'>
            {activeRide.fare !== null ? `Pay ₹${activeRide.fare}` : 'Pay'}
          </button>
          <p className='text-center text-xs text-webtaxi-charcoal/60 mt-3'>You will return home when the captain confirms payment.</p>
        </div>
      </div>
    </div>
  )
}

export default UserPayment
