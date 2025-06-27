"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, Factory, Users, Calendar, Phone, Mail, ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LeafletMapWrapper from "./components/leaflet-map-wrapper"
import EnhancedAudioPlayer from "./components/enhanced-audio-player"
import { parseCSVData, SAMPLE_CSV_DATA, type ComplaintData } from "./lib/csv-parser"

export default function PrajeansEnhancedApp() {
  const [complaints, setComplaints] = useState<ComplaintData[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(10)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        // In production, load from actual CSV file
        // const response = await fetch('/data/complaints.csv');
        // const csvContent = await response.text();

        // For demo, use sample data
        const parsedData = parseCSVData(SAMPLE_CSV_DATA)
        setComplaints(parsedData)
      } catch (error) {
        console.error("Failed to load complaint data:", error)
        // Fallback to sample data
        setComplaints(parseCSVData(SAMPLE_CSV_DATA))
      }
    }

    loadData()
  }, [])

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  const handleComplaintSelect = (complaint: ComplaintData) => {
    setSelectedComplaint(complaint)
    setIsPlaying(false)
  }

  const handleZoomChange = (zoomLevel: number) => {
    setCurrentZoom(zoomLevel)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Factory className="w-6 h-6 md:w-8 md:h-8 text-red-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Prajeans</h1>
                <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded hidden sm:inline">
                  Citizens Voice
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button className="bg-red-600 hover:bg-red-700 transition-all hover:scale-105">
              <Plus className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Report Issue</span>
              <span className="sm:hidden">Report</span>
            </Button>
            <div className="text-xs md:text-sm text-gray-600">
              <span className="font-medium">{filteredComplaints.length}</span>
              <span className="hidden sm:inline"> active complaints</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="noise">Noise</SelectItem>
                <SelectItem value="air">Air</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Area */}
        <div className="flex-1 order-2 lg:order-1">
          <LeafletMapWrapper
            complaints={filteredComplaints}
            selectedComplaint={selectedComplaint}
            onComplaintSelect={handleComplaintSelect}
            onZoomChange={handleZoomChange}
            className="h-[400px] md:h-[500px] lg:h-full"
          />
        </div>

        {/* Sidebar */}
        <div
          className={`${isMobile ? "w-full" : "w-96"} bg-white border-l border-gray-200 flex flex-col shadow-lg order-1 lg:order-2`}
        >
          {selectedComplaint ? (
            <div className="flex flex-col h-full">
              {/* Complaint Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <span className="text-3xl md:text-4xl animate-bounce">
                        {categoryIcons[selectedComplaint.category]}
                      </span>
                      {isPlaying && (
                        <div className="absolute -top-2 -right-2 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg md:text-xl font-bold text-gray-800 line-clamp-2">
                        {selectedComplaint.title}
                      </h2>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Factory className="w-4 h-4 mr-1 animate-pulse flex-shrink-0" />
                        <span className="truncate">{selectedComplaint.factoryName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <Badge
                      className={`text-xs font-bold text-white ${severityColors[selectedComplaint.severity]} animate-pulse`}
                    >
                      {selectedComplaint.severity.toUpperCase()}
                    </Badge>
                    <Badge className={`text-xs font-bold text-white ${statusColors[selectedComplaint.status]}`}>
                      {selectedComplaint.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{selectedComplaint.description}</p>
              </div>

              {/* Complaint Details */}
              <div className="p-4 md:p-6 border-b border-gray-200 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Reported Date</p>
                      <p className="text-sm font-medium">{selectedComplaint.reportedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400 animate-pulse flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Affected Residents</p>
                      <p className="text-sm font-bold text-red-600">{selectedComplaint.affectedResidents}</p>
                    </div>
                  </div>
                </div>

                <Card className="bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Reporter Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700 mb-2">{selectedComplaint.reportedBy}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedComplaint.contactPhone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedComplaint.contactEmail}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Evidence Provided</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.evidence.map((evidence, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {evidence}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Audio Player */}
              {selectedComplaint.audioUrl && (
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <EnhancedAudioPlayer
                    audioUrl={selectedComplaint.audioUrl}
                    zoomLevel={currentZoom}
                    isPlaying={isPlaying}
                    onPlayStateChange={setIsPlaying}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 transition-all hover:scale-105">
                    Update Status
                  </Button>
                </div>

                <div className="mt-3 text-center">
                  <Button variant="link" className="text-sm text-red-600 hover:text-red-700">
                    Report False Complaint
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 md:p-6">
              <div className="text-center max-w-sm">
                <div className="relative mb-6">
                  <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-red-300 mx-auto animate-bounce" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 md:w-6 md:h-6 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-600 mb-3">Select a Complaint</h3>
                <p className="text-gray-500 text-center mb-6 text-sm md:text-base">
                  Click on any complaint marker to view details and listen to audio evidence
                </p>

                <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center text-red-800">
                      <Factory className="w-5 h-5 mr-2 animate-pulse" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-red-600 animate-pulse">
                          {complaints.filter((c) => c.status === "pending").length}
                        </div>
                        <div className="text-red-600 font-medium">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-blue-600 animate-pulse">
                          {complaints.filter((c) => c.status === "investigating").length}
                        </div>
                        <div className="text-blue-600 font-medium">Investigating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-green-600">
                          {complaints.filter((c) => c.status === "resolved").length}
                        </div>
                        <div className="text-green-600 font-medium">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-orange-600">
                          {complaints.filter((c) => c.severity === "critical").length}
                        </div>
                        <div className="text-orange-600 font-medium">Critical</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
