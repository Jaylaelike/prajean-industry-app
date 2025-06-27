// CSV Data Loader for Map Locations
export interface LocationData {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  audioUrl: string
  category: string
  severity: string
  status: string
  factoryName: string
  reportedBy: string
  reportedDate: string
  contactPhone: string
  contactEmail: string
  affectedResidents: number
  evidence: string
  tags: string
}

export class CSVDataLoader {
  private data: LocationData[] = []
  private audioCache = new Map<string, HTMLAudioElement>()

  async loadData(csvPath: string = '/data/data.csv'): Promise<LocationData[]> {
    try {
      const response = await fetch(csvPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`)
      }
      
      const csvText = await response.text()
      this.data = this.parseCSV(csvText)
      
      // Preload audio files
      this.preloadAudio()
      
      return this.data
    } catch (error) {
      console.error('Error loading CSV data:', error)
      return []
    }
  }

  private parseCSV(csvText: string): LocationData[] {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const obj: any = {}
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      
      return {
        id: obj.id,
        title: obj.title,
        description: obj.description,
        latitude: parseFloat(obj.latitude),
        longitude: parseFloat(obj.longitude),
        audioUrl: obj.audioUrl,
        category: obj.category,
        severity: obj.severity,
        status: obj.status,
        factoryName: obj.factoryName,
        reportedBy: obj.reportedBy,
        reportedDate: obj.reportedDate,
        contactPhone: obj.contactPhone,
        contactEmail: obj.contactEmail,
        affectedResidents: parseInt(obj.affectedResidents) || 0,
        evidence: obj.evidence,
        tags: obj.tags,
      }
    })
  }

  private parseCSVLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  private preloadAudio() {
    this.data.forEach(location => {
      if (location.audioUrl && !this.audioCache.has(location.audioUrl)) {
        try {
          const audio = new Audio(location.audioUrl)
          audio.preload = 'metadata'
          audio.addEventListener('error', () => {
            console.warn(`Failed to preload audio: ${location.audioUrl}`)
          })
          this.audioCache.set(location.audioUrl, audio)
        } catch (error) {
          console.warn(`Error preloading audio for ${location.title}:`, error)
        }
      }
    })
  }

  async playAudio(audioUrl: string, volume: number = 0.5): Promise<void> {
    if (!audioUrl) return

    try {
      let audio = this.audioCache.get(audioUrl)
      
      if (!audio) {
        audio = new Audio(audioUrl)
        this.audioCache.set(audioUrl, audio)
      }

      audio.volume = Math.max(0, Math.min(1, volume))
      audio.currentTime = 0
      
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      throw error
    }
  }

  stopAllAudio() {
    this.audioCache.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  getLocationById(id: string): LocationData | undefined {
    return this.data.find(location => location.id === id)
  }

  getLocationsByCategory(category: string): LocationData[] {
    return this.data.filter(location => location.category === category)
  }

  getLocationsBySeverity(severity: string): LocationData[] {
    return this.data.filter(location => location.severity === severity)
  }

  getAllLocations(): LocationData[] {
    return [...this.data]
  }

  // Get location closest to clicked coordinates
  getLocationNearPoint(lat: number, lon: number, maxDistance: number = 0.01): LocationData | null {
    let closest: LocationData | null = null
    let minDistance = Infinity

    this.data.forEach(location => {
      const distance = this.calculateDistance(lat, lon, location.latitude, location.longitude)
      if (distance < maxDistance && distance < minDistance) {
        minDistance = distance
        closest = location
      }
    })

    return closest
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  dispose() {
    this.stopAllAudio()
    this.audioCache.clear()
  }
}
