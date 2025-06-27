// UploadThing configuration for audio files
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "../app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export interface AudioUploadResponse {
  url: string
  key: string
  name: string
  size: number
}

export const uploadAudioFile = async (file: File): Promise<AudioUploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/uploadthing", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload audio file")
  }

  return response.json()
}
