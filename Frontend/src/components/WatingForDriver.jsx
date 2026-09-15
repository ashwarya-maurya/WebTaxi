import { useContext } from 'react'
import { RideDataContext } from '../context/RideContext'

const WatingForDriver = () => {

  const { ride } = useContext(RideDataContext)
  const activeRide = ride.activeRide
  const captain = activeRide.captain

  return (
    <div>

        <h4 className='text-2xl font-bold mb-5'>Wating for Driver</h4>

            <div className='flex items-center justify-between mb-5'>
                <img className='h-15' src="https://www.asaproadworthys.com.au/wp-content/uploads/2021/11/Select.jpeg" alt="Car" />
                <div className='text-right'>
                    <h2 className='text-lg font-medium'>
                      {captain ? `${captain.fullname?.firstname || ''} ${captain.fullname?.lastname || ''}`.trim() : 'Driver'}
                    </h2>
                    <h4 className='text-xl font-semibold -mt-1 -mb-1'>{captain?.vehicle?.plate || 'Plate pending'}</h4>
                    <p className='text-sm text-webtaxi-charcoal/80'>{captain?.vehicle?.color ? `${captain.vehicle.color} ${captain.vehicle.vehicleType}` : 'Vehicle pending'}</p>
                    <p className='font-semibold text-webtaxi-ink' >OTP : {activeRide.otp || ride.activeRide.otp || 'Not available'}</p>
                </div>
            </div>

            <div className='w-full'>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
                    <div><i className='text-xl ri-map-pin-4-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Pickup</h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.pickup || ride.pickup.address || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
                    <div><i className='text-xl ri-square-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Destination</h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.destination || ride.destination.address || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 mb-3 p-2'>
                    <div><i className='text-xl ri-cash-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>
                          {activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}
                        </h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>Payment Mode : Cash</p>
                    </div>
                </div>

            </div>

        </div>
  )
}

export default WatingForDriver
