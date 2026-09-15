import { useContext } from 'react'
import { RideDataContext } from '../context/RideContext'

const LookingDriver = (props) => {

  const { ride } = useContext(RideDataContext)

  return (
    <div>

      <h5 onClick={() => {
        props.setlookingVehicle(false)
      }} className='text-center absolute top-0 w-[95%]'><i className="text-2xl text-webtaxi-charcoal/50 ri-arrow-down-wide-line"></i></h5>

      <h4 className='text-2xl font-bold mb-5'>Looking for Ride</h4>

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
                {ride.activeRide.fare !== null ? `₹${ride.activeRide.fare}` : '—'}
              </h2>
              <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>Payment Mode : Cash{ride.activeRide.vehicleType ? ` · ${ride.activeRide.vehicleType}` : ''}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default LookingDriver
