import React, { useContext } from 'react'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const RidePopUp = (props) => {

  const { ride, clearActiveRide } = useContext(RideDataContext)
  const activeRide = ride.activeRide

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
        <h5 onClick={declineRide} className='text-center absolute top-0 w-[95%]' ><i className=" text-2xl text-gray-300 ri-arrow-down-wide-line"></i></h5>

        <h4 className='text-2xl font-bold mb-2'>New Ride Available!</h4>

        <div className='flex flex-col justify-center items-center'>
            <div className='flex items-center justify-between w-full p-2 rounded-lg mb-2 bg-yellow-500 '>
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

                <div className='flex items-center gap-5 mb-3 p-2'>
                    <div><i className='text-xl ri-cash-fill'></i></div>
                    <div>
                        <h2 className='text-lg font-semibold'>
                          {activeRide.fare !== null ? `₹${activeRide.fare}` : '—'}
                        </h2>
                        <p className='text-sm -mt-1 text-gray-600'>Payment Mode : Cash{activeRide.vehicleType ? ` · ${activeRide.vehicleType}` : ''}</p>
                    </div>
                </div>

            </div>

            <div className='flex w-full gap-2' >
            <button onClick={()=>{
                props.setrideAccepted(true)
            }} 
            className='w-1/2 bg-green-700 text-white p-2 rounded'>Accept</button>

            <button onClick={declineRide}
            className='w-1/2 bg-red-700 text-white p-2 rounded'>Ignore</button>
            </div>

        </div>
    </div>
  )
}

export default RidePopUp
