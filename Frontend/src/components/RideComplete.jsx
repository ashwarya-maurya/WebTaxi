import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { RideDataContext } from '../context/RideContext'

const RideComplete = () => {

  const { ride } = useContext(RideDataContext)
  const activeRide = ride.activeRide

  return (
    <div>

      <h4 className='text-2xl font-bold mb-5'>Ride Completed!</h4>

        <div className='flex flex-col justify-center items-center'>
            <div className='flex items-center justify-between w-full p-2 rounded-lg mb-2 border-3 border-captain-accent'>
                <div className='flex gap-1 items-center'>
                    <img className='w-15 h-15 object-cover rounded-full' src="https://cdn-icons-png.magnific.com/512/4140/4140037.png" alt="User"/>
                    <h2 className='text-lg font-semibold'>
                    {
                        activeRide.user
                            ? `${activeRide.user.fullname.firstname} ${activeRide.user.fullname.lastname}`
                            : "Rider"
                    }
                    </h2>
                </div>
                <p className='text-xl font-semibold'>
                  {activeRide.distance !== null ? `${(activeRide.distance / 1000).toFixed(1)} Km` : '—'}
                </p>
            </div>

            <div className='w-full'>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
                    <div><i className='text-xl ri-map-pin-4-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Pickup</h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.pickup || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
                    <div><i className='text-xl ri-square-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>Destination</h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.destination || 'Not available'}</p>
                    </div>
                </div>

                <div className='flex items-center gap-5 mb-5 p-2'>
                    <div><i className='text-xl ri-cash-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>
                          {activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}
                        </h2>
                        <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>Payment</p>
                    </div>
                </div>

            </div>

            <div className='w-full'>
            <Link to='/captain_payment' className='w-full block text-center bg-captain-primary text-webtaxi-canvas p-2 rounded'>Receive Payment</Link>
            </div>

        </div>
    </div>
  )
}

export default RideComplete
