import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LocationSearchPanel from '../components/LocationSearchPanel'
import VehiclePanel from '../components/VehiclePanel'
import ConfirmRide from '../components/ConfirmRide'
import LookingDriver from '../components/LookingDriver'
import WatingForDriver from '../components/WatingForDriver'
import LiveMap from '../components/LiveMap'
import { Link, useNavigate } from 'react-router-dom'
import { RideDataContext } from '../context/RideContext'
import { SocketDataContext } from '../context/SocketContext'
import useDebounce from '../hooks/useDebounce'
import api from '../services/api'

const hasValidCoordinates = (location) => (
  Number.isFinite(location?.lat) &&
  Number.isFinite(location?.lng) &&
  location.lat >= -90 && location.lat <= 90 &&
  location.lng >= -180 && location.lng <= 180
)

const hasValidFares = (fareData) => (
  ['Car', 'Bike', 'Auto'].every((vehicleType) => (
    Number.isFinite(fareData?.fare?.[vehicleType]) && fareData.fare[vehicleType] >= 0
  ))
)

const Home = () => {

  const submitHandler = (e) => {
    e.preventDefault()
  }

  const navigate = useNavigate()

  const { ride, setPickup, setDestination, setEstimate, clearBookingQuote, invalidateBookingLocation, setSelectedVehicleType, setActiveRide, clearActiveRide, setCaptainLocation } = useContext(RideDataContext)
  const { getSocket } = useContext(SocketDataContext)

  const [pickup, setPickupInput] = useState(() => ride.pickup.address || ride.activeRide.pickup || '')
  const [dropoff, setDropoffInput] = useState(() => ride.destination.address || ride.activeRide.destination || '')
  const [panelOpen, setPanelOpen] = useState(false)
  const [vehiclePanelOpen, setvehiclePanelOpen] = useState(false)
  const [confirmRidePanelOpen, setconfirmRidePanelOpen] = useState(false)
  const [lookingVehicle, setlookingVehicle] = useState(false)
  const [watingForDriver, setwatingForDriver] = useState(false)

  const [activeField, setActiveField] = useState(null)

  const [mapCenter, setMapCenter] = useState(null)

  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [locationMessage, setLocationMessage] = useState('')

  const activeQuery = activeField === 'pickup' ? pickup : activeField === 'dropoff' ? dropoff : ''
  const debouncedQuery = useDebounce(activeQuery, 400)

  const panelRef = useRef(null)
  const findTrip = useRef(null)
  const panelClose = useRef(null)
  const vehiclePanle = useRef(null)
  const confirmRidePanle = useRef(null)
  const lookingVehicleRef = useRef(null)
  const watingForDriverRef = useRef(null)

  const pickupEditedRef = useRef(Boolean(ride.activeRide.rideId || ride.pickup.address))
  const selectionRequestRef = useRef(0)
  const fareRequestRef = useRef(0)
  const isProcessingLocationRef = useRef(false)
  const selectedLocationQueryRef = useRef('')
  const pendingRideId = ride.activeRide.rideId
  const pendingRideStatus = ride.activeRide.status
  const pendingRideExpiresAt = ride.activeRide.dispatchExpiresAt

  const handleRideUnavailable = useCallback((message) => {
    setlookingVehicle(false)
    setwatingForDriver(false)
    setconfirmRidePanelOpen(false)
    setvehiclePanelOpen(false)
    setPanelOpen(false)
    clearActiveRide()
    window.alert(message || 'No captains are available for this ride. Please try again later.')
  }, [clearActiveRide])

  useEffect(() => {
    if (!pendingRideId) {
      return
    }

    if (pendingRideStatus === 'pending') {
      setPanelOpen(false)
      setvehiclePanelOpen(false)
      setconfirmRidePanelOpen(false)
      setwatingForDriver(false)
      setlookingVehicle(true)
    } else if (pendingRideStatus === 'accepted') {
      setPanelOpen(false)
      setvehiclePanelOpen(false)
      setconfirmRidePanelOpen(false)
      setlookingVehicle(false)
      setwatingForDriver(true)
    }
  }, [pendingRideId, pendingRideStatus])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleRideStarted = (rideData) => {
      setActiveRide(rideData)
      setwatingForDriver(false)
      navigate('/riding')
    }

    socket.on('ride-started', handleRideStarted)

    return () => {
      socket.off('ride-started', handleRideStarted)
    }
  }, [getSocket, setActiveRide, navigate])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleUnavailable = (data) => {
      if (
        ride.activeRide.rideId &&
        String(data?.rideId) !== String(ride.activeRide.rideId)
      ) {
        return
      }

      handleRideUnavailable(data?.message)
    }

    socket.on('ride-unavailable', handleUnavailable)

    return () => {
      socket.off('ride-unavailable', handleUnavailable)
    }
  }, [getSocket, handleRideUnavailable, ride.activeRide.rideId])

  useEffect(() => {
    if (pendingRideStatus !== 'pending' || !pendingRideId) {
      return
    }

    const expiryTime = Date.parse(pendingRideExpiresAt)
    const delay = Number.isFinite(expiryTime)
      ? Math.max(0, expiryTime - Date.now())
      : 40000
    let isCurrent = true

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.post('/rides/cancel', { rideId: pendingRideId })

        if (isCurrent && response.data.status === 'cancelled') {
          handleRideUnavailable(response.data.message)
        }
      } catch (error) {
        if (isCurrent && error.response?.status !== 409) {
          window.alert('Could not update the ride request. Please try again.')
        }
      }
    }, delay)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [handleRideUnavailable, pendingRideExpiresAt, pendingRideId, pendingRideStatus])

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMapCenter([latitude, longitude])

        if (pickupEditedRef.current) {
          return
        }

        api.get('/maps/get-address', { params: { lat: latitude, lng: longitude } })
          .then((response) => {
            if (pickupEditedRef.current) {
              return
            }
            const { address } = response.data
            setPickupInput(address)
            setPickup({ address, lat: latitude, lng: longitude })
          })
          .catch(() => {
            if (pickupEditedRef.current) {
              return
            }
            setPickup({ address: '', lat: latitude, lng: longitude })
          })
      },
      () => {

      }
    )
  }, [setPickup])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleCaptainLocation = (data) => {
      if (
        !ride.activeRide.rideId ||
        String(data?.rideId) !== String(ride.activeRide.rideId)
      ) {
        return
      }

      setCaptainLocation(data.location)
    }

    socket.on('captain-location', handleCaptainLocation)

    return () => {
      socket.off('captain-location', handleCaptainLocation)
    }
  }, [getSocket, ride.activeRide.rideId, setCaptainLocation])

  useEffect(() => {
    if (locationStatus !== 'idle') {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    if (selectedLocationQueryRef.current === `${activeField}:${debouncedQuery}`) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    if (!activeField || !debouncedQuery || debouncedQuery.trim().length < 3) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    let isCurrent = true
    let timedOut = false
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 8000)

    setLocationStatus('idle')
    setLocationMessage('')
    setIsSearching(true)

    api.get('/maps/get-suggestions', {
      params: { input: debouncedQuery },
      signal: controller.signal
    })
      .then((response) => {
        if (isCurrent) {
          setSuggestions(response.data)
          if (response.data.length === 0) {
            setLocationMessage('No locations found. Try a different search.')
          }
        }
      })
      .catch(() => {
        if (isCurrent) {
          setSuggestions([])
          setLocationMessage(timedOut ? 'Location search timed out. Try again.' : 'Could not search locations. Try again.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsSearching(false)
        }
      })

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [debouncedQuery, activeField, locationStatus])

  const onSelectLocation = async (place) => {
    const address = place.displayName
    const field = activeField

    if (!address || !field || isProcessingLocationRef.current || locationStatus !== 'idle') {
      return
    }

    isProcessingLocationRef.current = true
    const requestId = ++selectionRequestRef.current
    fareRequestRef.current += 1
    invalidateBookingLocation(field === 'pickup' ? 'pickup' : 'destination')
    setvehiclePanelOpen(false)
    setconfirmRidePanelOpen(false)
    setPanelOpen(true)
    setLocationStatus('resolving')
    setLocationMessage('')
    setSuggestions([])

    if (field === 'pickup') {
      pickupEditedRef.current = true
      setPickupInput(address)
    } else if (field === 'dropoff') {
      setDropoffInput(address)
    }

    try {
      let coords = hasValidCoordinates(place) ? place : null

      if (!coords) {
        let timedOut = false
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => {
          timedOut = true
          controller.abort()
        }, 8000)

        try {
          const response = await api.get('/maps/get-coordinates', {
            params: { address },
            signal: controller.signal
          })
          coords = response.data
        } catch {
          if (requestId === selectionRequestRef.current) {
            isProcessingLocationRef.current = false
            setLocationStatus('idle')
            setLocationMessage(timedOut ? 'Location lookup timed out. Try again.' : 'Could not set this location. Try another result.')
          }
          return
        } finally {
          window.clearTimeout(timeoutId)
        }
      }

      if (requestId !== selectionRequestRef.current || !hasValidCoordinates(coords)) {
        if (requestId === selectionRequestRef.current) {
          isProcessingLocationRef.current = false
          setLocationStatus('idle')
          setLocationMessage('Could not set this location. Try another result.')
        }
        return
      }

      if (field === 'pickup') {
        setPickup({ address, lat: coords.lat, lng: coords.lng })
      } else if (field === 'dropoff') {
        setDestination({ address, lat: coords.lat, lng: coords.lng })
      }

      setSuggestions([])
      selectedLocationQueryRef.current = `${field}:${address}`
      const otherLocation = field === 'pickup' ? ride.destination : ride.pickup
      if (!hasValidCoordinates(otherLocation)) {
        isProcessingLocationRef.current = false
        setLocationStatus('idle')
        setLocationMessage(field === 'pickup' ? 'Pickup set. Select a destination.' : 'Destination set. Select a pickup.')
      }
    } catch {
      if (requestId === selectionRequestRef.current) {
        isProcessingLocationRef.current = false
        setLocationStatus('idle')
        setLocationMessage('Could not set this location. Try another result.')
      }
    }
  }

  useEffect(() => {
    if (ride.activeRide.rideId) {
      fareRequestRef.current += 1
      clearBookingQuote()
      return
    }

    const pickupAddress = ride.pickup.address
    const destinationAddress = ride.destination.address

    if (!pickupAddress || !destinationAddress || !hasValidCoordinates(ride.pickup) || !hasValidCoordinates(ride.destination)) {
      fareRequestRef.current += 1
      clearBookingQuote()
      return
    }

    const requestId = ++fareRequestRef.current
    let isCurrent = true
    let timedOut = false
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 10000)

    clearBookingQuote()
    setLocationStatus('fare-loading')
    setLocationMessage('')

    api.get('/rides/get-fare', {
      params: {
        pickup: pickupAddress,
        destination: destinationAddress,
        pickupLat: ride.pickup.lat,
        pickupLng: ride.pickup.lng,
        destinationLat: ride.destination.lat,
        destinationLng: ride.destination.lng
      },
      signal: controller.signal
    })
      .then((response) => {
        if (isCurrent && requestId === fareRequestRef.current && hasValidFares(response.data)) {
          isProcessingLocationRef.current = false
          setEstimate(response.data)
          setLocationStatus('idle')
          setPanelOpen(false)
          setvehiclePanelOpen(true)
        } else if (isCurrent && requestId === fareRequestRef.current) {
          isProcessingLocationRef.current = false
          clearBookingQuote()
          setLocationStatus('idle')
          setLocationMessage('Could not calculate a valid fare. Try different locations.')
          setPanelOpen(true)
        }
      })
      .catch((error) => {
        if (isCurrent && requestId === fareRequestRef.current) {
          isProcessingLocationRef.current = false
          clearBookingQuote()
          setLocationStatus('idle')
          setLocationMessage(
            timedOut
              ? 'Fare calculation timed out. Try again.'
              : error.response?.data?.message || 'Could not calculate fare. Try again.'
          )
          setPanelOpen(true)
        }
      })

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }

  }, [ride.activeRide.rideId, ride.pickup, ride.destination, clearBookingQuote, setEstimate])

  const handlePickupChange = (event) => {
    pickupEditedRef.current = true
    isProcessingLocationRef.current = false
    selectedLocationQueryRef.current = ''
    selectionRequestRef.current += 1
    fareRequestRef.current += 1
    setPickupInput(event.target.value)
    invalidateBookingLocation('pickup')
    setvehiclePanelOpen(false)
    setconfirmRidePanelOpen(false)
    setLocationStatus('idle')
    setLocationMessage('')
  }

  const handleDropoffChange = (event) => {
    isProcessingLocationRef.current = false
    selectedLocationQueryRef.current = ''
    selectionRequestRef.current += 1
    fareRequestRef.current += 1
    setDropoffInput(event.target.value)
    invalidateBookingLocation('destination')
    setvehiclePanelOpen(false)
    setconfirmRidePanelOpen(false)
    setLocationStatus('idle')
    setLocationMessage('')
  }

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return
    }

    const handleRideConfirmed = (rideData) => {
      setActiveRide(rideData)
      setlookingVehicle(false)
      setwatingForDriver(true)
    }

    socket.on('ride-accepted', handleRideConfirmed)

    return () => {
      socket.off('ride-accepted', handleRideConfirmed)
    }
  }, [getSocket, setActiveRide])

  useGSAP(() => {

    if (panelOpen) {
      gsap.to(panelRef.current, {
        height: '70vh',
        paddingRight: '15px',
        paddingLeft: '15px',
        paddingTop: '20px',
        paddingBottom: '20px'
      })

      gsap.to(findTrip.current, {
        borderRadius: '0px'
      })

      gsap.to(panelClose.current, {
        opacity: 1
      })

    } else {

      gsap.to(panelRef.current, {
        height: '0vh',
        paddingRight: '0px',
        paddingLeft: '0px',
        paddingTop: '0px',
        paddingBottom: '0px'
      })

      gsap.to(panelClose.current, {
        opacity: 0
      })

      gsap.to(findTrip.current, {
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px'
      })
    }

  }, [panelOpen])

  useGSAP(()=>{
    if(vehiclePanelOpen){
      gsap.to(vehiclePanle.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(vehiclePanle.current,{
        translateY : '100%'
      })
    }
  },[vehiclePanelOpen])

  useGSAP(()=>{
    if(confirmRidePanelOpen){
      gsap.to(confirmRidePanle.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(confirmRidePanle.current,{
        translateY : '100%'
      })
    }
  },[confirmRidePanelOpen])

    useGSAP(()=>{
    if(lookingVehicle){
      gsap.to(lookingVehicleRef.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(lookingVehicleRef.current,{
        translateY : '100%'
      })
    }
  },[lookingVehicle])

    useGSAP(()=>{
    if(watingForDriver){
      gsap.to(watingForDriverRef.current,{
        translateY: '0%'
      })
    }else{
      gsap.to(watingForDriverRef.current,{
        translateY : '100%'
      })
    }
  },[watingForDriver])

  return (
    <div className='h-screen w-full relative overflow-hidden'>

      <Link to='/logout' className='fixed z-10 right-3 top-3 flex justify-center items-center rounded-full px-2 py-1 bg-webtaxi-canvas text-user-accent'>
          <i className='text-2xl ri-logout-box-r-line'></i>
      </Link>

      <div className='h-[75%]'>
        <LiveMap
          center={mapCenter}
          pickup={hasValidCoordinates(ride.pickup) ? ride.pickup : null}
          destination={hasValidCoordinates(ride.destination) ? ride.destination : null}
          captainLocation={
            (ride.activeRide.status === 'accepted' ||
              ride.activeRide.status === 'ongoing') &&
              ride.activeRide.captainLocation?.lat
              ? ride.activeRide.captainLocation
              : null
          }
          captainVehicleType={ride.activeRide.captain?.vehicle?.vehicleType || ride.activeRide.vehicleType}
        />

      </div>

      <div className='flex flex-col justify-end absolute w-full bottom-0'>

        <div ref={findTrip} className='h-[30vh] bg-webtaxi-canvas p-6 rounded-t-2xl relative'>
          <i ref={panelClose}
            onClick={() => setPanelOpen(false)}
            className="absolute right-[48%] top-0 opacity-0 text-3xl ri-arrow-down-wide-fill cursor-pointer"
          ></i>

          <h4 className='text-2xl font-semibold'>Find a trip</h4>

          <form
            onSubmit={(e)=>{
              submitHandler(e)
            }}
            className='flex flex-col'
          >

            <div className='bg-user-primary h-12 w-0.75 rounded-full absolute left-10 top-23.75'></div>

            <input
              onFocus={() => {
                setPanelOpen(true)
                setActiveField('pickup')
              }}
              onChange={handlePickupChange}
              value={pickup}
              className='bg-webtaxi-sand text-base px-12 py-2 mt-5 w-full rounded-lg outline-none focus:ring-2 focus:ring-user-primary'
              type='text'
              placeholder='Add a pick-up location'
            />

            <input
              onFocus={() => {
                setPanelOpen(true)
                setActiveField('dropoff')
              }}
              onChange={handleDropoffChange}
              value={dropoff}
              className='bg-webtaxi-sand text-base px-12 py-2 mt-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-user-primary'
              type='text'
              placeholder='Enter your destination'
            />

          </form>
        </div>

        <div ref={panelRef} className='h-0 bg-webtaxi-canvas overflow-auto'>
          <LocationSearchPanel
            suggestions={suggestions}
            isLoading={isSearching}
            status={locationStatus}
            message={locationMessage}
            onSelectLocation={onSelectLocation}
          />
        </div>

      </div>

    <div ref={vehiclePanle}  className='fixed z-10 bottom-0 translate-y-full w-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
      <VehiclePanel
        estimate={ride.estimate}
        setSelectedVehicleType={setSelectedVehicleType}
        setconfirmRidePanelOpen={setconfirmRidePanelOpen}
        setvehiclePanelOpen={setvehiclePanelOpen}
      />
    </div>

    <div ref={confirmRidePanle}  className='fixed z-10 bottom-0 translate-y-full w-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
      <ConfirmRide
        setconfirmRidePanelOpen={setconfirmRidePanelOpen}
        setvehiclePanelOpen={setvehiclePanelOpen}
        setlookingVehicle={setlookingVehicle}
        onRideUnavailable={handleRideUnavailable}
      />
    </div>

    <div ref={lookingVehicleRef}  className='fixed z-10 bottom-0 translate-y-full w-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
      <LookingDriver setlookingVehicle={setlookingVehicle}/>
    </div>
    
    <div ref={watingForDriverRef} className='fixed z-10 bottom-0 w-full translate-y-full bg-webtaxi-canvas px-4 py-6 rounded-t-2xl'>
      <WatingForDriver setwatingForDriver={setwatingForDriver}/>
    </div>

  </div>
  )
}

export default Home
