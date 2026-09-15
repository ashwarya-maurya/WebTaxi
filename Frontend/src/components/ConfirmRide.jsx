import { useContext, useState } from 'react'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const hasValidCoordinates = (location) => (
  Number.isFinite(location?.lat) &&
  Number.isFinite(location?.lng) &&
  location.lat >= -90 && location.lat <= 90 &&
  location.lng >= -180 && location.lng <= 180
)

const ConfirmRide = (props) => {

  const { ride, setActiveRide, clearActiveRide } = useContext(RideDataContext)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const vehicleType = ride.selectedVehicleType
  const fareForSelectedVehicle = vehicleType ? ride.estimate[vehicleType] : null

  const confirmRide = async () => {
    setErrorMessage('')

    if (
      !ride.pickup.address ||
      !ride.destination.address ||
      !hasValidCoordinates(ride.pickup) ||
      !hasValidCoordinates(ride.destination) ||
      !vehicleType ||
      !Number.isFinite(fareForSelectedVehicle)
    ) {
      setErrorMessage('Valid locations, vehicle type, and fare are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/rides/create', {
        pickup: ride.pickup.address,
        destination: ride.destination.address,
        pickupCoordinates: {
          lat: ride.pickup.lat,
          lng: ride.pickup.lng
        },
        destinationCoordinates: {
          lat: ride.destination.lat,
          lng: ride.destination.lng
        },
        vehicleType: vehicleType
      })

      if (response.data.status === 'cancelled') {
        clearActiveRide()
        props.setlookingVehicle(false)
        props.setconfirmRidePanelOpen(false)
        props.setvehiclePanelOpen(false)
        props.onRideUnavailable?.(response.data.message)
        return
      }

      setActiveRide(response.data)

      props.setlookingVehicle(true)
      props.setconfirmRidePanelOpen(false)
      props.setvehiclePanelOpen(false)
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not create ride. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h5 onClick={() => {
        props.setconfirmRidePanelOpen(false)
      }} className='text-center absolute top-0 w-[95%]'><i className="text-2xl text-webtaxi-charcoal/50 ri-arrow-down-wide-line"></i></h5>

      <h4 className='text-2xl font-bold mb-5'>Confirm your Ride</h4>

      <div className='flex flex-col justify-center items-center'>
        <img className='h-20 mb-5' src="https://www.asaproadworthys.com.au/wp-content/uploads/2021/11/Select.jpeg" alt="Car" />

        <div className='w-full'>

        <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
            <div><i className='text-xl ri-map-pin-4-fill'></i></div>
            <div>
              <h2 className='text-lg font-semibold'>Pickup</h2>
              <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{ride.pickup.address || 'Not selected'}</p>
            </div>
          </div>

          <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
            <div><i className='text-xl ri-square-fill'></i></div>
            <div>
              <h2 className='text-lg font-semibold'>Destination</h2>
              <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{ride.destination.address || 'Not selected'}</p>
            </div>
          </div>

          <div className='flex items-center gap-5 mb-3 p-2'>
            <div><i className='text-xl ri-cash-fill'></i></div>
            <div>
              <h2 className='text-lg font-semibold'>
                {fareForSelectedVehicle !== null ? `₹${fareForSelectedVehicle}` : '—'}
              </h2>
              <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>Payment Mode : Cash{vehicleType ? ` · ${vehicleType}` : ''}</p>
            </div>
          </div>

        </div>


        {errorMessage && (
          <p className='w-full text-sm text-red-600 mb-3'>{errorMessage}</p>
        )}

        <button
          onClick={confirmRide}
          disabled={isSubmitting}
          className={`w-full p-2 rounded ${isSubmitting ? 'bg-webtaxi-sand text-webtaxi-charcoal' : 'bg-user-primary text-webtaxi-canvas'}`}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Ride'}
        </button>
      </div>
    </div>
  )
}

export default ConfirmRide
