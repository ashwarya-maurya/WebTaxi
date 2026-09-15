import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import qrImage from '../assets/qrImage.png'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const CaptainPayment = () => {
  const { ride, resetRide, setActiveRide } = useContext(RideDataContext)
  const navigate = useNavigate()
  const activeRide = ride.activeRide

  const [method, setMethod] = useState('cash')
  const [isLoading, setIsLoading] = useState(!activeRide.rideId)
  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (activeRide.rideId) return

    let isCurrent = true
    api.get('/rides/current-captain')
      .then((response) => {
        if (!isCurrent) return

        const currentRide = response.data.ride
        if (!currentRide) {
          resetRide()
          navigate('/captain_home', { replace: true })
          return
        }

        setActiveRide(currentRide)
        if (currentRide.status !== 'completed') {
          navigate('/confirm_ride', { replace: true })
          return
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (isCurrent) {
          setErrorMessage('Could not restore the completed ride. Please try again.')
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [activeRide.rideId, navigate, resetRide, setActiveRide])

  const confirmPayment = async () => {
    if (!activeRide.rideId) {
      setErrorMessage('No completed ride found.')
      return
    }

    setIsConfirming(true)
    setErrorMessage('')
    try {
      await api.post('/rides/confirm-payment', {
        rideId: activeRide.rideId,
        paymentMethod: method
      })
      resetRide()
      navigate('/captain_home', { replace: true })
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not confirm payment.')
    } finally {
      setIsConfirming(false)
    }
  }

  if (isLoading) {
    return <div className='h-screen flex items-center justify-center'><p>Loading payment details...</p></div>
  }

  return (
    <div className='min-h-screen w-full bg-webtaxi-canvas text-webtaxi-ink flex flex-col'>
      <div className='flex-1 p-6 flex flex-col justify-between'>
        <div>
          <button type='button' onClick={() => navigate('/captain_home')} aria-label='Return to captain home' className='fixed right-5 top-7 inline-flex items-center justify-center h-10 w-10 rounded-full bg-webtaxi-sand text-captain-primary'>
            <i className='ri-arrow-right-line text-xl'></i>
          </button>

          <h2 className='text-2xl font-bold text-webtaxi-ink'>Payment Collection</h2>
          <p className='text-sm text-webtaxi-charcoal/70'>Choose payment type for this ride</p>

          <div className='bg-webtaxi-sand p-4 rounded-2xl my-5 flex justify-between items-center'>
            <div>
              <h3 className='font-semibold text-webtaxi-ink'>Ride Completed</h3>
              <p className='text-sm text-webtaxi-charcoal/70 mt-1'>{activeRide.pickup || 'Pickup'} → {activeRide.destination || 'Destination'}</p>
            </div>
            <div className='text-right'>
              <h3 className='text-2xl font-bold text-webtaxi-ink'>{activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}</h3>
              <p className='text-xs text-webtaxi-charcoal/70'>Total Fare</p>
            </div>
          </div>

          <h3 className='font-semibold mb-3 text-webtaxi-ink'>Select Payment Mode</h3>
          <div className='flex flex-col gap-3 mb-5'>
            <button type='button' onClick={() => setMethod('cash')} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center text-left ${method === 'cash' ? 'border-captain-accent bg-webtaxi-sand' : 'border-webtaxi-charcoal/30'}`}>
              <span><span className='block font-medium'>Cash Payment</span><span className='block text-xs text-webtaxi-charcoal/70'>Collect from rider</span></span>
              <i className='ri-money-rupee-circle-line text-xl'></i>
            </button>
            <button type='button' onClick={() => setMethod('upi')} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center text-left ${method === 'upi' ? 'border-captain-accent bg-webtaxi-sand' : 'border-webtaxi-charcoal/30'}`}>
              <span><span className='block font-medium'>UPI / QR</span><span className='block text-xs text-webtaxi-charcoal/70'>Digital payment</span></span>
              <i className='ri-qr-code-line text-xl'></i>
            </button>
          </div>

          {method === 'upi' && (
            <div className='mb-5 p-4 border rounded-2xl text-center'>
              <p className='font-medium mb-3'>Scan QR to Pay</p>
              <div className='w-48 h-48 mx-auto mb-3'>
                <img src={qrImage} alt='UPI QR Code' className='w-full h-full object-contain rounded-xl border' />
              </div>
              <p className='text-xs text-webtaxi-charcoal/70'>Confirm only after receiving the payment.</p>
            </div>
          )}

          {errorMessage && <p className='text-sm text-red-600 mb-3'>{errorMessage}</p>}
        </div>

        <button type='button' onClick={confirmPayment} disabled={isConfirming} className={`w-full p-4 rounded-2xl font-semibold ${isConfirming ? 'bg-webtaxi-sand text-webtaxi-charcoal' : 'bg-captain-primary text-webtaxi-canvas'}`}>
          {isConfirming ? 'Confirming...' : method === 'cash' ? 'Mark Cash Received' : 'Confirm UPI Payment Received'}
        </button>
      </div>
    </div>
  )
}

export default CaptainPayment
