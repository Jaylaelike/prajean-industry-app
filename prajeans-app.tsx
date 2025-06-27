"use client"

import { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  MapPin,
  Volume2,
  VolumeX,
  AlertTriangle,
  Factory,
  Users,
  Calendar,
  Phone,
  Mail,
  Filter,
  Search,
  Plus,
  ExternalLink,
} from "lucide-react"

const PrajeansApp = () => {
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const audioRef = useRef(null)

  // Sample complaint data with better Thailand coverage
  const complaints = [
    {
      id: 1,
      title: "Excessive Noise Pollution",
      description:
        "Chemical plant operating machinery at night causing severe noise pollution affecting sleep of nearby residents.",
      latitude: 13.7563, // Bangkok
      longitude: 100.5018,
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      category: "noise",
      severity: "high",
      status: "pending",
      factoryName: "Bangkok Chemical Industries",
      reportedBy: "Somchai Jaidee",
      reportedDate: "2024-06-20",
      contactPhone: "+66-89-123-4567",
      contactEmail: "somchai.j@email.com",
      affectedResidents: 45,
      evidence: ["Audio recording", "Photos", "Witness statements"],
      tags: ["night-shift", "machinery", "residential-area"],
    },
    {
      id: 2,
      title: "Chemical Smell & Air Pollution",
      description: "Strong chemical odors from textile factory causing respiratory issues in the community.",
      latitude: 18.7883, // Chiang Mai
      longitude: 98.9853,
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      category: "air",
      severity: "critical",
      status: "investigating",
      factoryName: "Northern Textile Co.",
      reportedBy: "Niran Patel",
      reportedDate: "2024-06-18",
      contactPhone: "+66-82-987-6543",
      contactEmail: "niran.patel@email.com",
      affectedResidents: 120,
      evidence: ["Air quality readings", "Medical reports", "Audio testimony"],
      tags: ["chemical-odor", "health-impact", "textile"],
    },
    {
      id: 3,
      title: "Water Contamination",
      description: "Factory discharge turning local canal dark brown with unusual smell affecting fishing community.",
      latitude: 7.8804, // Phuket
      longitude: 98.3923,
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      category: "water",
      severity: "high",
      status: "resolved",
      factoryName: "Southern Manufacturing",
      reportedBy: "Malee Fishing Group",
      reportedDate: "2024-06-15",
      contactPhone: "+66-85-456-7890",
      contactEmail: "malee.fishing@email.com",
      affectedResidents: 75,
      evidence: ["Water samples", "Fish mortality photos", "Community audio"],
      tags: ["discharge", "fishing", "canal"],
    },
    {
      id: 4,
      title: "Industrial Waste Dumping",
      description: "Illegal dumping of industrial waste near residential area causing health concerns.",
      latitude: 16.4419, // Khon Kaen
      longitude: 102.836,
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      category: "waste",
      severity: "critical",
      status: "pending",
      factoryName: "Northeast Industries",
      reportedBy: "Isaan Community Group",
      reportedDate: "2024-06-22",
      contactPhone: "+66-87-234-5678",
      contactEmail: "isaan.community@email.com",
      affectedResidents: 200,
      evidence: ["Waste photos", "Soil samples", "Community testimony"],
      tags: ["illegal-dumping", "health-risk", "industrial-waste"],
    },
    {
      id: 5,
      title: "Air Quality Deterioration",
      description: "Multiple factories causing severe air pollution affecting entire district.",
      latitude: 12.6847, // Hat Yai
      longitude: 101.1496,
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
      category: "air",
      severity: "critical",
      status: "investigating",
      factoryName: "Southern Industrial Complex",
      reportedBy: "Hat Yai Environmental Group",
      reportedDate: "2024-06-19",
      contactPhone: "+66-84-567-8901",
      contactEmail: "hatyai.env@email.com",
      affectedResidents: 300,
      evidence: ["Air monitoring data", "Health reports", "Satellite images"],
      tags: ["multiple-sources", "district-wide", "air-quality"],
    },
  ]

  const severityColors = {
    low: "bg-yellow-500",
    medium: "bg-orange-500",
    high: "bg-red-500",
    critical: "bg-red-700",
  }

  const statusColors = {
    pending: "bg-gray-500",
    investigating: "bg-blue-500",
    resolved: "bg-green-500",
    rejected: "bg-red-500",
  }

  const categoryIcons = {
    noise: "🔊",
    air: "💨",
    water: "💧",
    waste: "🗑️",
    other: "⚠️",
  }

  // Function to convert lat/lng to screen coordinates for Thailand map
  const getScreenPosition = (lat, lng) => {
    // Thailand bounds: roughly 5.6°N to 20.5°N, 97.3°E to 105.6°E
    const minLat = 5.6
    const maxLat = 20.5
    const minLng = 97.3
    const maxLng = 105.6

    const x = ((lng - minLng) / (maxLng - minLng)) * 100
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesCategory = filterCategory === "all" || complaint.category === filterCategory
    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus
    const matchesSearch =
      searchTerm === "" ||
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.factoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.reportedBy.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesStatus && matchesSearch
  })

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint)
    if (currentAudio && currentAudio !== complaint.audioUrl) {
      setIsPlaying(false)
      setAudioProgress(0)
    }
    setCurrentAudio(complaint.audioUrl)
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setAudioProgress(progress)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const handleProgressClick = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * audioRef.current.duration
      audioRef.current.currentTime = newTime
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Factory className="w-8 h-8 text-red-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Prajeans</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Citizens Voice</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors transform hover:scale-105">
              <Plus className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredComplaints.length}</span> active complaints
            </div>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints, factories, or reporters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Categories</option>
              <option value="noise">Noise Pollution</option>
              <option value="air">Air Pollution</option>
              <option value="water">Water Contamination</option>
              <option value="waste">Waste Management</option>
              <option value="other">Other Issues</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="investigating">Under Investigation</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map Area - Thailand Overview */}
        <div className="flex-1 relative bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 overflow-hidden">
          {/* Thailand Map Background */}
          <div className="absolute inset-0">
            {/* Stylized Thailand outline */}
            <svg width="100%" height="100%" className="w-full h-full opacity-20">
              <defs>
                <pattern id="thailand-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#059669" strokeWidth="1" opacity="0.3" />
                </pattern>
                <linearGradient id="thailand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 0.1 }} />
                  <stop offset="50%" style={{ stopColor: "#3b82f6", stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: "#f59e0b", stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#thailand-grid)" />
              <rect width="100%" height="100%" fill="url(#thailand-gradient)" />

              {/* Simplified Thailand shape */}
              <path
                d="M 200 100 Q 250 80 300 120 L 320 200 Q 350 250 380 300 L 400 400 Q 420 500 400 600 L 380 700 Q 360 750 340 800 L 300 850 Q 250 880 200 850 L 150 800 Q 120 750 140 700 L 160 600 Q 180 500 200 400 L 220 300 Q 240 200 200 100 Z"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                opacity="0.3"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Regional Labels */}
          <div className="absolute top-20 left-1/4 text-green-600 font-medium opacity-60">Northern Thailand</div>
          <div className="absolute top-1/2 left-1/3 text-blue-600 font-medium opacity-60">Central Thailand</div>
          <div className="absolute top-1/2 right-1/4 text-orange-600 font-medium opacity-60">Northeast</div>
          <div className="absolute bottom-1/4 left-1/3 text-red-600 font-medium opacity-60">Southern Thailand</div>

          {/* Complaint Markers with proper Thailand positioning */}
          {filteredComplaints.map((complaint) => {
            const position = getScreenPosition(complaint.latitude, complaint.longitude)
            return (
              <div
                key={complaint.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onClick={() => handleComplaintClick(complaint)}
              >
                <div
                  className={`relative group ${selectedComplaint?.id === complaint.id ? "scale-125 z-20" : "hover:scale-110"} transition-all duration-300`}
                >
                  {/* Animated Severity Ring */}
                  <div
                    className={`absolute -inset-3 rounded-full ${severityColors[complaint.severity]} opacity-20 animate-ping`}
                  ></div>
                  <div
                    className={`absolute -inset-2 rounded-full ${severityColors[complaint.severity]} opacity-30 animate-pulse`}
                  ></div>

                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 ${
                      selectedComplaint?.id === complaint.id
                        ? `${severityColors[complaint.severity]} border-white animate-bounce shadow-2xl`
                        : `${severityColors[complaint.severity]} border-white hover:shadow-2xl`
                    } transition-all duration-300`}
                  >
                    <span className="text-2xl animate-pulse">{categoryIcons[complaint.category]}</span>
                  </div>

                  {/* Animated Status Indicator */}
                  <div
                    className={`absolute -top-2 -right-2 w-5 h-5 ${statusColors[complaint.status]} rounded-full border-3 border-white animate-pulse`}
                  >
                    <div className="absolute inset-1 bg-white rounded-full animate-ping opacity-75"></div>
                  </div>

                  {/* Audio Activity Indicator */}
                  {selectedComplaint?.id === complaint.id && isPlaying && (
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-500 rounded-full animate-bounce flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50"></div>
                    </div>
                  )}

                  {/* Factory Smoke Animation for Industrial Complaints */}
                  {(complaint.category === "air" || complaint.category === "noise") && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-6 bg-gray-400 opacity-60 rounded-full animate-pulse"
                          style={{ animationDelay: "0s" }}
                        ></div>
                        <div
                          className="w-2 h-8 bg-gray-500 opacity-50 rounded-full animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div
                          className="w-2 h-4 bg-gray-400 opacity-40 rounded-full animate-pulse"
                          style={{ animationDelay: "1s" }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30">
                    <div className="bg-gray-900 text-white text-sm rounded-xl py-4 px-5 whitespace-nowrap max-w-xs shadow-2xl border border-gray-700">
                      <div className="font-bold text-lg mb-1">{complaint.title}</div>
                      <div className="text-gray-300 mb-2">{complaint.factoryName}</div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>
                          Severity:{" "}
                          <span
                            className={`capitalize font-medium ${complaint.severity === "critical" ? "text-red-400" : complaint.severity === "high" ? "text-orange-400" : "text-yellow-400"}`}
                          >
                            {complaint.severity}
                          </span>
                        </div>
                        <div>
                          Status: <span className="capitalize font-medium text-blue-400">{complaint.status}</span>
                        </div>
                        <div>
                          Affected:{" "}
                          <span className="font-medium text-green-400">{complaint.affectedResidents} residents</span>
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                        <div className="border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Enhanced Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-600" />
              Complaint Severity
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-700 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  Critical ({complaints.filter((c) => c.severity === "critical").length})
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">High ({complaints.filter((c) => c.severity === "high").length})</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Medium ({complaints.filter((c) => c.severity === "medium").length})</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Low ({complaints.filter((c) => c.severity === "low").length})</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Categories</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <span>🔊</span>
                  <span>Noise</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💨</span>
                  <span>Air</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💧</span>
                  <span>Water</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🗑️</span>
                  <span>Waste</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thailand Map Title */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🇹🇭</span>
              Thailand Environmental Complaints Map
            </h2>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl">
          {selectedComplaint ? (
            <div className="flex flex-col h-full">
              {/* Complaint Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <span className="text-4xl animate-bounce">{categoryIcons[selectedComplaint.category]}</span>
                      {isPlaying && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedComplaint.title}</h2>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Factory className="w-4 h-4 mr-1 animate-pulse" />
                        {selectedComplaint.factoryName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${severityColors[selectedComplaint.severity]} animate-pulse`}
                    >
                      {selectedComplaint.severity.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[selectedComplaint.status]}`}
                    >
                      {selectedComplaint.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
              </div>

              {/* Complaint Details */}
              <div className="p-6 border-b border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Reported Date</p>
                      <p className="text-sm font-medium">{selectedComplaint.reportedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400 animate-pulse" />
                    <div>
                      <p className="text-xs text-gray-500">Affected Residents</p>
                      <p className="text-sm font-bold text-red-600">{selectedComplaint.affectedResidents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Reporter Information</h4>
                  <p className="text-sm text-gray-700 mb-2">{selectedComplaint.reportedBy}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedComplaint.contactPhone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{selectedComplaint.contactEmail}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Evidence Provided</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.evidence.map((evidence, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse"
                      >
                        {evidence}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Audio Player */}
              <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Volume2
                      className={`w-5 h-5 mr-2 ${isPlaying ? "animate-bounce text-green-600" : "text-gray-600"}`}
                    />
                    Audio Evidence
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">Citizen Recording</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
                        isPlaying
                          ? "bg-green-600 hover:bg-green-700 animate-pulse"
                          : "bg-red-600 hover:bg-red-700 hover:scale-110"
                      }`}
                    >
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>

                    <div className="flex items-center space-x-2 flex-1">
                      <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          isMuted ? "bg-red-100 hover:bg-red-200" : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div
                      className="w-full h-3 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                      onClick={handleProgressClick}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-100 ${
                          isPlaying ? "bg-gradient-to-r from-green-500 to-green-600 animate-pulse" : "bg-red-600"
                        }`}
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatTime((audioProgress / 100) * audioDuration)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>

                  {/* Audio Visualization */}
                  {isPlaying && (
                    <div className="flex items-center justify-center space-x-1 py-2">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-500 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 20 + 10}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <audio
                  ref={audioRef}
                  src={currentAudio}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              {/* Actions */}
              <div className="p-6 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105">
                    <ExternalLink className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105">
                    Update Status
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <button className="text-sm text-red-600 hover:text-red-700 underline hover:no-underline transition-all">
                    Report False Complaint
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="relative mb-6">
                  <AlertTriangle className="w-20 h-20 text-red-300 mx-auto animate-bounce" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-3">Select a Complaint</h3>
                <p className="text-gray-500 text-center mb-6">
                  Click on any complaint marker to view details and listen to audio evidence
                </p>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
                  <h4 className="font-bold text-red-800 mb-4 flex items-center justify-center">
                    <Factory className="w-5 h-5 mr-2 animate-pulse" />
                    Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 animate-pulse">
                        {complaints.filter((c) => c.status === "pending").length}
                      </div>
                      <div className="text-red-600 font-medium">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 animate-pulse">
                        {complaints.filter((c) => c.status === "investigating").length}
                      </div>
                      <div className="text-blue-600 font-medium">Investigating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {complaints.filter((c) => c.status === "resolved").length}
                      </div>
                      <div className="text-green-600 font-medium">Resolved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {complaints.filter((c) => c.severity === "critical").length}
                      </div>
                      <div className="text-orange-600 font-medium">Critical</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrajeansApp
