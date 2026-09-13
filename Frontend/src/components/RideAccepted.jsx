import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const RideAccepted = (props) => {

    const { ride, setActiveRide, clearActiveRide } = useContext(RideDataContext)
    const navigate = useNavigate()

    const [isConfirming, setIsConfirming] = useState(false)
    const [isRideUnavailable, setIsRideUnavailable] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const closeTimerRef = useRef(null)

    const activeRide = ride.activeRide

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current)
            }
        }
    }, [])

    const confirmAccept = async () => {
        setErrorMessage('')

        if (!activeRide.rideId) {
            setErrorMessage('No ride to confirm.')
            return
        }

        setIsConfirming(true)

        try {
            const response = await api.post('/rides/accept', {
                rideId: activeRide.rideId
            })

            setActiveRide(response.data)

            navigate('/confirm_ride')
        } catch (error) {
            const isConflict = error.response?.status === 409

            setErrorMessage(error.response?.data?.message || 'Could not confirm this ride. It may have already been accepted by another captain.')

            if (isConflict) {
                setIsRideUnavailable(true)
                closeTimerRef.current = setTimeout(() => {
                    props.setrideAccepted(false)
                    props.setridePopUpPanel(false)
                    clearActiveRide()
                }, 2000)
            }
        } finally {
            setIsConfirming(false)
        }
    }

    const declineRide = async () => {
        const rideId = activeRide.rideId

        props.setrideAccepted(false)
        props.setridePopUpPanel(false)
        clearActiveRide()

        if (!rideId) {
            return
        }

        try {
            await api.post('/rides/reject', { rideId })
        } catch {
            // The rider-side timeout will safely cancel an unanswered request.
        }
    }

  return (
    <div>
        <h4 className='text-2xl font-bold mb-5'>Ride Accepted!</h4>

        <div className='flex flex-col justify-center items-center'>
            <div className='flex items-center justify-between w-full p-2 rounded-lg mb-2 border-3 border-yellow-500 '>
                <div className='flex gap-1 items-center'>
                    <img className='w-15 h-15 object-cover rounded-full' src="https://cdn-icons-png.magnific.com/512/4140/4140037.png" alt="User"/>
                    <p className='text-xl font-semibold'>
                        {ride.activeRide.user
                        ? `${ride.activeRide.user.fullname.firstname} ${ride.activeRide.user.fullname.lastname}`
                        : "New Rider"}
                    </p>
                </div>
                <p className='text-xl font-semibold'>
                  {activeRide.distance !== null ? `${(activeRide.distance / 1000).toFixed(1)} Km` : '—'}
                </p>
            </div>

            <div className='w-full'>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-gray-400'>
                    <div><i className='text-xl ri-map-pin-4-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Pickup</h2>
                        <p className='text-sm -mt-1 text-gray-600'>{activeRide.pickup || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-gray-400'>
                    <div><i className='text-xl ri-square-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Destination</h2>
                        <p className='text-sm -mt-1 text-gray-600'>{activeRide.destination || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 mb-5 p-2'>
                    <div><i className='text-xl ri-cash-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>
                          {activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}
                        </h2>
                        <p className='text-sm -mt-1 text-gray-600'>Payment Mode : Cash</p>
                    </div>
                </div>

            </div>

            <div className='w-full'>

                <div className='flex gap-2'>
                <button
                onClick={confirmAccept}
                disabled={isConfirming || isRideUnavailable}
                className={`text-center w-1/2 text-white p-2 rounded ${isConfirming || isRideUnavailable ? 'bg-green-400' : 'bg-green-700'}`}
                >
                  {isRideUnavailable ? 'Ride Unavailable' : isConfirming ? 'Confirming...' : 'Confirm'}
                </button>

                <button onClick={declineRide}
                disabled={isRideUnavailable}
                className={`w-1/2 text-white p-2 rounded ${isRideUnavailable ? 'bg-red-400' : 'bg-red-700'}`}>Cancel</button>
                </div>

                {errorMessage && (
                  <p className='text-sm text-red-600 mt-3'>{errorMessage}</p>
                )}
 
            </div>

        </div>
    </div>
  )
}

export default RideAccepted
