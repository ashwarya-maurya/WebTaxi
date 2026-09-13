import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import UserProtectedWrap from './pages/UserProtectedWrap'
import CaptainProtectedWrap from './pages/CaptainProtectedWrap'

const Start = lazy(() => import('./pages/Start'))
const UserLogin = lazy(() => import('./pages/UserLogin'))
const UserSignup = lazy(() => import('./pages/UserSignup'))
const CaptainLogin = lazy(() => import('./pages/CaptainLogin'))
const CaptainSignup = lazy(() => import('./pages/CaptainSignup'))
const Home = lazy(() => import('./pages/Home'))
const UserLogout = lazy(() => import('./pages/UserLogout'))
const CaptainHome = lazy(() => import('./pages/CaptainHome'))
const CaptianLogout = lazy(() => import('./pages/CaptianLogout'))
const Riding = lazy(() => import('./pages/Riding'))
const CaptainRiding = lazy(() => import('./pages/CaptainRiding'))
const UserPayment = lazy(() => import('./pages/UserPayment'))
const CaptainPayment = lazy(() => import('./pages/CaptainPayment'))

const App = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <Routes>
          {/* Public routes — no authentication required */}
          <Route path='/' element={<Start />} />
          <Route path='/login' element={<UserLogin />} />
          <Route path='/signup' element={<UserSignup />} />
          <Route path='/captain_login' element={<CaptainLogin />} />
          <Route path='/captain_signup' element={<CaptainSignup />} />

          {/* User protected routes — requires valid user token */}
          <Route path='/home' element={<UserProtectedWrap><Home /></UserProtectedWrap>} />
          <Route path='/logout' element={<UserProtectedWrap><UserLogout /></UserProtectedWrap>} />
          <Route path='/riding' element={<UserProtectedWrap><Riding /></UserProtectedWrap>} />
          <Route path='/user_payment' element={<UserProtectedWrap><UserPayment /></UserProtectedWrap>} />

          {/* Captain protected routes — requires valid captain token */}
          <Route path='/captain_home' element={<CaptainProtectedWrap><CaptainHome /></CaptainProtectedWrap>} />
          <Route path='/captain_logout' element={<CaptainProtectedWrap><CaptianLogout /></CaptainProtectedWrap>} />
          <Route path='/confirm_ride' element={<CaptainProtectedWrap><CaptainRiding /></CaptainProtectedWrap>} />
          <Route path='/captain_payment' element={<CaptainProtectedWrap><CaptainPayment /></CaptainProtectedWrap>} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
