"use client"

import dynamic from 'next/dynamic'
import type { ComplaintData } from "../lib/csv-parser"

interface LeafletMapWrapperProps {
  complaints: ComplaintData[]
  selectedComplaint: ComplaintData | null
  onComplaintSelect: (complaint: ComplaintData) => void
  onZoomChange: (zoomLevel: number) => void
  className?: string
}

const LeafletMapComponent = dynamic(() => import('./leaflet-map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] md:min-h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Thailand Map...</p>
      </div>
    </div>
  )
})

export default function LeafletMapWrapper(props: LeafletMapWrapperProps) {
  return <LeafletMapComponent {...props} />
}