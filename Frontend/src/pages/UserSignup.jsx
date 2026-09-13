import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import api from '../services/api'        
import WebTaxiLogo from '../assets/WebTaxiLogo.png'

const UserSignup = () => {

  const [firstname, setfirstname] = useState('')
  const [lastname, setlastname] = useState('')
  const [email, setemail] = useState('')
  const [password, setpassword] = useState('')

  const navigate = useNavigate()

  const { user, setuser } = useContext(UserDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()
    const newUser = {
      fullname: {
        firstname: firstname,
        lastname: lastname
      },
      email: email,
      password: password
    }

    try {
      const response = await api.post('/users/register', newUser)

      if (response.status === 201) {
        const data = response.data
        setuser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong')
    }

    setpassword('')
    setemail('')
    setfirstname('')
    setlastname('')
  }

  return (
    <div className='w-full h-screen p-5 flex justify-between flex-col '>
      <div>
        <img className='w-40 mb-8' src={WebTaxiLogo} alt='WebTaxi' />
        <form
          onSubmit={(e) => {
            submitHandler(e)
          }} >

          <h2 className='text-lg mb-2 font-medium'>What's your name</h2>
          <div className='flex gap-2'>
            <input
              onChange={(e) => {
                setfirstname(e.target.value)
              }}
              type="text"
              required
              value={firstname}
              placeholder='First name'
              className='bg-[#EEEEEE] mb-8 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-black'
            />
            <input
              onChange={(e) => {
                setlastname(e.target.value)
              }}
              value={lastname}
              type="text"
              placeholder='Last name'
              className='bg-[#EEEEEE] mb-8 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-black'
            />
          </div>

          <h2 className='text-lg mb-2 font-medium'>What's your email</h2>
          <input
            onChange={(e) => {
              setemail(e.target.value)
            }}
            value={email}
            className='bg-[#EEEEEE] mb-8 text-lg px-4 py-2 w-full rounded placeholder:text-base outline-none focus:ring-2 focus:ring-black'
            placeholder='email@example.com'
            required
            type='email' />

          <h2 className='text-lg mb-2 font-medium'>Enter Password</h2>
          <input
            onChange={(e) => {
              setpassword(e.target.value)
            }}
            value={password}
            className='bg-[#EEEEEE] mb-8 text-lg px-4 py-2 w-full rounded placeholder:text-base outline-none focus:ring-2 focus:ring-black'
            required
            type="password"
            placeholder='password' />

          <button
            type='submit'
            className='w-full bg-black font-medium text-lg text-white rounded px-4 py-2'>Create account</button>

        </form>
        <p className='mt-1  text-center'>Already have account? <Link to='/login' className='text-blue-600'>Login here</Link></p>

      </div>
    </div>
  )
}

export default UserSignup
