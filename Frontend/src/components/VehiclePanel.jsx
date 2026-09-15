const VehiclePanel = (props) => {

  const estimate = props.estimate || {}

  const formatFare = (value) => {
    if (value === null || value === undefined) {
      return '—'
    }
    return `₹${value}`
  }

  const hasValidFares = ['Car', 'Bike', 'Auto'].every((vehicleType) => (
    Number.isFinite(estimate[vehicleType]) && estimate[vehicleType] >= 0
  ))

  const selectVehicle = (vehicleType) => {
    if (!hasValidFares) {
      return
    }

    props.setSelectedVehicleType(vehicleType)
    props.setconfirmRidePanelOpen(true)
  }

  return (
    <div>
      <h5 onClick={() => {
        props.setvehiclePanelOpen(false)
      }} className='text-center absolute top-0 w-[95%]'><i className="text-2xl text-webtaxi-charcoal/50 ri-arrow-down-wide-line"></i></h5>

      <h4 className='text-2xl font-bold mb-5'>Choose the Vehicle</h4>

      <div onClick={() => {
        selectVehicle('Car')
      }} aria-disabled={!hasValidFares} className={`border-3 border-webtaxi-canvas active:border-user-primary flex items-center gap-3 p-4 rounded-2xl mb-3 ${hasValidFares ? '' : 'opacity-50 cursor-not-allowed'}`}>

        <img
          className='h-11'
          src="https://www.asaproadworthys.com.au/wp-content/uploads/2021/11/Select.jpeg"
          alt="Car"
        />

        <div className='flex-1'>
          <h4 className='text-lg font-semibold'>
            Taxi Car <span className='text-sm font-normal'><i className="ri-user-3-fill"></i>4</span>
          </h4>
          <h5 className='text-sm'>2 mins away</h5>
          <p className='text-webtaxi-charcoal/70 text-sm'>Affordable, compact rides</p>
        </div>

        <h4 className='text-lg font-semibold'>{formatFare(estimate.Car)}</h4>
      </div>


      <div onClick={() => {
        selectVehicle('Bike')
      }} aria-disabled={!hasValidFares} className={`border-3 border-webtaxi-canvas active:border-user-primary flex items-center gap-4 p-4 rounded-2xl mb-3 ${hasValidFares ? '' : 'opacity-50 cursor-not-allowed'}`}>

        <img
          className='h-13 px-2.5'
          src="https://cn-geo1.uber.com/image-proc/crop/resizecrop/udam/format=auto/width=552/height=552/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC91ZGFtLWFzc2V0cy85NTM4NTEyZC1mZGUxLTRmNzMtYmQ1MS05Y2VmZjRlMjU0ZjEucG5n"
          alt="Moto"
        />

        <div className='flex-1'>
          <h4 className='text-lg font-semibold'>
            Moto <span className='text-sm font-normal'><i className="ri-user-3-fill"></i>1</span>
          </h4>
          <h5 className='text-sm'>3 mins away</h5>
          <p className='text-webtaxi-charcoal/70 text-sm'>Affordable motorcycle rides</p>
        </div>

        <h4 className='text-lg font-semibold'>{formatFare(estimate.Bike)}</h4>
      </div>


      <div onClick={() => {
        selectVehicle('Auto')
      }} aria-disabled={!hasValidFares} className={`border-3 border-webtaxi-canvas active:border-user-primary flex items-center gap-4 p-4 rounded-2xl ${hasValidFares ? '' : 'opacity-50 cursor-not-allowed'}`}>

        <img
          className='h-18'
          src="https://cn-geo1.uber.com/image-proc/crop/resizecrop/udam/format=auto/width=552/height=552/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC91ZGFtLWFzc2V0cy9mYzEwMWZmOC04MWExLTQ2YzMtOTk1YS02N2I0YmJkMmYyYmYuanBn"
          alt="Auto"
        />

        <div className='flex-1'>
          <h4 className='text-lg font-semibold'>
            Auto <span className='text-sm font-normal'><i className="ri-user-3-fill"></i>3</span>
          </h4>
          <h5 className='text-sm'>1 mins away</h5>
          <p className='text-webtaxi-charcoal/70 text-sm'>Affordable auto rides</p>
        </div>

        <h4 className='text-lg font-semibold'>{formatFare(estimate.Auto)}</h4>
      </div>

    </div>
  )
}

export default VehiclePanel
