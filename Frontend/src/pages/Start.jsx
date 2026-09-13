import React from 'react'
import { Link } from 'react-router-dom'
import WebTaxiLogo from '../assets/WebTaxiLogo.png'

const Start = () => {
  return (
    <div>
        <div className='bg-center bg-cover flex justify-between flex-col h-screen w-full bg-[url(https://images.unsplash.com/photo-1572013343866-dfdb9b416810?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)]'>
            <img className='ml-1 mt-1 w-40' src={WebTaxiLogo} alt="WebTaxi" />
            <div className='bg-white px-5 py-6 rounded-t-2xl'>
                <h2 className='text-2xl font-bold'>Get Started with WebTaxi</h2>
                <Link to='/login' className='flex items-center justify-center bg-black text-white py-3 mt-5 rounded-md font-semibold'>Continue</Link>
            </div>
        </div>
    </div>
  )
}

export default Start
