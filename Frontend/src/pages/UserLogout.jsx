import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketDataContext } from '../context/SocketContext'
import { RideDataContext } from '../context/RideContext'
import api from '../services/api'

const UserLogout = () => {
  const navigate = useNavigate()
  const { disconnectSocket } = useContext(SocketDataContext)
  const { resetRide } = useContext(RideDataContext)

  useEffect(() => {
    api.get('/users/logout')
      .then((response) => {
        if (response.status === 200) {
          localStorage.removeItem('token')
          disconnectSocket()
          resetRide()
          navigate('/login')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        disconnectSocket()
        resetRide()
        navigate('/login')
      })
  }, [disconnectSocket, navigate, resetRide])

  return <></>
}

export default UserLogout
