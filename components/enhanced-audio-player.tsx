"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface EnhancedAudioPlayerProps {
  audioUrl: string
  zoomLevel: number
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
  className?: string
}

export default function EnhancedAudioPlayer({
  audioUrl,
  zoomLevel,
  isPlaying,
  onPlayStateChange,
  className = "",
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [baseVolume] = useState(0.7)

  // Calculate zoom-based volume (zoom 5-20, volume 0.1-1.0)
  const calculateZoomVolume = (zoom: number, base: number) => {
    const minZoom = 5
    const maxZoom = 20
    const minVolume = 0.1
    const maxVolume = 1.0

    const normalizedZoom = Math.max(minZoom, Math.min(maxZoom, zoom))
    const zoomFactor = (normalizedZoom - minZoom) / (maxZoom - minZoom)
    const zoomVolume = minVolume + zoomFactor * (maxVolume - minVolume)

    return Math.min(maxVolume, base * zoomVolume)
  }

  // Update volume based on zoom level
  useEffect(() => {
    if (!isMuted) {
      const newVolume = calculateZoomVolume(zoomLevel, baseVolume)
      setVolume(newVolume)
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }
    }
  }, [zoomLevel, baseVolume, isMuted])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      onPlayStateChange(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setProgress(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      audioRef.current.muted = newMuted
      if (!newMuted) {
        const zoomVolume = calculateZoomVolume(zoomLevel, baseVolume)
        setVolume(zoomVolume)
        audioRef.current.volume = zoomVolume
      }
    }
  }

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setProgress(0)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={`bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 md:p-6 border border-red-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Volume2 className={`w-5 h-5 mr-2 ${isPlaying ? "animate-bounce text-green-600" : "text-gray-600"}`} />
          <span className="hidden md:inline">Audio Evidence</span>
          <span className="md:hidden">Audio</span>
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Zoom Volume:</span>
          <span className="font-medium">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center space-x-3 md:space-x-4 mb-4">
        <Button
          onClick={togglePlayPause}
          size="lg"
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 shadow-lg ${
            isPlaying ? "bg-green-600 hover:bg-green-700 animate-pulse" : "bg-red-600 hover:bg-red-700 hover:scale-110"
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />}
        </Button>

        <Button
          onClick={resetAudio}
          variant="outline"
          size="sm"
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-transparent"
        >
          <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
        </Button>

        <div className="flex items-center space-x-2 flex-1">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className={`p-2 rounded-full transition-all duration-200 ${
              isMuted ? "bg-red-100 hover:bg-red-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="flex-1 px-2">
            <Slider value={[volume * 100]} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
          </div>

          <span className="text-xs text-gray-500 min-w-[3rem] text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider value={[progress]} onValueChange={handleProgressChange} max={100} step={0.1} className="w-full" />

        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime((progress / 100) * duration)}</span>
          <span className="hidden sm:inline">
            Zoom Level: {zoomLevel} (Volume: {Math.round((volume / baseVolume) * 100)}%)
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Audio Visualization */}
      {isPlaying && (
        <div className="flex items-center justify-center space-x-1 py-3 mt-4">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-green-500 to-green-300 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      )}

      {/* Zoom Volume Indicator */}
      <div className="mt-3 p-2 bg-white/50 rounded-lg">
        <div className="text-xs text-gray-600 text-center">
          <span className="font-medium">Zoom Control:</span> Zoom in to increase volume, zoom out to decrease
        </div>
        <div className="flex items-center justify-center mt-1 space-x-2 text-xs">
          <span>🔍➖</span>
          <div className="flex-1 bg-gray-200 rounded-full h-1 mx-2">
            <div
              className="bg-gradient-to-r from-red-500 to-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((zoomLevel - 5) / 15) * 100}%` }}
            />
          </div>
          <span>🔍➕</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPlayStateChange(false)}
        preload="metadata"
      />
    </div>
  )
}
