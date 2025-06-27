// Longdo Map integration utilities
export interface LongdoMapConfig {
  key: string
  language: string
  zoom?: {
    initial: number
    min: number
    max: number
  }
  controls?: {
    zoom: boolean
    scale: boolean
    navigation: boolean
    fullscreen: boolean
  }
  audio?: {
    enabled: boolean
    clickSound?: string
    zoomVolumeControl?: boolean
    baseVolume?: number
  }
}

export interface MapLocation {
  lat: number
  lon: number
}

export interface ZoomConfig {
  initial: number
  min: number
  max: number
}

export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  initial: 10,
  min: 6,
  max: 18,
}

export const DEFAULT_CONTROLS = {
  zoom: true,
  scale: true,
  navigation: true,
  fullscreen: true,
}

export const DEFAULT_AUDIO_CONFIG = {
  enabled: true,
  clickSound: '/audio/click.mp3', // Will fallback to Web Audio API if file not found
  zoomVolumeControl: true,
  baseVolume: 0.5, // 50% base volume
}

export const BANGKOK_CENTER: MapLocation = {
  lat: 13.7563,
  lon: 100.5018,
}

let longdoLoader: Promise<any> | null = null

export const initializeLongdoMap = (containerId: string, config: LongdoMapConfig) => {
  const { key, language, zoom = DEFAULT_ZOOM_CONFIG, controls = DEFAULT_CONTROLS } = config
  
  // 🚫 SSR guard
  if (typeof window === "undefined") return Promise.reject("SSR")

  // -- 1. ensure we load SDK only once --------------------------------
  if (!longdoLoader) {
    longdoLoader = new Promise((resolve, reject) => {
      if ((window as any).longdo?.Map) {
        resolve((window as any).longdo)
        return
      }

      const scriptUrl = `https://api.longdo.com/map/?key=${key}`
      // already injected?
      if (document.querySelector(`script[src*="api.longdo.com/map"]`)) {
        document.addEventListener("longdo-ready", () => resolve((window as any).longdo), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = scriptUrl
      script.async = true
      // Remove crossOrigin to avoid CORS issues
      script.onload = () => {
        // Wait a bit for the SDK to initialize
        setTimeout(() => {
          document.dispatchEvent(new Event("longdo-ready"))
          resolve((window as any).longdo)
        }, 100)
      }
      script.onerror = (error) => {
        console.error("Failed to load Longdo Map SDK:", error)
        reject(new Error("Failed to load Longdo Map SDK"))
      }
      document.head.appendChild(script)
    })
  }

  // -- 2. build map when sdk + placeholder are ready -------------------
  return new Promise((resolve, reject) => {
    longdoLoader!
      .then((longdo) => {
        const waitForPlaceholder = () => {
          const placeholder = document.getElementById(containerId)
          if (placeholder) {
            try {
              const map = new longdo.Map({
                placeholder,
                language: language || "th",
                zoom: zoom.initial,
              })
              
              // Configure map controls after map creation
              try {
                // Set zoom range if available
                if (map.zoomRange && typeof map.zoomRange === 'function') {
                  map.zoomRange(zoom.min, zoom.max)
                }
                
                // Configure UI controls - check if Ui object exists
                if (map.Ui) {
                  if (map.Ui.Zoom && typeof map.Ui.Zoom.visible === 'function') {
                    map.Ui.Zoom.visible(controls.zoom)
                  }
                  if (map.Ui.Scale && typeof map.Ui.Scale.visible === 'function') {
                    map.Ui.Scale.visible(controls.scale)
                  }
                  if (map.Ui.Navigation && typeof map.Ui.Navigation.visible === 'function') {
                    map.Ui.Navigation.visible(controls.navigation)
                  }
                  if (map.Ui.Fullscreen && typeof map.Ui.Fullscreen.visible === 'function') {
                    map.Ui.Fullscreen.visible(controls.fullscreen)
                  }
                }
              } catch (controlError) {
                console.warn("Some map controls may not be available:", controlError)
              }
              
              // Set initial location and zoom
              map.location(BANGKOK_CENTER, true)
              map.zoom(zoom.initial, true) // true for smooth zoom
              
              resolve(map)
            } catch (err) {
              reject(err)
            }
          } else {
            // element not yet mounted – re-check on next frame
            requestAnimationFrame(waitForPlaceholder)
          }
        }
        waitForPlaceholder()
      })
      .catch(reject)
  })
}

export const addMarkerToMap = (map: any, location: MapLocation, options: any) => {
  const longdo = (window as any).longdo
  const marker = new longdo.Marker(location, options)
  map.Overlays.add(marker)
  return marker
}

export const addMarkerClickEvent = (
  map: any, 
  marker: any, 
  callback: () => void,
  audioManager?: MapAudioManager | null
) => {
  const longdo = (window as any).longdo
  try {
    const enhancedCallback = () => {
      // Play click sound when marker is clicked
      if (audioManager) {
        audioManager.playClickSound()
      }
      callback()
    }

    // Try the standard event binding method
    if (marker.Event && typeof marker.Event.bind === 'function') {
      marker.Event.bind("click", enhancedCallback)
    } else if (longdo.Event) {
      // Alternative method using longdo.Event
      longdo.Event.bind(marker, "click", enhancedCallback)
    } else {
      console.warn("Unable to bind click event to marker - Event binding not available")
    }
  } catch (error) {
    console.error("Error binding marker click event:", error)
  }
}

// Optimized zoom functions
export const setMapZoom = (map: any, zoomLevel: number, smooth: boolean = true) => {
  if (map && typeof map.zoom === 'function') {
    map.zoom(Math.max(6, Math.min(18, zoomLevel)), smooth)
  }
}

export const zoomToLocation = (map: any, location: MapLocation, zoomLevel: number = 14, smooth: boolean = true) => {
  if (map) {
    map.location(location, smooth)
    setTimeout(() => {
      setMapZoom(map, zoomLevel, smooth)
    }, smooth ? 300 : 0)
  }
}

export const fitBounds = (map: any, locations: MapLocation[], padding: number = 50) => {
  if (!map || !locations.length) return

  if (locations.length === 1) {
    zoomToLocation(map, locations[0], 14)
    return
  }

  // Calculate bounds
  const lats = locations.map(loc => loc.lat)
  const lons = locations.map(loc => loc.lon)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  // Calculate center
  const center = {
    lat: (minLat + maxLat) / 2,
    lon: (minLon + maxLon) / 2,
  }

  // Calculate appropriate zoom level based on bounds
  const latDiff = maxLat - minLat
  const lonDiff = maxLon - minLon
  const maxDiff = Math.max(latDiff, lonDiff)
  
  let zoomLevel = 10
  if (maxDiff < 0.01) zoomLevel = 16
  else if (maxDiff < 0.05) zoomLevel = 14
  else if (maxDiff < 0.1) zoomLevel = 12
  else if (maxDiff < 0.5) zoomLevel = 10
  else if (maxDiff < 1) zoomLevel = 8
  else zoomLevel = 6

  zoomToLocation(map, center, zoomLevel)
}

export const addZoomEventListener = (map: any, callback: (zoomLevel: number) => void) => {
  const longdo = (window as any).longdo
  try {
    if (longdo.Event) {
      longdo.Event.bind(map, "zoom", () => {
        const currentZoom = map.zoom()
        callback(currentZoom)
      })
    }
  } catch (error) {
    console.error("Error binding zoom event:", error)
  }
}

export const getCurrentZoom = (map: any): number => {
  try {
    return map ? map.zoom() : DEFAULT_ZOOM_CONFIG.initial
  } catch (error) {
    console.error("Error getting current zoom:", error)
    return DEFAULT_ZOOM_CONFIG.initial
  }
}

// Audio utilities for map interactions
export class MapAudioManager {
  private audioContext: AudioContext | null = null
  private clickAudio: HTMLAudioElement | null = null
  private config: any
  private currentZoom: number = DEFAULT_ZOOM_CONFIG.initial

  constructor(config: any) {
    this.config = config
    this.initializeAudio()
  }

  private initializeAudio() {
    if (typeof window === 'undefined' || !this.config.enabled) return

    try {
      // Initialize Web Audio API for better control
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create click sound audio element
      if (this.config.clickSound) {
        this.clickAudio = new Audio(this.config.clickSound)
        this.clickAudio.preload = 'auto'
        this.clickAudio.volume = this.config.baseVolume
      }
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }

  // Calculate volume based on zoom level
  private calculateVolumeFromZoom(zoomLevel: number): number {
    if (!this.config.zoomVolumeControl) return this.config.baseVolume

    // Map zoom level (6-18) to volume (0.1-1.0)
    const minZoom = DEFAULT_ZOOM_CONFIG.min
    const maxZoom = DEFAULT_ZOOM_CONFIG.max
    const minVolume = 0.1
    const maxVolume = 1.0

    const normalizedZoom = (zoomLevel - minZoom) / (maxZoom - minZoom)
    const volume = minVolume + (normalizedZoom * (maxVolume - minVolume))
    
    return Math.max(minVolume, Math.min(maxVolume, volume))
  }

  // Update volume based on current zoom
  public updateVolumeFromZoom(zoomLevel: number) {
    this.currentZoom = zoomLevel
    const volume = this.calculateVolumeFromZoom(zoomLevel)
    
    if (this.clickAudio) {
      this.clickAudio.volume = volume
    }
  }

  // Enable/disable audio
  public setEnabled(enabled: boolean) {
    this.config.enabled = enabled
  }

  // Set base volume
  public setBaseVolume(volume: number) {
    this.config.baseVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumeFromZoom(this.currentZoom)
  }

  // Get current settings
  public isEnabled(): boolean {
    return this.config.enabled
  }

  public getBaseVolume(): number {
    return this.config.baseVolume
  }

  // Play click sound
  public playClickSound() {
    if (!this.config.enabled) return

    try {
      if (this.clickAudio && this.clickAudio.readyState >= 2) {
        // Audio file is available
        this.clickAudio.currentTime = 0
        this.clickAudio.play().catch(error => {
          console.warn('Failed to play click sound:', error)
          this.playWebAudioClick() // Fallback to Web Audio
        })
      } else {
        // Fallback to Web Audio API
        this.playWebAudioClick()
      }
    } catch (error) {
      console.warn('Error playing click sound:', error)
      this.playWebAudioClick()
    }
  }

  // Fallback click sound using Web Audio API
  private playWebAudioClick() {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1)
      
      const volume = this.calculateVolumeFromZoom(this.currentZoom) * 0.3
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
      
      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Error playing Web Audio click:', error)
    }
  }

  // Play zoom sound with volume based on zoom direction
  public playZoomSound(zoomDirection: 'in' | 'out') {
    if (!this.config.enabled) return

    try {
      if (this.audioContext) {
        // Create a simple beep sound
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        // Different frequencies for zoom in/out
        oscillator.frequency.setValueAtTime(
          zoomDirection === 'in' ? 800 : 400, 
          this.audioContext.currentTime
        )
        
        // Volume based on current zoom
        const volume = this.calculateVolumeFromZoom(this.currentZoom) * 0.3 // Quieter for zoom sounds
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
        
        oscillator.start()
        oscillator.stop(this.audioContext.currentTime + 0.1)
      }
    } catch (error) {
      console.warn('Error playing zoom sound:', error)
    }
  }

  // Cleanup
  public dispose() {
    if (this.audioContext) {
      this.audioContext.close()
    }
    if (this.clickAudio) {
      this.clickAudio.pause()
      this.clickAudio.src = ''
    }
  }
}

// Enhanced zoom functions with audio feedback
export const setMapZoomWithAudio = (
  map: any, 
  zoomLevel: number, 
  audioManager: MapAudioManager | null, 
  smooth: boolean = true
) => {
  if (map && typeof map.zoom === 'function') {
    const currentZoom = getCurrentZoom(map)
    const newZoom = Math.max(6, Math.min(18, zoomLevel))
    
    // Play zoom sound
    if (audioManager) {
      const direction = newZoom > currentZoom ? 'in' : 'out'
      audioManager.playZoomSound(direction)
      audioManager.updateVolumeFromZoom(newZoom)
    }
    
    map.zoom(newZoom, smooth)
  }
}
