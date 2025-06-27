"use client"

import { useEffect, useRef, useState } from "react"
import { 
  initializeLongdoMap, 
  addMarkerToMap, 
  addMarkerClickEvent, 
  zoomToLocation,
  fitBounds,
  addZoomEventListener,
  getCurrentZoom,
  setMapZoomWithAudio,
  MapAudioManager,
  DEFAULT_AUDIO_CONFIG,
  BANGKOK_CENTER 
} from "../lib/longdo-map"
import { CSVDataLoader, LocationData } from "../lib/csv-data-loader"
import LocationSidebar from "./location-sidebar"
import type { ComplaintData } from "../lib/csv-parser"

interface LongdoMapComponentProps {
  complaints: ComplaintData[]
  selectedComplaint: ComplaintData | null
  onComplaintSelect: (complaint: ComplaintData) => void
  onZoomChange: (zoomLevel: number) => void
  className?: string
}

export default function LongdoMapComponent({
  complaints,
  selectedComplaint,
  onComplaintSelect,
  onZoomChange,
  className = "",
}: LongdoMapComponentProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const audioManagerRef = useRef<MapAudioManager | null>(null)
  const csvDataLoaderRef = useRef<CSVDataLoader | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(10)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioVolume, setAudioVolume] = useState(0.5)
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLocationAudioPlaying, setIsLocationAudioPlaying] = useState(false)

  // Handle location-specific audio playback
  const handleLocationAudioPlay = async (audioUrl: string) => {
    if (!csvDataLoaderRef.current || !audioUrl || !audioEnabled) return

    try {
      setIsLocationAudioPlaying(true)
      
      // Calculate volume based on current zoom
      const volume = audioVolume * (currentZoom / 18) // Scale volume with zoom
      
      await csvDataLoaderRef.current.playAudio(audioUrl, volume)
      
      // Auto-stop tracking after 10 seconds (adjust based on your audio lengths)
      setTimeout(() => {
        setIsLocationAudioPlaying(false)
      }, 10000)
    } catch (error) {
      console.error('Error playing location audio:', error)
      setIsLocationAudioPlaying(false)
      
      // Fallback to general click sound
      if (audioManagerRef.current) {
        audioManagerRef.current.playClickSound()
      }
    }
  }

  // Stop all audio playback
  const handleStopAllAudio = () => {
    if (csvDataLoaderRef.current) {
      csvDataLoaderRef.current.stopAllAudio()
    }
    setIsLocationAudioPlaying(false)
  }

  const severityColors = {
    low: "#eab308",
    medium: "#f97316",
    high: "#ef4444",
    critical: "#b91c1c",
  }

  const categoryIcons = {
    noise: "🔊",
    air: "💨",
    water: "💧",
    waste: "🗑️",
    other: "⚠️",
  }

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Initialize CSV data loader
        csvDataLoaderRef.current = new CSVDataLoader()
        const locations = await csvDataLoaderRef.current.loadData()
        setLocationData(locations)

        const map = await initializeLongdoMap("longdo-map", {
          key: process.env.NEXT_PUBLIC_LONGDO_API_KEY || "demo",
          language: "en",
          zoom: {
            initial: 10,
            min: 6,
            max: 18,
          },
          controls: {
            zoom: true,
            scale: true,
            navigation: true,
            fullscreen: true,
          },
          audio: {
            ...DEFAULT_AUDIO_CONFIG,
            enabled: true,
            zoomVolumeControl: true,
          },
        })

        mapRef.current = map
        
        // Initialize audio manager
        audioManagerRef.current = new MapAudioManager({
          ...DEFAULT_AUDIO_CONFIG,
          enabled: true,
          zoomVolumeControl: true,
        })
        
        setIsMapLoaded(true)

        // Add zoom change listener using optimized function
        addZoomEventListener(map, (zoom) => {
          setCurrentZoom(zoom)
          onZoomChange(zoom)
          // Update audio volume based on zoom
          if (audioManagerRef.current) {
            audioManagerRef.current.updateVolumeFromZoom(zoom)
          }
        })

        // Add click listener with location detection and audio
        const longdo = (window as any).longdo
        if (longdo.Event) {
          longdo.Event.bind(map, "click", (event: any) => {
            const location = event.location || event
            console.log("Map clicked at:", location)
            
            // Find nearest location from CSV data
            if (csvDataLoaderRef.current && location.lat && location.lon) {
              const nearestLocation = csvDataLoaderRef.current.getLocationNearPoint(
                location.lat, 
                location.lon, 
                0.05 // 50km radius
              )
              
              if (nearestLocation) {
                // Play location-specific audio
                handleLocationAudioPlay(nearestLocation.audioUrl)
                
                // Show location details in sidebar
                setSelectedLocation(nearestLocation)
                setIsSidebarOpen(true)
              } else {
                // Play general click sound when no specific location found
                if (audioManagerRef.current) {
                  audioManagerRef.current.playClickSound()
                }
              }
            }
          })
        }
      } catch (error) {
        console.error("Failed to load Longdo Map:", error)
      }
    }

    loadMap()
    
    // Cleanup audio on unmount
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose()
      }
      if (csvDataLoaderRef.current) {
        csvDataLoaderRef.current.dispose()
      }
    }
  }, [onZoomChange])

  // Add markers for complaints and CSV locations
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current.Overlays.remove(marker)
    })
    markersRef.current = []

    // Add complaint markers
    complaints.forEach((complaint) => {
      const markerOptions = {
        title: complaint.title,
        detail: complaint.description,
        icon: {
          html: `
            <div class="relative cursor-pointer transform transition-all duration-300 hover:scale-110 ${
              selectedComplaint?.id === complaint.id ? "scale-125 z-50" : ""
            }">
              <!-- Animated rings -->
              <div class="absolute -inset-3 rounded-full opacity-20 animate-ping" style="background-color: ${severityColors[complaint.severity]}"></div>
              <div class="absolute -inset-2 rounded-full opacity-30 animate-pulse" style="background-color: ${severityColors[complaint.severity]}"></div>
              
              <!-- Main marker -->
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all duration-300 ${
                selectedComplaint?.id === complaint.id ? "animate-bounce shadow-2xl" : "hover:shadow-2xl"
              }" style="background-color: ${severityColors[complaint.severity]}">
                <span class="text-lg md:text-2xl animate-pulse">${categoryIcons[complaint.category]}</span>
              </div>
              
              <!-- Status indicator -->
              <div class="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse">
                <div class="absolute inset-0.5 bg-white rounded-full animate-ping opacity-75"></div>
              </div>
              
              <!-- Factory smoke animation for industrial complaints -->
              ${
                complaint.category === "air" || complaint.category === "noise"
                  ? `
                <div class="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2">
                  <div class="flex space-x-1">
                    <div class="w-1 md:w-2 h-4 md:h-6 bg-gray-400 opacity-60 rounded-full animate-pulse" style="animation-delay: 0s"></div>
                    <div class="w-1 md:w-2 h-6 md:h-8 bg-gray-500 opacity-50 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
                    <div class="w-1 md:w-2 h-3 md:h-4 bg-gray-400 opacity-40 rounded-full animate-pulse" style="animation-delay: 1s"></div>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          `,
          offset: { x: 25, y: 50 },
        },
        popup: {
          html: `
            <div class="p-4 max-w-xs bg-white rounded-lg shadow-lg border">
              <h3 class="font-bold text-lg mb-2">${complaint.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${complaint.factoryName}</p>
              <div class="text-xs space-y-1">
                <div>Severity: <span class="font-medium capitalize" style="color: ${severityColors[complaint.severity]}">${complaint.severity}</span></div>
                <div>Status: <span class="font-medium capitalize text-blue-600">${complaint.status}</span></div>
                <div>Affected: <span class="font-medium text-green-600">${complaint.affectedResidents} residents</span></div>
              </div>
            </div>
          `,
        },
      }

      const marker = addMarkerToMap(
        mapRef.current,
        {
          lat: complaint.latitude,
          lon: complaint.longitude,
        },
        markerOptions,
      )

      // Add click event to marker with audio
      addMarkerClickEvent(mapRef.current, marker, () => {
        onComplaintSelect(complaint)
      }, audioManagerRef.current)

      markersRef.current.push(marker)
    })

    // Add CSV location markers (different from complaint markers)
    locationData.forEach((location) => {
      const markerOptions = {
        title: location.title,
        detail: location.description,
        icon: {
          html: `
            <div class="relative cursor-pointer transform transition-all duration-300 hover:scale-110">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
                <span class="text-xs">🎵</span>
              </div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ${location.severity === 'critical' ? 'block' : 'hidden'}"></div>
              <div class="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${location.title}
              </div>
            </div>
          `,
          offset: { x: 16, y: 32 },
        },
      }

      const marker = addMarkerToMap(
        mapRef.current,
        {
          lat: location.latitude,
          lon: location.longitude,
        },
        markerOptions,
      )

      // Add click event to location marker with audio
      addMarkerClickEvent(mapRef.current, marker, () => {
        setSelectedLocation(location)
        setIsSidebarOpen(true)
        handleLocationAudioPlay(location.audioUrl)
      }, audioManagerRef.current)

      markersRef.current.push(marker)
    })
  }, [complaints, selectedComplaint, isMapLoaded, onComplaintSelect, locationData])

  // Center map on selected complaint with optimized zoom
  useEffect(() => {
    if (selectedComplaint && mapRef.current) {
      zoomToLocation(
        mapRef.current,
        {
          lat: selectedComplaint.latitude,
          lon: selectedComplaint.longitude,
        },
        15, // Higher zoom for selected complaint
        true // Smooth transition
      )
    }
  }, [selectedComplaint])

  // Auto-fit bounds when complaints change
  useEffect(() => {
    if (isMapLoaded && mapRef.current && complaints.length > 0) {
      const locations = complaints.map(complaint => ({
        lat: complaint.latitude,
        lon: complaint.longitude,
      }))
      
      // Only auto-fit if no complaint is selected
      if (!selectedComplaint) {
        setTimeout(() => {
          fitBounds(mapRef.current, locations, 50)
        }, 500) // Small delay to ensure markers are rendered
      }
    }
  }, [complaints, isMapLoaded, selectedComplaint])

  return (
    <div className={`relative ${className}`}>
      {/* Map Container with responsive width */}
      <div 
        className={`w-full h-full min-h-[400px] md:min-h-[600px] rounded-lg overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:mr-80 xl:mr-96' : ''
        }`}
      >
        <div id="longdo-map" className="w-full h-full" />
      </div>

      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Thailand Map...</p>
          </div>
        </div>
      )}

      {/* Zoom level and audio indicator */}
      <div className={`absolute top-4 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg ${
        isSidebarOpen ? 'right-4 lg:right-84 xl:right-100' : 'right-4'
      }`}>
        <div className="text-sm font-medium text-gray-700 mb-1">Zoom: {currentZoom}</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled)
              if (audioManagerRef.current) {
                audioManagerRef.current.setEnabled(!audioEnabled)
              }
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <div className="text-xs text-gray-600">
            Vol: {Math.round(audioVolume * 100)}%
          </div>
        </div>
        {/* Sidebar toggle for mobile */}
        {selectedLocation && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-2 w-full text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors lg:hidden"
          >
            {isSidebarOpen ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Audio Controls */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Audio Controls</div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">🎵</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={audioVolume}
              onChange={(e) => {
                const volume = parseFloat(e.target.value)
                setAudioVolume(volume)
                if (audioManagerRef.current) {
                  audioManagerRef.current.setBaseVolume(volume)
                }
              }}
              className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!audioEnabled}
            />
          </div>
          <div className="text-xs text-gray-500">
            Zoom: {audioEnabled ? 'Auto Volume' : 'Disabled'}
          </div>
          {/* Location counter */}
          <div className="text-xs text-purple-600 font-medium pt-1 border-t border-gray-200">
            📍 {locationData.length} locations
          </div>
        </div>
      </div>

      {/* Map controls */}
      <div className={`absolute bottom-4 transition-all duration-300 flex flex-col space-y-2 ${
        isSidebarOpen ? 'right-4 lg:right-84 xl:right-100' : 'right-4'
      }`}>
        <button
          onClick={() => {
            const currentZoom = getCurrentZoom(mapRef.current)
            setMapZoomWithAudio(mapRef.current, currentZoom + 1, audioManagerRef.current, true)
          }}
          disabled={!isMapLoaded || currentZoom >= 18}
          className="w-10 h-10 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg shadow-lg flex items-center justify-center text-gray-700 font-bold transition-all hover:scale-105 disabled:hover:scale-100"
        >
          +
        </button>
        <button
          onClick={() => {
            const currentZoom = getCurrentZoom(mapRef.current)
            setMapZoomWithAudio(mapRef.current, currentZoom - 1, audioManagerRef.current, true)
          }}
          disabled={!isMapLoaded || currentZoom <= 6}
          className="w-10 h-10 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg shadow-lg flex items-center justify-center text-gray-700 font-bold transition-all hover:scale-105 disabled:hover:scale-100"
        >
          −
        </button>
        <button
          onClick={() => {
            if (complaints.length > 0) {
              const locations = complaints.map(complaint => ({
                lat: complaint.latitude,
                lon: complaint.longitude,
              }))
              fitBounds(mapRef.current, locations, 50)
            } else {
              zoomToLocation(mapRef.current, BANGKOK_CENTER, 10, true)
            }
          }}
          disabled={!isMapLoaded}
          className="w-10 h-10 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg shadow-lg flex items-center justify-center text-gray-700 text-xs transition-all hover:scale-105 disabled:hover:scale-100"
          title="Fit all markers"
        >
          ⌂
        </button>
      </div>

      {/* Audio Playing Indicator */}
      {isLocationAudioPlaying && (
        <div className="absolute bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <span className="text-lg">🎵</span>
          <span className="text-sm font-medium">Playing Audio...</span>
          <button
            onClick={handleStopAllAudio}
            className="text-white hover:text-purple-200 ml-2"
          >
            ⏹️
          </button>
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