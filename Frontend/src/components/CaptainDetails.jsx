const CaptainDetails = ({ captain }) => {
  return (
    <div>
        <div className='flex justify-between items-center rounded-lg p-2 mb-3 bg-captain-accent text-webtaxi-ink'>
         <div className='flex gap-1 items-center'>
          <img className='w-13 rounded-full' src='https://cdn-icons-png.flaticon.com/512/8583/8583437.png'/>
          <h2 className='text-xl font-semibold'>
          {
              captain
                  ? `${captain.fullname.firstname} ${captain.fullname.lastname}`
                  : "Captain"
          }
          </h2>
        </div>

        <div>
          <h2 className='text-2xl font-semibold text-center'>₹456.64</h2>
          <p className='text-sm text-center font-thin text-webtaxi-charcoal'>Total Earning</p>
        </div>
       </div>

        <div className='flex items-center justify-between p-3 bg-webtaxi-sand rounded-lg'>
          <div>
            <i className='text-4xl ri-time-line ml-4'></i>
            <h3 className='text-xl font-semibold text-center'>12</h3>
            <p className='text-xs text-center font-thin text-webtaxi-charcoal/70'>Hours Online</p>
          </div>

          <div>
            <i className='text-4xl ri-speed-up-line ml-5'></i>
            <h3 className='text-xl font-semibold text-center'>45</h3>
            <p className='text-xs text-center font-thin text-webtaxi-charcoal/70'>Average Speed</p>
          </div>

          <div>
            <i className='text-4xl ri-booklet-line ml-2'></i>
            <h3 className='text-xl font-semibold text-center'>69</h3>
            <p className='text-xs text-center font-thin text-webtaxi-charcoal/70'>Total Rides</p>
            
          </div>
        </div>
    </div>
  )
}

export default CaptainDetails
