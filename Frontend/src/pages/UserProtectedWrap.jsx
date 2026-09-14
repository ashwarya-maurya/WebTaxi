import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import { SocketDataContext } from '../context/SocketContext'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const UserProtectedWrap = ({ children }) => {

  const token = localStorage.getItem('token')
  const location = useLocation()
  const navigate = useNavigate()
  const { setuser } = useContext(UserDataContext)
  const { connectSocket, emitJoin, isConnected } = useContext(SocketDataContext)
  const {
    setPickup,
    setDestination,
    setActiveRide,
    resetRide,
    setCaptainLocation
  } = useContext(RideDataContext)
  const [isLoading, setisLoading] = useState(true)
  const initializedRef = useRef(false)
  const pathnameRef = useRef(location.pathname)

  useEffect(() => {
    pathnameRef.current = location.pathname
  }, [location.pathname])

  const restoreCurrentRide = useCallback(async () => {
    const response = await api.get('/rides/current')
    const currentRide = response.data.ride
    const currentPath = pathnameRef.current

    if (!currentRide) {
      resetRide()

      if (
        currentPath !== '/logout' &&
        (currentPath === '/riding' || currentPath === '/user_payment')
      ) {
        navigate('/home', { replace: true })
      }
      return
    }

    setActiveRide(currentRide)
    setPickup({
      address: currentRide.pickup,
      lat: currentRide.pickupCoordinates?.lat,
      lng: currentRide.pickupCoordinates?.lng
    })
    setDestination({
      address: currentRide.destination,
      lat: currentRide.destinationCoordinates?.lat,
      lng: currentRide.destinationCoordinates?.lng
    })

    if (currentRide.captain?.location) {
      setCaptainLocation(currentRide.captain.location)
    }

    if (currentPath === '/logout') {
      return
    }

    if (currentRide.status === 'ongoing') {
      navigate('/riding', { replace: true })
    } else if (currentRide.status === 'completed' && currentRide.paymentStatus !== 'paid') {
      navigate('/user_payment', { replace: true })
    } else if (
      (currentRide.status === 'pending' || currentRide.status === 'accepted') &&
      currentPath !== '/home'
    ) {
      navigate('/home', { replace: true })
    }
  }, [
    navigate,
    resetRide,
    setActiveRide,
    setCaptainLocation,
    setDestination,
    setPickup
  ])

  useEffect(() => {
    let isCurrent = true

    if (!token) {
      resetRide()
      navigate('/login')
      return undefined
    }

    if (initializedRef.current) {
      return undefined
    }

    const initialize = async () => {
      resetRide()

      try {
        const response = await api.get('/users/profile')
        if (!isCurrent) return

        setuser(response.data)
        connectSocket()
        emitJoin()

        try {
          await restoreCurrentRide()
        } catch {
          if (!isCurrent) return

          resetRide()

          if (pathnameRef.current === '/riding' || pathnameRef.current === '/user_payment') {
            navigate('/home', { replace: true })
          }
        }

        if (isCurrent) {
          initializedRef.current = true
          setisLoading(false)
        }
      } catch {
        if (isCurrent) {
          setisLoading(false)
          resetRide()
          localStorage.removeItem('token')
          navigate('/login')
        }
      }
    }

    initialize()

    return () => {
      isCurrent = false
    }
  }, [connectSocket, emitJoin, navigate, resetRide, restoreCurrentRide, setuser, token])

  useEffect(() => {
    if (!isConnected || !initializedRef.current) {
      return
    }

    restoreCurrentRide().catch(() => {
      // Keep the current screen when reconnect reconciliation temporarily fails.
    })
  }, [isConnected, restoreCurrentRide])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <>
      {children}
    </>
  )
}

export default UserProtectedWrap
