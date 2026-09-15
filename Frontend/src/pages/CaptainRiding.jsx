import { useContext, useEffect, useRef, useState } from 'react'
import RideComplete from '../components/RideComplete'
import LiveMap from '../components/LiveMap'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { RideDataContext } from '../context/RideContext'
import { SocketDataContext } from '../context/SocketContext'
import api from '../services/api'

const LOCATION_EMIT_INTERVAL_MS = 4000

const getStoredLocation = (coordinates, address) => {
  const lat = Number(coordinates?.lat)
  const lng = Number(coordinates?.lng)

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null
  }

  return { lat, lng, address }
}

const CaptainRiding = () => {

  const { ride, setActiveRide, setCaptainLocation } = useContext(RideDataContext)
  const { getSocket } = useContext(SocketDataContext)
  const activeRide = ride.activeRide

  const isAccepted = activeRide.status === 'accepted'
  const isOngoing = activeRide.status === 'ongoing'

  const [arrivedAtPickup, setArrivedAtPickup] = useState(false)

  const [otp, setOtp] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState('')

  const [rideCompletePanel, setrideCompletePanel] = useState(false)
  const rideCompleteRef = useRef(null)

  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState('')

  const [captainOwnPosition, setCaptainOwnPosition] = useState(null)

  const [pickupCoords, setPickupCoords] = useState(() => (
    getStoredLocation(activeRide.pickupCoordinates, activeRide.pickup)
  ))
  const [destinationCoords, setDestinationCoords] = useState(() => (
    getStoredLocation(activeRide.destinationCoordinates, activeRide.destination)
  ))
  const geocodedPickupRef = useRef(null)
  const geocodedDestinationRef = useRef(null)

  const latestPositionRef = useRef(null)
  const watchIdRef = useRef(null)
  const emitIntervalRef = useRef(null)

  const pickupSheetRef = useRef(null)
  const otpSheetRef = useRef(null)

  const showPickupSheet = isAccepted && !arrivedAtPickup
  const showOtpSheet = isAccepted && arrivedAtPickup

  // Reset per-ride UI state when a new ride is assigned to this route.
  const prevRideIdRef = useRef(activeRide.rideId)
  useEffect(() => {
    if (prevRideIdRef.current !== activeRide.rideId) {
      prevRideIdRef.current = activeRide.rideId
      setArrivedAtPickup(false)
      setPickupCoords(getStoredLocation(activeRide.pickupCoordinates, activeRide.pickup))
      setDestinationCoords(getStoredLocation(activeRide.destinationCoordinates, activeRide.destination))
      geocodedPickupRef.current = null
      geocodedDestinationRef.current = null
    }
  }, [
    activeRide.rideId,
    activeRide.pickup,
    activeRide.destination,
    activeRide.pickupCoordinates,
    activeRide.destinationCoordinates
  ])

  // Geocode pickup address once per ride, as soon as it's accepted/ongoing.
  useEffect(() => {
    if (!isAccepted && !isOngoing) {
      return
    }
    if (!activeRide.pickup) {
      return
    }

    const storedPickup = getStoredLocation(activeRide.pickupCoordinates, activeRide.pickup)
    if (storedPickup) {
      geocodedPickupRef.current = activeRide.pickup
      setPickupCoords(storedPickup)
      return
    }

    if (geocodedPickupRef.current === activeRide.pickup) {
      return
    }

    let isCurrent = true
    geocodedPickupRef.current = activeRide.pickup

    api.get('/maps/get-coordinates', { params: { address: activeRide.pickup } })
      .then((response) => {
        if (isCurrent) {
          setPickupCoords({
            lat: response.data.lat,
            lng: response.data.lng,
            address: activeRide.pickup
          })
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPickupCoords(null)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [activeRide.pickup, activeRide.pickupCoordinates, isAccepted, isOngoing])

  // Geocode destination address once the ride goes ongoing.
  useEffect(() => {
    if (!isOngoing) {
      return
    }
    if (!activeRide.destination) {
      return
    }

    const storedDestination = getStoredLocation(activeRide.destinationCoordinates, activeRide.destination)
    if (storedDestination) {
      geocodedDestinationRef.current = activeRide.destination
      setDestinationCoords(storedDestination)
      return
    }

    if (geocodedDestinationRef.current === activeRide.destination) {
      return
    }

    let isCurrent = true
    geocodedDestinationRef.current = activeRide.destination

    api.get('/maps/get-coordinates', { params: { address: activeRide.destination } })
      .then((response) => {
        if (isCurrent) {
          setDestinationCoords({
            lat: response.data.lat,
            lng: response.data.lng,
            address: activeRide.destination
          })
        }
      })
      .catch(() => {
        if (isCurrent) {
          setDestinationCoords(null)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [activeRide.destination, activeRide.destinationCoordinates, isOngoing])

  const reachedPickup = () => {
    setArrivedAtPickup(true)
  }

  const submitOtp = async (e) => {
    e.preventDefault()
    setStartError('')

    if (!activeRide.rideId) {
      setStartError('No active ride found.')
      return
    }

    if (otp.length !== 6) {
      setStartError('OTP must be 6 digits.')
      return
    }

    setIsStarting(true)

    try {
      const response = await api.post('/rides/start', {
        rideId: activeRide.rideId,
        otp
      })

      setActiveRide(response.data)
    } catch (error) {
      setStartError(error.response?.data?.message || 'Invalid OTP. Please check with the rider and try again.')
    } finally {
      setIsStarting(false)
    }
  }

  // Location tracking now spans BOTH "driving to pickup" (accepted) and
  // "driving to destination" (ongoing) phases, instead of only ongoing.
  useEffect(() => {
    const isActiveRide = isAccepted || isOngoing

    if (!isActiveRide) {
      return
    }

    if (!navigator.geolocation) {
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        latestPositionRef.current = { lat: latitude, lng: longitude }
        setCaptainOwnPosition({ lat: latitude, lng: longitude })
        setCaptainLocation({ lat: latitude, lng: longitude })
      },
      () => {

      },
      { enableHighAccuracy: true }
    )

    emitIntervalRef.current = setInterval(() => {
      const socket = getSocket()
      const latest = latestPositionRef.current

      if (socket && latest) {
        socket.emit('update-location-captain', {
          location: latest
        })
      }
    }, LOCATION_EMIT_INTERVAL_MS)

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (emitIntervalRef.current !== null) {
        clearInterval(emitIntervalRef.current)
        emitIntervalRef.current = null
      }
    }

  }, [isAccepted, isOngoing, getSocket, setCaptainLocation])

  const finishRide = async () => {
    setFinishError('')

    if (!activeRide.rideId) {
      setFinishError('No active ride found.')
      return
    }

    setIsFinishing(true)

    try {
      const response = await api.post('/rides/end', {
        rideId: activeRide.rideId
      })

      setActiveRide(response.data)
      setrideCompletePanel(true)
    } catch (error) {
      setFinishError(error.response?.data?.message || 'Could not end the ride. Please try again.')
    } finally {
      setIsFinishing(false)
    }
  }

  useGSAP(() => {
    gsap.to(pickupSheetRef.current, {
      translateY: showPickupSheet ? '0%' : '100%'
    })
  }, [showPickupSheet])

  useGSAP(() => {
    gsap.to(otpSheetRef.current, {
      translateY: showOtpSheet ? '0%' : '100%'
    })
  }, [showOtpSheet])

  useGSAP(()=>{
    if(rideCompletePanel){
      gsap.to(rideCompleteRef.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(rideCompleteRef.current,{
        translateY : '100%'
      })
    }
  },[rideCompletePanel])

  const mapCenter = captainOwnPosition
    ? [captainOwnPosition.lat, captainOwnPosition.lng]
    : pickupCoords
      ? [pickupCoords.lat, pickupCoords.lng]
      : null

  return (
    <div className='h-screen'>

      <div className='h-full'>
        <LiveMap
          center={mapCenter}
          pickup={isAccepted ? pickupCoords : null}
          destination={isOngoing ? destinationCoords : null}
          captainLocation={captainOwnPosition}
          captainVehicleType={activeRide.captain?.vehicle?.vehicleType || activeRide.vehicleType}
        />
      </div>

      {/* Pickup info sheet — shown right after acceptance, before "Reached Pickup" */}
      <div ref={pickupSheetRef} className='fixed bottom-0 w-full translate-y-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
        <h4 className='text-2xl font-bold mb-2'>Head to Pickup</h4>

        <div className='flex items-center gap-5 border-b mb-3 p-2 border-webtaxi-charcoal/30'>
          <div><i className='text-xl ri-user-3-fill'></i></div>
          <div>
            <h2 className='text-lg font-semibold'>
            {
                activeRide.user
                    ? `${activeRide.user.fullname.firstname} ${activeRide.user.fullname.lastname}`
                    : "Rider"
            }
            </h2>
            <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.vehicleType ? `${activeRide.vehicleType} ride` : 'Ride details pending'}</p>
          </div>
        </div>

        <div className='flex items-center gap-5 mb-5 p-2'>
          <div><i className='text-xl ri-map-pin-4-fill'></i></div>
          <div>
            <h2 className='text-lg font-semibold'>Pickup</h2>
            <p className='text-sm -mt-1 text-webtaxi-charcoal/80'>{activeRide.pickup || 'Not available'}</p>
          </div>
        </div>

        <button
          onClick={reachedPickup}
          className='w-full text-webtaxi-canvas p-3 rounded font-semibold bg-captain-primary'
        >
          Reached Pickup
        </button>
      </div>

      {/* OTP sheet — shown only after "Reached Pickup" */}
      <div ref={otpSheetRef} className='fixed z-10 bottom-0 w-full translate-y-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
        <h4 className='text-2xl font-bold mb-2'>Enter Rider's OTP</h4>
        <p className='text-sm text-webtaxi-charcoal/80 mb-5'>Ask the rider for their 6-digit OTP to start the trip.</p>

        <form onSubmit={submitOtp}>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className='w-full text-lg font-mono rounded p-4 mb-5 bg-webtaxi-sand tracking-widest text-center'
            type="text"
            placeholder='••••••'
          />

          {startError && (
            <p className='text-sm text-red-600 mb-3'>{startError}</p>
          )}

          <button
            type='submit'
            disabled={isStarting}
            className={`w-full p-3 rounded font-semibold ${isStarting ? 'bg-webtaxi-sand text-webtaxi-charcoal' : 'bg-captain-primary text-webtaxi-canvas'}`}
          >
            {isStarting ? 'Verifying...' : 'Start Ride'}
          </button>
        </form>
      </div>

      {/* Finish ride bar — unchanged, shown once ongoing */}
      {isOngoing && (
        <div className='fixed z-10 bottom-0 w-full flex flex-col justify-center items-center bg-captain-accent text-webtaxi-ink p-3'>
          {finishError && (
            <p className='text-sm text-red-800 mb-1'>{finishError}</p>
          )}
          <div className='flex justify-between items-center w-full'>
            <h3 className='text-lg font-semibold'>{activeRide.destination || 'Destination'}</h3>
            <button
              onClick={finishRide}
              disabled={isFinishing}
              className={`p-2 rounded w-1/2 ${isFinishing ? 'bg-webtaxi-sand text-webtaxi-charcoal' : 'bg-captain-primary text-webtaxi-canvas'}`}
            >
              {isFinishing ? 'Finishing...' : 'Finish Ride'}
            </button>
          </div>
        </div>
      )}

      <div ref={rideCompleteRef} className='fixed z-10 bottom-0 w-full translate-y-full bg-webtaxi-canvas p-5 h-screen'>
        <RideComplete setrideCompletePanel = {setrideCompletePanel} />
      </div>

    </div>
  )
}

export default CaptainRiding
