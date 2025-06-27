"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CSVDataLoader, LocationData } from "../lib/csv-data-loader"
import LocationSidebar from "./location-sidebar"
import type { ComplaintData } from "../lib/csv-parser"

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LeafletMapComponentProps {
  complaints: ComplaintData[]
  selectedComplaint: ComplaintData | null
  onComplaintSelect: (complaint: ComplaintData) => void
  onZoomChange: (zoomLevel: number) => void
  className?: string
}

// Custom marker icons for different categories and severities
const createCustomIcon = (category: string, severity: string) => {
  const severityColors: Record<string, string> = {
    low: "#eab308",
    medium: "#f97316", 
    high: "#ef4444",
    critical: "#b91c1c",
  }

  const categoryIcons: Record<string, string> = {
    noise: "🔊",
    air: "💨", 
    water: "💧",
    waste: "🗑️",
    other: "⚠️",
  }

  return L.divIcon({
    html: `
      <div class="relative cursor-pointer transform transition-all duration-300 hover:scale-110">
        <div class="absolute -inset-3 rounded-full opacity-20 animate-ping" style="background-color: ${severityColors[severity]}"></div>
        <div class="absolute -inset-2 rounded-full opacity-30 animate-pulse" style="background-color: ${severityColors[severity]}"></div>
        <div class="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all duration-300 hover:shadow-2xl" style="background-color: ${severityColors[severity]}">
          <span class="text-lg md:text-2xl animate-pulse">${categoryIcons[category]}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse">
          <div class="absolute inset-0.5 bg-white rounded-full animate-ping opacity-75"></div>
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  })
}

const createLocationIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative cursor-pointer transform transition-all duration-300 hover:scale-110">
        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
          <span class="text-xs">🎵</span>  
        </div>
      </div>
    `,
    className: 'location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Component to handle map events and capture map instance
function MapEventHandler({ 
  onZoomChange, 
  onMapClick,
  onMapReady
}: {
  onZoomChange: (zoom: number) => void
  onMapClick: (lat: number, lng: number) => void
  onMapReady: (map: L.Map) => void
}) {
  const map = useMap()

  // Capture map instance when ready
  useEffect(() => {
    if (map) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  useMapEvents({
    zoomend: () => {
      const zoom = map.getZoom()
      onZoomChange(zoom)
    },
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}

// Custom zoom control component - positioned externally
interface ZoomControlsProps {
  onZoomChange: (zoom: number) => void
  currentZoom: number
  onFitBounds: () => void
}

function ZoomControls({ onZoomChange, currentZoom, onFitBounds }: ZoomControlsProps) {
  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 18)
    onZoomChange(newZoom)
  }
  
  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 6)
    onZoomChange(newZoom)
  }
  
  return (
    <div className="absolute bottom-20 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={handleZoomIn}
        disabled={currentZoom >= 18}
        className="w-12 h-12 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-t-lg shadow-lg flex items-center justify-center text-gray-700 font-bold transition-all hover:scale-105 disabled:hover:scale-100 border-b border-gray-200"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        disabled={currentZoom <= 6}
        className="w-12 h-12 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center text-gray-700 font-bold transition-all hover:scale-105 disabled:hover:scale-100 border-b border-gray-200"
      >
        −
      </button>
      <button
        onClick={onFitBounds}
        className="w-12 h-12 bg-white hover:bg-gray-50 rounded-b-lg shadow-lg flex items-center justify-center text-gray-700 text-sm transition-all hover:scale-105"
        title="Fit Thailand"
      >
        ⌂
      </button>
    </div>
  )
}

export default function LeafletMapComponent({
  complaints,
  onComplaintSelect,
  onZoomChange,
  className = "",
}: LeafletMapComponentProps) {
  const [currentZoom, setCurrentZoom] = useState(10)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioVolume, setAudioVolume] = useState(0.5)
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLocationAudioPlaying, setIsLocationAudioPlaying] = useState(false)
  const csvDataLoaderRef = useRef<CSVDataLoader | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      csvDataLoaderRef.current = new CSVDataLoader()
      const locations = await csvDataLoaderRef.current.loadData()
      setLocationData(locations)
    }
    loadData()
  }, [])

  // Handle location-specific audio playback
  const handleLocationAudioPlay = async (audioUrl: string) => {
    if (!audioUrl || !audioEnabled) return

    try {
      setIsLocationAudioPlaying(true)
      
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // Create new audio element
      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = audioVolume * (currentZoom / 18) // Scale volume with zoom
      
      audioRef.current.onended = () => {
        setIsLocationAudioPlaying(false)
      }
      
      audioRef.current.onerror = () => {
        setIsLocationAudioPlaying(false)
        // Fallback to click sound
        playClickSound()
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing location audio:', error)
      setIsLocationAudioPlaying(false)
      playClickSound()
    }
  }

  const playClickSound = () => {
    if (!audioEnabled) return
    const clickAudio = new Audio('/audio/click.mp3')
    clickAudio.volume = audioVolume * 0.5
    clickAudio.play().catch(console.error)
  }

  const playZoomSound = () => {
    if (!audioEnabled) return
    const zoomAudio = new Audio('/audio/zoom.mp3')
    zoomAudio.volume = audioVolume * 0.3
    zoomAudio.play().catch(console.error)
  }

  // Stop all audio playback
  const handleStopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsLocationAudioPlaying(false)
  }

  // Handle map click to find nearest location
  const handleMapClick = (lat: number, lng: number) => {
    if (!csvDataLoaderRef.current) return

    const nearestLocation = csvDataLoaderRef.current.getLocationNearPoint(lat, lng, 0.05)
    
    if (nearestLocation) {
      handleLocationAudioPlay(nearestLocation.audioUrl)
      setSelectedLocation(nearestLocation)
      setIsSidebarOpen(true)
    } else {
      playClickSound()
    }
  }

  // Handle zoom change
  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom)
    onZoomChange(zoom)
    playZoomSound()
    
    // Update volume for currently playing audio based on zoom
    if (audioRef.current && isLocationAudioPlaying) {
      audioRef.current.volume = audioVolume * (zoom / 18)
    }
    
    // Update map zoom if map exists
    if (mapRef.current) {
      mapRef.current.setZoom(zoom)
    }
  }

  // Handle fit bounds
  const handleFitBounds = () => {
    if (mapRef.current) {
      mapRef.current.setView([13.7563, 100.5018], 10)
      setCurrentZoom(10)
      onZoomChange(10)
    }
  }

  // Handle map ready
  const handleMapReady = (map: L.Map) => {
    mapRef.current = map
  }

  // Thailand center coordinates
  const thailandCenter: [number, number] = [13.7563, 100.5018]

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        className={`w-full h-full min-h-[400px] md:min-h-[600px] rounded-lg overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:mr-80 xl:mr-96' : ''
        }`}
      >
        <MapContainer
          center={thailandCenter}
          zoom={10}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEventHandler
            onZoomChange={handleZoomChange}
            onMapClick={handleMapClick}
            onMapReady={handleMapReady}
          />

          {/* Complaint markers */}
          {complaints.map((complaint) => (
            <Marker
              key={complaint.id}
              position={[complaint.latitude, complaint.longitude]}
              icon={createCustomIcon(complaint.category, complaint.severity)}
              eventHandlers={{
                click: () => {
                  onComplaintSelect(complaint)
                  playClickSound()
                },
              }}
            >
              <Popup>
                <div className="p-4 max-w-xs">
                  <h3 className="font-bold text-lg mb-2">{complaint.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{complaint.factoryName}</p>
                  <div className="text-xs space-y-1">
                    <div>Severity: <span className="font-medium capitalize text-red-600">{complaint.severity}</span></div>
                    <div>Status: <span className="font-medium capitalize text-blue-600">{complaint.status}</span></div>
                    <div>Affected: <span className="font-medium text-green-600">{complaint.affectedResidents} residents</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Location markers from CSV */}
          {locationData.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createLocationIcon()}
              eventHandlers={{
                click: () => {
                  setSelectedLocation(location)
                  setIsSidebarOpen(true)
                  handleLocationAudioPlay(location.audioUrl)
                },
              }}
            >
              <Popup>
                <div className="p-4 max-w-xs">
                  <h3 className="font-bold text-lg mb-2">{location.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                  <button
                    onClick={() => handleLocationAudioPlay(location.audioUrl)}
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded"
                  >
                    🎵 Play Audio
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* External Zoom Controls */}
        <ZoomControls 
          onZoomChange={handleZoomChange} 
          currentZoom={currentZoom} 
          onFitBounds={handleFitBounds}
        />
      </div>

      {/* Zoom level and audio indicator */}
      <div className={`absolute top-4 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-white/20 ${
        isSidebarOpen ? 'right-4 lg:right-84 xl:right-100' : 'right-4'
      }`}>
        <div className="text-center mb-3">
          <div className="text-2xl font-bold text-blue-600 mb-1">{currentZoom}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Zoom Level</div>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`text-lg p-2 rounded-full transition-all transform hover:scale-110 ${
              audioEnabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-700">
              {Math.round(audioVolume * (currentZoom / 18) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Adj. Vol</div>
          </div>
        </div>
        {/* Sidebar toggle for mobile */}
        {selectedLocation && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-3 w-full text-xs bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 px-3 py-2 rounded-lg transition-all transform hover:scale-105 font-medium lg:hidden"
          >
            {isSidebarOpen ? '👈 Hide Details' : '👁️ Show Details'}
          </button>
        )}
      </div>

      {/* Audio Controls */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-white/20">
        <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <span className="text-lg mr-2">🎛️</span>
          Audio Controls
        </div>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-base">🎵</span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer slider"
                disabled={!audioEnabled}
              />
              <div className="text-xs text-center text-gray-500 mt-1">
                Volume: {Math.round(audioVolume * 100)}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 flex items-center">
              <span className="mr-1">🔍</span>
              Zoom Volume
            </span>
            <span className={`px-2 py-1 rounded-full font-medium ${audioEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {audioEnabled ? 'Active' : 'Off'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
            <span className="text-purple-600 font-medium flex items-center">
              <span className="mr-1">📍</span>
              Audio Locations
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold">
              {locationData.length}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Playing Indicator */}
      {isLocationAudioPlaying && (
        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-4 animate-pulse border border-white/20 backdrop-blur-sm">
          <div className="relative">
            <span className="text-2xl animate-bounce">🎵</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold mb-1">Now Playing</div>
            <div className="text-xs text-purple-100">Environmental Audio Evidence</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1 h-6 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
            <button
              onClick={handleStopAllAudio}
              className="text-white hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110"
              title="Stop Audio"
            >
              ⏹️
            </button>
          </div>
        </div>
      )}

      {/* Location Detail Sidebar */}
      <LocationSidebar
        location={selectedLocation}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false)
          setSelectedLocation(null)
          handleStopAllAudio()
        }}
        onPlayAudio={handleLocationAudioPlay}
        isAudioPlaying={isLocationAudioPlaying}
        currentZoom={currentZoom}
      />
    </div>
  )
}