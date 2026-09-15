import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext'
import api from '../services/api'
import WebTaxiLogo from '../assets/WebTaxiLogo.png'

const CaptainSignup = () => {

  const [firstname, setfirstname] = useState('')
  const [lastname, setlastname] = useState('')
  const [email, setemail] = useState('')
  const [password, setpassword] = useState('')
  const [vehicleColor, setvehicleColor] = useState('')
  const [vehicleType, setvehicleType] = useState('')
  const [vehicleCapacity, setvehicleCapacity] = useState('')
  const [vehiclePlate, setvehiclePlate] = useState('')

  const navigate = useNavigate()

  const { setcaptain } = useContext(CaptainDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()

    const captainData = {
      fullname: {
        firstname,
        lastname
      },
      email,
      password,
      vehicle: {
        color: vehicleColor,
        plate: vehiclePlate,
        capacity: Number(vehicleCapacity),
        vehicleType: vehicleType
      }
    }

    try {
      // api instance supplies baseURL + Content-Type automatically.
      // No token needed here — this is a public endpoint.
      const response = await api.post('/captains/register', captainData)

      if (response.status === 201) {
        const data = response.data
        setcaptain(data.captain)
        localStorage.setItem('token', data.token)
        navigate('/captain_home')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong')
    }

    setpassword('')
    setemail('')
    setfirstname('')
    setlastname('')
    setvehicleCapacity('')
    setvehicleColor('')
    setvehiclePlate('')
    setvehicleType('')
  }

  return (
    <div className='w-full h-screen p-5 flex flex-col bg-webtaxi-canvas text-webtaxi-ink'>
      <img className='w-40 mb-6' src={WebTaxiLogo} alt='WebTaxi' />
      <form
        onSubmit={(e) => {
          submitHandler(e)
        }}>
        <div>
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
              className='bg-webtaxi-sand mb-5 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
            />

            <input
              onChange={(e) => {
                setlastname(e.target.value)
              }}
              value={lastname}
              type="text"
              placeholder='Last name'
              className='bg-webtaxi-sand mb-5 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
            />
          </div>

          <h2 className='text-lg mb-2 font-medium'>What's your email</h2>
          <input
            onChange={(e) => {
              setemail(e.target.value)
            }}
            value={email}
            placeholder='email@example.com'
            required
            type='email'
            className='bg-webtaxi-sand mb-5 text-lg px-4 py-2 w-full rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
          />

          <h2 className='text-lg mb-2 font-medium'>Enter Password</h2>
          <input
            onChange={(e) => {
              setpassword(e.target.value)
            }}
            value={password}
            required
            type="password"
            placeholder='password'
            className='bg-webtaxi-sand mb-5 text-lg px-4 py-2 w-full rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
          />

          <h2 className='text-lg mb-2 font-medium'>Vehicle Information</h2>
          <div className='flex gap-2'>
            <input
              onChange={(e) => {
                setvehicleColor(e.target.value)
              }}
              value={vehicleColor}
              required
              placeholder='Vehicle Color'
              type="text"
              className='bg-webtaxi-sand mb-3 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
            />
            <input
              onChange={(e) => {
                setvehiclePlate(e.target.value)
              }}
              value={vehiclePlate}
              required
              placeholder='Vehicle Plate'
              type="text"
              className='bg-webtaxi-sand mb-3 text-lg px-4 py-2 w-full md:w-1/2 rounded placeholder:text-base outline-none focus:ring-2 focus:ring-captain-primary'
            />
          </div>

          <div className='flex gap-2'>
            <input
              onChange={(e) => {
                setvehicleCapacity(e.target.value)
              }}
              value={vehicleCapacity}
              required
              placeholder='Seating capacity'
              type="number"
              className='bg-webtaxi-sand mb-8 text-lg px-4 py-2 w-full md:w-1/2 rounded outline-none focus:ring-2 focus:ring-captain-primary'
            />
            <select
              onChange={(e) => {
                setvehicleType(e.target.value)
              }}
              value={vehicleType}
              required
              className='bg-webtaxi-sand mb-8 text-base px-4 py-2 w-full md:w-1/2 rounded outline-none focus:ring-2 focus:ring-captain-primary'>
              <option value='' disabled>Vehicle Type</option>
              <option value='Car'>Car</option>
              <option value='Bike'>Bike</option>
              <option value='Auto'>Auto</option>
            </select>
          </div>
        </div>

        <div>
          <button
            type='submit'
            className='w-full bg-captain-primary font-medium text-lg text-webtaxi-canvas rounded px-4 py-3 mb-1'>Create Captain Account</button>
          <p className='text-center'>Already have account? <Link to='/captain_login' className='text-captain-accent'>Login here</Link></p>
        </div>
      </form>
    </div>
  )
}

export default CaptainSignup
