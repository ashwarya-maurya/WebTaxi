import React from 'react'

const LocationSearchPanel = (props) => {

  const suggestions = props.suggestions || []

  if (props.status === 'resolving') {
    return <div className='text-center text-gray-400 py-6'>Setting location...</div>
  }

  if (props.status === 'fare-loading') {
    return <div className='text-center text-gray-400 py-6'>Calculating fare...</div>
  }

  if (suggestions.length === 0) {
    return (
      <div className='text-center text-gray-400 py-6'>
        {props.isLoading
          ? 'Searching...'
          : props.message || 'Start typing to search for a location'}
      </div>
    )
  }

  return (
    <div>
      {
        suggestions.map((place, idx) => {
          return (
            <div
              key={place.placeId ?? idx}
              onClick={() => {
                props.onSelectLocation(place)
              }}
              className='flex items-center justify-between gap-2 w-full mb-4 rounded-xl border-2 border-white active:border-black p-2'
            >
              <h3 className='px-3 py-2 bg-[#EEEEEE] rounded-full'>
                <i className="text-xl ri-map-pin-2-fill"></i>
              </h3>
              <h4 className='font-medium'>{place.displayName}</h4>
            </div>
          )
        })
      }
    </div>
  )
}

export default LocationSearchPanel
