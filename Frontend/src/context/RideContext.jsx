import { createContext, useCallback, useState } from 'react'

// Context and provider intentionally share this small module.
// eslint-disable-next-line react-refresh/only-export-components
export const RideDataContext = createContext()

const createInitialRideState = () => ({
  pickup: {
    address: '',
    lat: null,
    lng: null
  },
  destination: {
    address: '',
    lat: null,
    lng: null
  },
  selectedVehicleType: '',
  estimate: {
    Auto: null,
    Car: null,
    Bike: null
  },
  activeRide: {
    rideId: null,
    pickup: null,
    destination: null,
    pickupCoordinates: null,
    destinationCoordinates: null,
    vehicleType: null,
    fare: null,
    distance: null,
    status: null,
    captain: null,
    otp: null,
    user: null,
    paymentStatus: null,
    paymentMethod: null,
    dispatchExpiresAt: null,
    captainLocation: {
      lat: null,
      lng: null
    }
  }
})

const createEmptyEstimate = () => ({
  Auto: null,
  Car: null,
  Bike: null
})

const RideContext = ({ children }) => {

  const [ride, setRide] = useState(createInitialRideState)

  const setPickup = useCallback((pickup) => {
    setRide((prev) => ({
      ...prev,
      pickup: {
        address: pickup.address ?? '',
        lat: pickup.lat ?? null,
        lng: pickup.lng ?? null
      }
    }))
  }, [])

  const setDestination = useCallback((destination) => {
    setRide((prev) => ({
      ...prev,
      destination: {
        address: destination.address ?? '',
        lat: destination.lat ?? null,
        lng: destination.lng ?? null
      }
    }))
  }, [])

  const setSelectedVehicleType = (vehicleType) => {
    setRide((prev) => ({
      ...prev,
      selectedVehicleType: vehicleType
    }))
  }

  const setEstimate = useCallback((estimateData) => {
    setRide((prev) => ({
      ...prev,
      estimate: {
        Auto: estimateData?.fare?.Auto ?? null,
        Car: estimateData?.fare?.Car ?? null,
        Bike: estimateData?.fare?.Bike ?? null
      }
    }))
  }, [])

  const clearBookingQuote = useCallback(() => {
    setRide((prev) => ({
      ...prev,
      selectedVehicleType: '',
      estimate: createEmptyEstimate()
    }))
  }, [])

  const invalidateBookingLocation = useCallback((field) => {
    if (field !== 'pickup' && field !== 'destination') {
      return
    }

    setRide((prev) => ({
      ...prev,
      [field]: {
        address: '',
        lat: null,
        lng: null
      },
      selectedVehicleType: '',
      estimate: createEmptyEstimate()
    }))
  }, [])

  const setActiveRide = useCallback((rideData) => {
    setRide((prev) => ({
      ...prev,
      activeRide: {
        rideId: rideData?._id ?? prev.activeRide.rideId,
        pickup: rideData?.pickup ?? prev.activeRide.pickup,
        destination: rideData?.destination ?? prev.activeRide.destination,
        pickupCoordinates: rideData?.pickupCoordinates ?? prev.activeRide.pickupCoordinates,
        destinationCoordinates: rideData?.destinationCoordinates ?? prev.activeRide.destinationCoordinates,
        vehicleType: rideData?.vehicleType ?? prev.activeRide.vehicleType,
        fare: rideData?.fare ?? prev.activeRide.fare,
        distance: rideData?.distance ?? prev.activeRide.distance,
        status: rideData?.status ?? prev.activeRide.status,
        captain: rideData?.captain ?? prev.activeRide.captain,
        otp: rideData?.otp ?? prev.activeRide.otp,
        user: rideData?.user ?? prev.activeRide.user,
        paymentStatus: rideData?.paymentStatus ?? prev.activeRide.paymentStatus,
        paymentMethod: rideData?.paymentMethod ?? prev.activeRide.paymentMethod,
        dispatchExpiresAt: rideData?.dispatchExpiresAt ?? prev.activeRide.dispatchExpiresAt,
        captainLocation: prev.activeRide.captainLocation
      }
    }))
  }, [])

  const setCaptainLocation = useCallback((location) => {
    setRide((prev) => ({
      ...prev,
      activeRide: {
        ...prev.activeRide,
        captainLocation: {
          lat: location?.lat ?? null,
          lng: location?.lng ?? null
        }
      }
    }))
  }, [])

  const clearActiveRide = useCallback(({ preservePendingOffer = false } = {}) => {
    setRide((prev) => {
      const offerExpiry = Date.parse(prev.activeRide.dispatchExpiresAt)
      const hasValidPendingOffer = (
        prev.activeRide.status === 'pending' &&
        Boolean(prev.activeRide.rideId) &&
        Number.isFinite(offerExpiry) &&
        offerExpiry > Date.now()
      )

      if (preservePendingOffer && hasValidPendingOffer) {
        return prev
      }

      return {
        ...prev,
        activeRide: {
          rideId: null,
          pickup: null,
          destination: null,
          pickupCoordinates: null,
          destinationCoordinates: null,
          vehicleType: null,
          fare: null,
          distance: null,
          status: null,
          captain: null,
          otp: null,
          user: null,
          paymentStatus: null,
          paymentMethod: null,
          dispatchExpiresAt: null,
          captainLocation: {
            lat: null,
            lng: null
          }
        }
      }
    })
  }, [])

  const resetRide = useCallback(() => {
    setRide(createInitialRideState())
  }, [])

  return (
    <RideDataContext.Provider value={{
      ride,
      setPickup,
      setDestination,
      setSelectedVehicleType,
      setEstimate,
      clearBookingQuote,
      invalidateBookingLocation,
      setActiveRide,
      clearActiveRide,
      setCaptainLocation,
      resetRide
    }}>
      {children}
    </RideDataContext.Provider>
  )
}


export default RideContext
