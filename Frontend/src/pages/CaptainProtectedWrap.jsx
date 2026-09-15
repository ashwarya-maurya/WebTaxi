import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext'
import { SocketDataContext } from '../context/SocketContext'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const CaptainProtectedWrap = ({ children }) => {

  const token = localStorage.getItem('token')
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoading, setisLoading] = useState(true)
  const { setcaptain } = useContext(CaptainDataContext)
  const { connectSocket, emitJoin, isConnected } = useContext(SocketDataContext)
  const { setActiveRide, clearActiveRide, resetRide } = useContext(RideDataContext)
  const initializedRef = useRef(false)
  const pathnameRef = useRef(location.pathname)

  useEffect(() => {
    pathnameRef.current = location.pathname
  }, [location.pathname])

  const restoreCurrentRide = useCallback(async () => {
    const response = await api.get('/rides/current-captain')
    const currentRide = response.data.ride
    const currentPath = pathnameRef.current

    if (!currentRide) {
      clearActiveRide({ preservePendingOffer: true })

      if (
        currentPath !== '/captain_logout' &&
        (currentPath === '/confirm_ride' || currentPath === '/captain_payment')
      ) {
        navigate('/captain_home', { replace: true })
      }
      return
    }

    setActiveRide(currentRide)

    if (currentPath === '/captain_logout') {
      return
    }

    if (currentRide.status === 'accepted' || currentRide.status === 'ongoing') {
      navigate('/confirm_ride', { replace: true })
    } else if (currentRide.status === 'completed' && currentRide.paymentStatus !== 'paid') {
      navigate('/captain_payment', { replace: true })
    }
  }, [clearActiveRide, navigate, setActiveRide])

  useEffect(() => {
    let isCurrent = true

    if (!token) {
      resetRide()
      navigate('/captain_login')
      return undefined
    }

    const initialize = async () => {
      resetRide()

      try {
        const response = await api.get('/captains/profile')
        if (!isCurrent) return

        setcaptain(response.data)
        connectSocket()
        emitJoin()

        try {
          await restoreCurrentRide()
        } catch {
          if (!isCurrent) return

          clearActiveRide({ preservePendingOffer: true })

          if (pathnameRef.current === '/confirm_ride' || pathnameRef.current === '/captain_payment') {
            navigate('/captain_home', { replace: true })
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
          navigate('/captain_login')
        }
      }
    }

    initialize()

    return () => {
      isCurrent = false
    }
  }, [clearActiveRide, connectSocket, emitJoin, navigate, resetRide, restoreCurrentRide, setcaptain, token])

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
      <div className="h-screen flex items-center justify-center bg-webtaxi-canvas text-webtaxi-ink">
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-webtaxi-canvas text-webtaxi-ink'>
      {children}
    </div>
  )
}

export default CaptainProtectedWrap
