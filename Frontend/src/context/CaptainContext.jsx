import { createContext, useState } from 'react'

// Context and provider intentionally share this small module.
// eslint-disable-next-line react-refresh/only-export-components
export const CaptainDataContext = createContext()

const CaptainContext = ({ children }) => {

  const [captain, setcaptain] = useState({
    fullname: {
      firstname: '',
      lastname: ''
    },
    email: '',
    vehicle: {
      color: '',
      plate: '',
      capacity: '',
      vehicleType: ''
    }
  })

  return (
    <CaptainDataContext.Provider value={{ captain, setcaptain }}>
      {children}
    </CaptainDataContext.Provider>
  )
}

export default CaptainContext
