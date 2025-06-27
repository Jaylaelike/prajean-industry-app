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
        <div class="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
          <span class="text-lg">🏭</span>  
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
          <div class="absolute inset-0.5 bg-white rounded-full animate-ping opacity-75"></div>
        </div>
        <!-- Factory smoke animation -->
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div class="flex space-x-1">
            <div class="w-1 h-3 bg-gray-400 opacity-60 rounded-full animate-pulse" style="animation-delay: 0s"></div>
            <div class="w-1 h-4 bg-gray-500 opacity-50 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
            <div class="w-1 h-2 bg-gray-400 opacity-40 rounded-full animate-pulse" style="animation-delay: 1s"></div>
          </div>
        </div>
      </div>
    `,
    className: 'location-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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
  const [currentZoom, setCurrentZoom] = useState(9)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioVolume, setAudioVolume] = useState(0.1)
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLocationAudioPlaying, setIsLocationAudioPlaying] = useState(false)
  const [autoPlayTriggered, setAutoPlayTriggered] = useState(false)
  const [autoLoopMode, setAutoLoopMode] = useState(false)
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0)
  const csvDataLoaderRef = useRef<CSVDataLoader | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const nearestLocationRef = useRef<any>(null)
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const randomOrderRef = useRef<number[]>([])
  const isLoopingRef = useRef(false)

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      csvDataLoaderRef.current = new CSVDataLoader()
      const locations = await csvDataLoaderRef.current.loadData()
      setLocationData(locations)
    }
    loadData()
  }, [])

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current)
      }
    }
  }, [])

  // Calculate optimized volume based on zoom level
  const calculateOptimizedVolume = (baseVolume: number, zoomLevel: number): number => {
    // Optimized volume curve: more gradual at low zoom, more responsive at high zoom
    const minZoom = 6
    const maxZoom = 18
    const normalizedZoom = Math.max(0, Math.min(1, (zoomLevel - minZoom) / (maxZoom - minZoom)))
    
    // Use exponential curve for more natural volume scaling
    const volumeMultiplier = Math.pow(normalizedZoom, 0.7) * 0.9 + 0.1 // Range: 0.1 to 1.0
    return Math.min(1.0, baseVolume * volumeMultiplier)
  }

  // Calculate auto-play volume based on zoom level (starts at 30% when zoom >= 13)
  const calculateAutoPlayVolume = (zoomLevel: number): number => {
    if (zoomLevel < 13) return 0
    
    // Base volume is 30% when zoom = 13, increases with zoom
    const baseVolume = 0.3
    const zoomBonus = (zoomLevel - 13) * 0.05 // 5% increase per zoom level above 13
    return Math.min(1.0, baseVolume + zoomBonus)
  }

  // Find nearest location to current map center
  const findNearestLocation = () => {
    if (!mapRef.current || locationData.length === 0) return null
    
    const center = mapRef.current.getCenter()
    let nearestLocation = null
    let minDistance = Infinity
    
    locationData.forEach(location => {
      const distance = Math.sqrt(
        Math.pow(center.lat - location.latitude, 2) + 
        Math.pow(center.lng - location.longitude, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestLocation = location
      }
    })
    
    return nearestLocation
  }

  // Generate random order for loop mode
  const generateRandomOrder = () => {
    const indices = Array.from({ length: locationData.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }

  // Fly to specific location
  const flyToLocation = (location: any, zoomLevel = 15) => {
    if (!mapRef.current) return
    
    mapRef.current.flyTo([location.latitude, location.longitude], zoomLevel, {
      duration: 2, // 2 second flight duration
      easeLinearity: 0.25
    })
  }

  // Handle single loop iteration
  const executeLoopIteration = () => {
    // Use complaints data instead of locationData for better compatibility
    const dataToUse = complaints.length > 0 ? complaints : locationData
    
    console.log('executeLoopIteration called', {
      autoLoopMode,
      dataLength: dataToUse.length,
      mapExists: !!mapRef.current,
      currentLoopIndex,
      randomOrder: randomOrderRef.current
    })
    
    if (!autoLoopMode || dataToUse.length === 0 || !mapRef.current) {
      console.log('executeLoopIteration early return')
      return
    }

    // Get current location from random order
    const locationIndex = randomOrderRef.current[currentLoopIndex]
    const location = dataToUse[locationIndex]
    
    console.log('Processing location:', location)
    
    if (location) {
      // Fly to location
      console.log('Flying to location:', location.latitude, location.longitude)
      flyToLocation(location, 16) // Zoom level 16 for good detail
      
      // Update selected location and show sidebar
      setSelectedLocation(location)
      setIsSidebarOpen(true)
      
      // Play audio after a short delay to allow map to fly
      if (location.audioUrl) {
        setTimeout(() => {
          if (autoLoopMode && location.audioUrl) {
            console.log('Playing audio for location:', location.audioUrl)
            handleLocationAudioPlay(location.audioUrl, false) // Use manual volume, not auto-play
          }
        }, 2500) // Wait for fly animation to complete
      }
      
      // Move to next location index
      const nextIndex = (currentLoopIndex + 1) % randomOrderRef.current.length
      setCurrentLoopIndex(nextIndex)
      
      console.log('Moving to next index:', nextIndex)
      
      // If we've completed all locations, generate new random order
      if (nextIndex === 0) {
        console.log('Regenerating random order')
        const indices = Array.from({ length: dataToUse.length }, (_, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }
        randomOrderRef.current = indices
      }
    } else {
      console.log('No location found at index:', locationIndex)
    }
  }

  // Start auto-loop mode
  const startAutoLoop = () => {
    // Use complaints data instead of locationData for better compatibility
    const dataToUse = complaints.length > 0 ? complaints : locationData
    
    console.log('Starting auto-loop with data:', dataToUse.length, 'items')
    console.log('Data:', dataToUse)
    
    if (dataToUse.length === 0) {
      console.log('No data available for auto-loop')
      return
    }
    
    setAutoLoopMode(true)
    isLoopingRef.current = true
    
    // Generate initial random order based on available data
    const indices = Array.from({ length: dataToUse.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    randomOrderRef.current = indices
    setCurrentLoopIndex(0)
    
    console.log('Random order generated:', randomOrderRef.current)
    
    // Execute first iteration immediately
    executeLoopIteration()
    
    // Set up interval for subsequent iterations
    loopIntervalRef.current = setInterval(() => {
      if (isLoopingRef.current) {
        console.log('Executing interval iteration')
        executeLoopIteration()
      }
    }, 15000) // 15 second delay
  }

  // Stop auto-loop mode
  const stopAutoLoop = () => {
    setAutoLoopMode(false)
    isLoopingRef.current = false
    
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current)
      loopIntervalRef.current = null
    }
    
    // Stop any playing audio
    handleStopAllAudio()
    
    // Reset to initial map view
    if (mapRef.current) {
      mapRef.current.flyTo([14.0228637, 101.3021549], 9, {
        duration: 2,
        easeLinearity: 0.25
      })
    }
    
    // Close sidebar
    setIsSidebarOpen(false)
    setSelectedLocation(null)
  }

  // Toggle auto-loop mode
  const toggleAutoLoop = () => {
    if (autoLoopMode) {
      stopAutoLoop()
    } else {
      startAutoLoop()
    }
  }

  // Handle location-specific audio playback
  const handleLocationAudioPlay = async (audioUrl: string, useAutoPlayVolume = false) => {
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
      audioRef.current.volume = useAutoPlayVolume 
        ? calculateAutoPlayVolume(currentZoom) 
        : calculateOptimizedVolume(audioVolume, currentZoom)
      
      audioRef.current.onended = () => {
        setIsLocationAudioPlaying(false)
        setAutoPlayTriggered(false)
      }
      
      audioRef.current.onerror = () => {
        setIsLocationAudioPlaying(false)
        setAutoPlayTriggered(false)
        // Fallback to click sound
        playClickSound()
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing location audio:', error)
      setIsLocationAudioPlaying(false)
      setAutoPlayTriggered(false)
      playClickSound()
    }
  }

  // Handle auto-play based on zoom level
  const handleAutoPlay = (zoomLevel: number) => {
    if (zoomLevel >= 13 && !autoPlayTriggered && !isLocationAudioPlaying) {
      const nearestLocation = findNearestLocation()
      if (nearestLocation && nearestLocation.audioUrl) {
        nearestLocationRef.current = nearestLocation
        setAutoPlayTriggered(true)
        handleLocationAudioPlay(nearestLocation.audioUrl, true) // Use auto-play volume
      }
    } else if (zoomLevel < 13 && (autoPlayTriggered || isLocationAudioPlaying)) {
      // Stop audio when zooming below level 13
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsLocationAudioPlaying(false)
      setAutoPlayTriggered(false)
      nearestLocationRef.current = null
    } else if (zoomLevel >= 13 && autoPlayTriggered && audioRef.current && nearestLocationRef.current) {
      // Update volume for auto-playing audio when zoom changes
      audioRef.current.volume = calculateAutoPlayVolume(zoomLevel)
    }
  }

  const playClickSound = () => {
    if (!audioEnabled) return
    const clickAudio = new Audio('/audio/click.mp3')
    clickAudio.volume = calculateOptimizedVolume(audioVolume, currentZoom) * 0.6
    clickAudio.play().catch(console.error)
  }

  const playZoomSound = () => {
    if (!audioEnabled) return
    const zoomAudio = new Audio('/audio/zoom.mp3')
    zoomAudio.volume = calculateOptimizedVolume(audioVolume, currentZoom) * 0.4
    zoomAudio.play().catch(console.error)
  }

  // Stop all audio playback
  const handleStopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsLocationAudioPlaying(false)
    setAutoPlayTriggered(false)
    nearestLocationRef.current = null
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
    
    // Handle auto-play functionality based on zoom level
    handleAutoPlay(zoom)
    
    // Update volume for currently playing audio based on optimized zoom calculation
    if (audioRef.current && isLocationAudioPlaying && !autoPlayTriggered) {
      audioRef.current.volume = calculateOptimizedVolume(audioVolume, zoom)
    }
    
    // Update map zoom if map exists
    if (mapRef.current) {
      mapRef.current.setZoom(zoom)
    }
  }

  // Handle fit bounds
  const handleFitBounds = () => {
    if (mapRef.current) {
      mapRef.current.setView([14.0228637, 101.3021549], 9)
      setCurrentZoom(9)
      onZoomChange(9)
    }
  }

  // Handle map ready
  const handleMapReady = (map: L.Map) => {
    mapRef.current = map
  }

  // Prachinburi province center coordinates
  const thailandCenter: [number, number] = [14.0228637, 101.3021549]

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div 
        className={`w-full h-full min-h-[400px] md:min-h-[600px] rounded-lg overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:mr-80 xl:mr-96' : ''
        }`}
      >
        <MapContainer
          center={thailandCenter}
          zoom={9}
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
                  <h3 className="font-bold text-lg mb-2 flex items-center">
                    <span className="mr-2">🏭</span>
                    {location.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    <strong>Factory:</strong> {location.factoryName}
                  </div>
                  <button
                    onClick={() => handleLocationAudioPlay(location.audioUrl)}
                    className="w-full text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>🎧</span>
                    <span>Play Environmental Audio</span>
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
              {Math.round(calculateOptimizedVolume(audioVolume, currentZoom) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Effective Vol</div>
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

      {/* Audio Controls - Always Visible */}
      <div className="absolute top-4 left-4 bg-white rounded-xl px-4 py-3 shadow-2xl border-2 border-blue-500 z-[1001] min-w-[280px] max-w-[320px]">
        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center">
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
                disabled={!audioEnabled || autoLoopMode}
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
          
          {/* Auto-Loop Toggle Button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={toggleAutoLoop}
              disabled={!audioEnabled || (complaints.length === 0 && locationData.length === 0)}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-medium text-xs transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                autoLoopMode
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md'
              }`}
            >
              <span className="text-sm">
                {autoLoopMode ? '⏹️' : '🔄'}
              </span>
              <span>
                {autoLoopMode ? 'Stop Auto-Tour' : 'Start Auto-Tour'}
              </span>
            </button>
            {autoLoopMode && (
              <div className="text-xs text-center text-gray-500 mt-1 animate-pulse">
                Next location in {15 - (Date.now() % 15000) / 1000 | 0}s
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-medium flex items-center">
              <span className="mr-1">🏭</span>
              Factory Locations
            </span>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-bold">
              {locationData.length}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Playing Indicator */}
      {(isLocationAudioPlaying || autoLoopMode) && (
        <div className={`absolute bottom-4 left-4 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-4 animate-pulse border border-white/20 backdrop-blur-sm ${
          autoLoopMode
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
            : autoPlayTriggered 
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600' 
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600'
        }`}>
          <div className="relative">
            <span className="text-2xl animate-bounce">
              {autoLoopMode ? '🚁' : autoPlayTriggered ? '🔊' : '🎵'}
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold mb-1">
              {autoLoopMode 
                ? `Auto-Tour ${isLocationAudioPlaying ? '(Playing)' : '(Flying)'}`
                : autoPlayTriggered 
                  ? 'Auto-Playing' 
                  : 'Now Playing'
              }
            </div>
            <div className="text-xs opacity-90">
              {autoLoopMode 
                ? `Location ${currentLoopIndex + 1}/${complaints.length > 0 ? complaints.length : locationData.length} • Next in ${15}s`
                : autoPlayTriggered 
                  ? `Vol: ${Math.round(calculateAutoPlayVolume(currentZoom) * 100)}% (Zoom ${currentZoom})`
                  : 'Environmental Audio Evidence'
              }
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1 h-6 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
            <button
              onClick={autoLoopMode ? toggleAutoLoop : handleStopAllAudio}
              className="text-white hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110"
              title={autoLoopMode ? "Stop Auto-Tour" : "Stop Audio"}
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