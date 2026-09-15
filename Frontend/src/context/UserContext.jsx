import { createContext, useState } from 'react'

// Context and provider intentionally share this small module.
// eslint-disable-next-line react-refresh/only-export-components
export const UserDataContext = createContext()

const UserContext = ({ children }) => {

  const [user, setuser] = useState({
    fullname: {
      firstname: '',
      lastname: ''
    },
    email: ''
  })

  return (
    <UserDataContext.Provider value={{ user, setuser }}>
      {children}
    </UserDataContext.Provider>
  )
}

export default UserContext
