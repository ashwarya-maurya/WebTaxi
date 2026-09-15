import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketDataContext } from '../context/SocketContext'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const CaptianLogout = () => {
  const navigate = useNavigate()
  const { disconnectSocket } = useContext(SocketDataContext)
  const { resetRide } = useContext(RideDataContext)

  useEffect(() => {
    api.get('/captains/logout')
      .then((response) => {
        if (response.status === 200) {
          localStorage.removeItem('token')
          disconnectSocket()
          resetRide()
          navigate('/captain_login')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        disconnectSocket()
        resetRide()
        navigate('/captain_login')
      })
  }, [disconnectSocket, navigate, resetRide])

  return <></>
}

export default CaptianLogout
