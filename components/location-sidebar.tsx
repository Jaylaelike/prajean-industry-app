"use client"

import { useState, useRef, useEffect } from "react"
import { LocationData } from "../lib/csv-data-loader"
import { X, Play, Pause, Volume2, Calendar, Users, Phone, Mail, MapPin, Clock, AlertTriangle, CheckCircle, Clock3, XCircle } from "lucide-react"

interface LocationSidebarProps {
  location: LocationData | null
  isOpen: boolean
  onClose: () => void
  onPlayAudio: (audioUrl: string) => void
  isAudioPlaying: boolean
  currentZoom: number
}

export default function LocationSidebar({
  location,
  isOpen,
  onClose,
  onPlayAudio,
  isAudioPlaying,
  currentZoom,
}: LocationSidebarProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'contact'>('details')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (location && audioRef.current && location.audioUrl) {
      audioRef.current.load()
    }
  }, [location])

  if (!location) return null

  const severityColors = {
    low: 'bg-yellow-500',
    medium: 'bg-orange-500',
    high: 'bg-red-500',
    critical: 'bg-red-700',
  }

  const severityTextColors = {
    low: 'text-yellow-700',
    medium: 'text-orange-700',
    high: 'text-red-700',
    critical: 'text-red-800',
  }

  const statusColors = {
    pending: 'bg-amber-500',
    investigating: 'bg-blue-500',
    resolved: 'bg-emerald-500',
    closed: 'bg-slate-400',
  }

  const statusIcons = {
    pending: Clock3,
    investigating: AlertTriangle,
    resolved: CheckCircle,
    closed: XCircle,
  }

  const categoryIcons = {
    noise: '🔊',
    air: '💨',
    water: '💧',
    waste: '🗑️',
    other: '⚠️',
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 lg:w-80 xl:w-96 
        bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                    <span className="text-2xl">{categoryIcons[location.category as keyof typeof categoryIcons]}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs">🏭</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white leading-tight mb-1">
                    {location.title}
                  </h2>
                  <p className="text-indigo-100 text-sm mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{location.factoryName}</span>
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-indigo-100">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(location.reportedDate).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-indigo-200 rounded-full"></span>
                    <Users className="w-3 h-3" />
                    <span>{location.affectedResidents.toLocaleString()} affected</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${severityColors[location.severity as keyof typeof severityColors]} shadow-lg`}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>{location.severity.toUpperCase()}</span>
                </div>
                <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${statusColors[location.status as keyof typeof statusColors]} shadow-lg`}>
                  {(() => {
                    const StatusIcon = statusIcons[location.status as keyof typeof statusIcons]
                    return <StatusIcon className="w-3 h-3" />
                  })()}
                  <span>{location.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-indigo-100">Report #{location.id}</div>
                <div className="text-xs text-indigo-200 opacity-75">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player Section */}
        {location.audioUrl && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Audio Evidence</h3>
                      <p className="text-xs text-slate-500">Environmental recording</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-600">
                      Volume: {Math.round(currentZoom * 5.56)}%
                    </div>
                    <div className="text-xs text-slate-400">Zoom-adjusted</div>
                  </div>
                </div>
                
                {/* Main Play Button */}
                <button
                  onClick={() => onPlayAudio(location.audioUrl)}
                  disabled={isAudioPlaying}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                    {isAudioPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">
                      {isAudioPlaying ? 'Audio Playing' : 'Play Evidence'}
                    </div>
                    <div className="text-xs opacity-90">
                      {isAudioPlaying ? 'Tap to pause' : 'Click to listen'}
                    </div>
                  </div>
                  {isAudioPlaying && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-white/60 rounded-full animate-pulse"></div>
                      <div className="w-1 h-6 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </button>

                {/* HTML5 Audio Player */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                  <audio 
                    ref={audioRef}
                    controls 
                    className="w-full h-8" 
                    preload="metadata"
                    style={{ height: '32px' }}
                  >
                    <source src={location.audioUrl} type="audio/mpeg" />
                    <source src={location.audioUrl} type="audio/ogg" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="text-xs text-slate-500 mt-2 text-center">
                    Use native controls for advanced playback
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b bg-white flex-shrink-0 px-6">
          {[
            { key: 'details', label: 'Details', icon: '📋' },
            { key: 'evidence', label: 'Evidence', icon: '📸' },
            { key: 'contact', label: 'Contact', icon: '📞' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-base flex items-center">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">📝</span>
                    </div>
                    Description
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-slate-700 leading-relaxed">
                      {location.description}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">🏭</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Factory Information</h4>
                        <p className="text-sm text-slate-500">Primary source location</p>
                      </div>
                    </div>
                    <p className="text-slate-700 font-medium">{location.factoryName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-semibold text-slate-900 text-sm">Date Reported</h4>
                      </div>
                      <p className="text-slate-700 font-medium">{new Date(location.reportedDate).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.floor((Date.now() - new Date(location.reportedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-slate-900 text-sm">Affected</h4>
                      </div>
                      <p className="text-slate-700 font-bold text-lg">{location.affectedResidents.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">residents impacted</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-slate-600" />
                      <h4 className="font-semibold text-slate-900 text-sm">Coordinates</h4>
                    </div>
                    <div className="font-mono text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <div>Lat: {location.latitude.toFixed(6)}</div>
                      <div>Lng: {location.longitude.toFixed(6)}</div>
                    </div>
                  </div>
                </div>

                {location.tags && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center">
                      <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs">#</span>
                      </div>
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {location.tags.split(';').map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm rounded-full border border-purple-200 hover:scale-105 transition-transform cursor-default"
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
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 text-base flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">📁</span>
                    </div>
                    Available Evidence
                  </h3>
                  <div className="space-y-3">
                    {location.evidence.split(';').map((evidence, index) => {
                      const evidenceType = evidence.trim()
                      const isAudio = evidenceType.includes('Audio')
                      const isPhoto = evidenceType.includes('Photo')
                      const isVideo = evidenceType.includes('Video')
                      
                      const icon = isAudio ? '🎵' : isPhoto ? '📸' : isVideo ? '🎥' : '📄'
                      const bgColor = isAudio ? 'from-purple-50 to-pink-50 border-purple-200' : 
                                     isPhoto ? 'from-blue-50 to-cyan-50 border-blue-200' : 
                                     isVideo ? 'from-green-50 to-emerald-50 border-green-200' : 
                                     'from-slate-50 to-gray-50 border-slate-200'
                      const textColor = isAudio ? 'text-purple-700' : 
                                       isPhoto ? 'text-blue-700' : 
                                       isVideo ? 'text-green-700' : 'text-slate-700'
                      
                      return (
                        <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl border bg-gradient-to-r ${bgColor} hover:shadow-md transition-all duration-200 cursor-pointer`}>
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-lg">{icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${textColor}`}>{evidenceType}</div>
                            <div className="text-sm text-slate-500 mt-1">
                              {isAudio && 'Audio testimony and environmental sounds'}
                              {isPhoto && 'Visual documentation of the incident'}
                              {isVideo && 'Video evidence of the situation'}
                              {!isAudio && !isPhoto && !isVideo && 'Supporting documentation'}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {location.audioUrl && (
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-900">Audio Evidence</h4>
                        <p className="text-sm text-purple-600">Environmental recording available</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-800">Direct Playback</span>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          HD Quality
                        </span>
                      </div>
                      <audio controls className="w-full" preload="metadata">
                        <source src={location.audioUrl} type="audio/mpeg" />
                        <source src={location.audioUrl} type="audio/ogg" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="text-xs text-purple-600 mt-2 text-center">
                        💡 Use the main play button above for zoom-adjusted volume
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 text-base flex items-center">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">👤</span>
                    </div>
                    Reporter Information
                  </h3>
                  <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">👤</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-emerald-900 text-lg mb-1">
                          {location.reportedBy}
                        </div>
                        <div className="text-emerald-600 text-sm mb-2">Primary Reporter</div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-emerald-600">Verified Reporter</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-emerald-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Phone Number
                            </div>
                            <div className="font-medium text-slate-900">
                              {location.contactPhone}
                            </div>
                          </div>
                        </div>
                        <button className="w-full mt-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg transition-colors">
                          Call Reporter
                        </button>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-emerald-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Email Address
                            </div>
                            <div className="font-medium text-slate-900 text-sm truncate">
                              {location.contactEmail}
                            </div>
                          </div>
                        </div>
                        <button className="w-full mt-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm rounded-lg transition-colors">
                          Send Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-slate-600" />
                    Case Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">#{location.id}</div>
                      <div className="text-xs text-slate-500 mt-1">Report ID</div>
                    </div>
                    <div className={`text-center p-4 rounded-lg text-white ${statusColors[location.status as keyof typeof statusColors]}`}>
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        {(() => {
                          const StatusIcon = statusIcons[location.status as keyof typeof statusIcons]
                          return <StatusIcon className="w-4 h-4" />
                        })()}
                        <div className="text-sm font-bold">{location.status.toUpperCase()}</div>
                      </div>
                      <div className="text-xs opacity-90">Current Status</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Last Updated</span>
                      <span className="font-medium text-slate-700">
                        {new Date(location.reportedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex space-x-3">
            {location.audioUrl && (
              <button
                onClick={() => onPlayAudio(location.audioUrl)}
                disabled={isAudioPlaying}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isAudioPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Audio Playing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Play Evidence</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 font-medium text-sm transition-all duration-200 rounded-xl shadow-sm border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
