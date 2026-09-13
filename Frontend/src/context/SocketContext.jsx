import React, { createContext, useCallback, useRef, useState } from 'react'
import { io } from 'socket.io-client'

// Context and provider intentionally share this small module.
// eslint-disable-next-line react-refresh/only-export-components
export const SocketDataContext = createContext()

const SocketContext = ({ children }) => {

  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      return null
    }

    if (socketRef.current?.auth?.token === token) {
      return socketRef.current
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(import.meta.env.VITE_BASE_URL, {
      withCredentials: true,
      autoConnect: true,
      auth: { token }
    })

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
    })

    socketRef.current = socket
    return socket
  }, [])

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  const emitJoin = useCallback(() => {
    const socket = socketRef.current
    if (socket) {
      socket.emit('join')
    }
  }, [])

  const getSocket = useCallback(() => socketRef.current, [])

  return (
    <SocketDataContext.Provider value={{
      isConnected,
      connectSocket,
      disconnectSocket,
      emitJoin,
      getSocket
    }}>
      {children}
    </SocketDataContext.Provider>
  )
}


export default SocketContext
