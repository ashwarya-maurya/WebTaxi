import { useEffect, useLayoutEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const captainIcons = {
  Car: '🚗',
  Bike: '🏍️',
  Auto: '🛺',
}

const getCaptainIcon = (vehicleType) => new L.DivIcon({
  html: `<div style="font-size: 28px; line-height: 1;">${captainIcons[vehicleType] || '📍'}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const Recenter = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.setView(center, map.getZoom())
    }
  }, [center, map])

  return null
}

const InvalidateSizeOnMount = () => {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 0)

    return () => clearTimeout(timer)
  }, [map])

  return null
}

const ConfigureAttribution = () => {
  const map = useMap()

  useLayoutEffect(() => {
    map.attributionControl.setPrefix(false)
    map.attributionControl.setPosition('bottomright')
  }, [map])

  return null
}

const LiveMap = ({ center, pickup = null, destination = null, captainLocation = null, captainVehicleType = null, zoom = 15 }) => {

  const fallbackCenter = [28.6139, 77.2090]
  const mapCenter = center ?? fallbackCenter

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className='h-full w-full'
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ConfigureAttribution />
      <Recenter center={mapCenter} />
      <InvalidateSizeOnMount />

      {pickup && typeof pickup.lat === 'number' && typeof pickup.lng === 'number' && (
        <Marker position={[pickup.lat, pickup.lng]} icon={defaultIcon}>
          <Popup>{pickup.address || 'Pickup location'}</Popup>
        </Marker>
      )}

      {destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && (
        <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
          <Popup>{destination.address || 'Destination'}</Popup>
        </Marker>
      )}

      {captainLocation && typeof captainLocation.lat === 'number' && typeof captainLocation.lng === 'number' && (
        <Marker position={[captainLocation.lat, captainLocation.lng]} icon={getCaptainIcon(captainVehicleType)}>
          <Popup>Captain</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export default LiveMap
