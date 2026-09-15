import { useContext, useEffect, useRef, useState } from 'react'
import LiveMap from '../components/LiveMap'
import { Link } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import RideAccepted from '../components/RideAccepted'
import { SocketDataContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CaptainContext'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const CaptainHome = () => {

  const { captain } = useContext(CaptainDataContext)

  const [ridePopUpPanel, setridePopUpPanel] = useState(false)
  const ridePopUpRef = useRef(null)

  const [captainLocation, setCaptainLocation] = useState(null)

  const [rideAccepted, setrideAccepted] = useState(false)
  const rideAcceptedRef = useRef(null)

  const { getSocket } = useContext(SocketDataContext)
  const { ride, setActiveRide, clearActiveRide } = useContext(RideDataContext)
  const pendingRideId = ride.activeRide.rideId
  const pendingRideStatus = ride.activeRide.status
  const pendingRideExpiresAt = ride.activeRide.dispatchExpiresAt

  const LOCATION_EMIT_INTERVAL_MS = 4000

const latestPositionRef = useRef(null)
const watchIdRef = useRef(null)
const emitIntervalRef = useRef(null)

useEffect(() => {
  if (!navigator.geolocation) {
    return
  }

  watchIdRef.current = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords

      const location = {
      lat: latitude,
      lng: longitude
    }

    latestPositionRef.current = location
    setCaptainLocation(location)
    },
    () => {

    },
    { enableHighAccuracy: true}
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
}, [getSocket])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleNewRide = (data) => {
      const incomingRide = data?.ride
      const expiresAt = Date.parse(incomingRide?.dispatchExpiresAt)
      const hasRequiredRideData = (
        incomingRide?._id &&
        incomingRide.status === 'pending' &&
        incomingRide.pickup &&
        incomingRide.destination &&
        incomingRide.vehicleType &&
        Number.isFinite(incomingRide.fare) &&
        Number.isFinite(expiresAt) &&
        expiresAt > Date.now()
      )

      if (
        !hasRequiredRideData ||
        (pendingRideId && String(pendingRideId) !== String(incomingRide._id))
      ) {
        return
      }

      setActiveRide(incomingRide)
      setrideAccepted(false)
      setridePopUpPanel(true)
    }

    socket.on('new-ride', handleNewRide)

    return () => {
      socket.off('new-ride', handleNewRide)
    }
  }, [getSocket, pendingRideId, setActiveRide])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleRideUnavailable = (data) => {
      if (
        !pendingRideId ||
        String(data?.rideId) !== String(pendingRideId)
      ) {
        return
      }

      setrideAccepted(false)
      setridePopUpPanel(false)
      clearActiveRide()
    }

    socket.on('ride-unavailable', handleRideUnavailable)

    return () => {
      socket.off('ride-unavailable', handleRideUnavailable)
    }
  }, [clearActiveRide, getSocket, pendingRideId])

  useEffect(() => {
    if (pendingRideStatus !== 'pending' || !pendingRideId) {
      return
    }

    const expiryTime = Date.parse(pendingRideExpiresAt)
    const delay = Number.isFinite(expiryTime)
      ? Math.max(0, expiryTime - Date.now())
      : 40000

    const timeoutId = window.setTimeout(() => {
      setrideAccepted(false)
      setridePopUpPanel(false)
      clearActiveRide()

      api.post('/rides/reject', { rideId: pendingRideId }).catch(() => {
        // The rider-side expiry request handles cancellation if this request fails.
      })
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [clearActiveRide, pendingRideExpiresAt, pendingRideId, pendingRideStatus])

  useGSAP(()=>{
    if(ridePopUpPanel){
      gsap.to(ridePopUpRef.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(ridePopUpRef.current,{
        translateY : '100%'
      })
    }
  },[ridePopUpPanel])

  useGSAP(()=>{
    if(rideAccepted){
      gsap.to(rideAcceptedRef.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(rideAcceptedRef.current,{
        translateY : '100%'
      })
    }
  },[rideAccepted])

  return (
    <div className='h-screen'>

        <Link to='/captain_logout' className='fixed right-0 z-10 flex justify-center items-center rounded-full px-2 py-1 bg-webtaxi-canvas text-captain-accent m-2'>
            <i className='text-2xl ri-logout-box-r-line'></i>
        </Link>

        <div className='h-2/3'>
          <LiveMap
            center={
                captainLocation
                ? [captainLocation.lat, captainLocation.lng]
                : undefined
            }
            captainLocation={captainLocation}
            captainVehicleType={captain?.vehicle?.vehicleType}
          />
      </div>

      <div className='h-1/3 p-4'>
        <CaptainDetails captain={captain} />
      </div>

      <div ref={ridePopUpRef} className='fixed z-10 bottom-0 w-full translate-y-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
        <RidePopUp setridePopUpPanel = {setridePopUpPanel} setrideAccepted = {setrideAccepted} />
      </div>

      <div ref={rideAcceptedRef} className='fixed z-10 bottom-0 w-full translate-y-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
        <RideAccepted
          key={ride.activeRide.rideId || 'no-ride'}
          setrideAccepted={setrideAccepted}
          setridePopUpPanel={setridePopUpPanel}
        />
      </div>

    </div>
  )
}

export default CaptainHome
