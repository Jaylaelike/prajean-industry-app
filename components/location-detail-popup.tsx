"use client"

import { useState } from "react"
import { LocationData } from "../lib/csv-data-loader"

interface LocationDetailPopupProps {
  location: LocationData | null
  isOpen: boolean
  onClose: () => void
  onPlayAudio: (audioUrl: string) => void
  isAudioPlaying: boolean
  currentZoom: number
}

export default function LocationDetailPopup({
  location,
  isOpen,
  onClose,
  onPlayAudio,
  isAudioPlaying,
  currentZoom,
}: LocationDetailPopupProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'contact'>('details')

  if (!isOpen || !location) return null

  const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    high: 'bg-red-100 text-red-800 border-red-300',
    critical: 'bg-red-200 text-red-900 border-red-400',
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    investigating: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-200 text-gray-600',
  }

  const categoryIcons = {
    noise: '🔊',
    air: '💨',
    water: '💧',
    waste: '🗑️',
    other: '⚠️',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{categoryIcons[location.category as keyof typeof categoryIcons]}</span>
                <h2 className="text-xl font-bold">{location.title}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColors[location.severity as keyof typeof severityColors]}`}>
                  {location.severity.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[location.status as keyof typeof statusColors]}`}>
                  {location.status.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Audio Player */}
        {location.audioUrl && (
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Audio Evidence:</span>
                <button
                  onClick={() => onPlayAudio(location.audioUrl)}
                  disabled={isAudioPlaying}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <span>{isAudioPlaying ? '⏸️' : '▶️'}</span>
                  <span className="text-sm">{isAudioPlaying ? 'Playing...' : 'Play Audio'}</span>
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Volume: {Math.round(currentZoom * 5.56)}% (zoom-based)
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b">
          {[
            { key: 'details', label: 'Details', icon: '📋' },
            { key: 'evidence', label: 'Evidence', icon: '📸' },
            { key: 'contact', label: 'Contact', icon: '📞' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{location.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Factory</h4>
                  <p className="text-gray-600">{location.factoryName}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Reported Date</h4>
                  <p className="text-gray-600">{new Date(location.reportedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Affected Residents</h4>
                  <p className="text-gray-600">{location.affectedResidents.toLocaleString()} people</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                  <p className="text-gray-600 text-sm">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                </div>
              </div>

              {location.tags && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.tags.split(';').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Evidence</h3>
                <div className="space-y-3">
                  {location.evidence.split(';').map((evidence, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">
                          {evidence.trim().includes('Audio') ? '🎵' : 
                           evidence.trim().includes('Photo') ? '📸' : 
                           evidence.trim().includes('Video') ? '🎥' : '📄'}
                        </span>
                      </div>
                      <span className="text-gray-700">{evidence.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {location.audioUrl && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Audio Evidence</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Audio testimony and environmental sounds recorded at the location.
                  </p>
                  <audio controls className="w-full" preload="metadata">
                    <source src={location.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Reporter Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">👤</span>
                    <div>
                      <div className="font-medium text-gray-900">{location.reportedBy}</div>
                      <div className="text-sm text-gray-500">Primary Reporter</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">📞</span>
                    <div>
                      <div className="font-medium text-gray-900">{location.contactPhone}</div>
                      <div className="text-sm text-gray-500">Phone Number</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">✉️</span>
                    <div>
                      <div className="font-medium text-gray-900">{location.contactEmail}</div>
                      <div className="text-sm text-gray-500">Email Address</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Report ID: #{location.id}</span>
                  <span>Status: {location.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Close
          </button>
          {location.audioUrl && (
            <button
              onClick={() => onPlayAudio(location.audioUrl)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isAudioPlaying ? 'Playing Audio...' : 'Play Audio Evidence'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
