import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import api from '../services/api'        
import WebTaxiLogo from '../assets/WebTaxiLogo.png'

const UserLogin = () => {

  const [email, setemail] = useState('')
  const [password, setpassword] = useState('')

  const { setuser } = useContext(UserDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()

    const userData = {
      email: email,
      password: password
    }

    try {
      const response = await api.post('/users/login', userData)

      if (response.status === 200) {
        const data = response.data
        setuser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login Failed')
    }

    setpassword('')
    setemail('')
  }

  return (
    <div className='w-full h-screen p-5 flex justify-between flex-col '>
      <div>
        <img className='w-40 mb-8' src={WebTaxiLogo} alt='WebTaxi' />
        <form
          onSubmit={(e) => {
            submitHandler(e)
          }} >

          <h2 className='text-lg mb-2 font-medium'>What's your email ?</h2>
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
            className='w-full bg-black font-medium text-lg text-white rounded px-4 py-2'>Login</button>

        </form>
        <p className='mt-1  text-center'>New here? <Link to='/signup' className='text-blue-600'>Create New Account</Link></p>

      </div>
      <div>
        <Link to='/captain_login' className='border border-gray-400 w-full text-black font-medium text-lg bg-orange-500 rounded px-4 py-2 flex items-center justify-center'>Sign In as Captain</Link>
      </div>
    </div>
  )
}

export default UserLogin
