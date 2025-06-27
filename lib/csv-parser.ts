// CSV data parser for complaints
export interface ComplaintData {
  id: number
  title: string
  description: string
  latitude: number
  longitude: number
  audioUrl: string
  category: "noise" | "air" | "water" | "waste" | "other"
  severity: "low" | "medium" | "high" | "critical"
  status: "pending" | "investigating" | "resolved" | "rejected"
  factoryName: string
  reportedBy: string
  reportedDate: string
  contactPhone: string
  contactEmail: string
  affectedResidents: number
  evidence: string[]
  tags: string[]
}

export const parseCSVData = (csvContent: string): ComplaintData[] => {
  const lines = csvContent.trim().split("\n")
  
  // Skip header line
  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    // Parse CSV line properly handling quoted fields
    const values = parseCSVLine(line)

    return {
      id: Number.parseInt(values[0]) || index + 1,
      title: values[1] || "",
      description: values[2] || "",
      latitude: Number.parseFloat(values[3]) || 13.7563,
      longitude: Number.parseFloat(values[4]) || 100.5018,
      audioUrl: values[5] || "",
      category: (values[6] as any) || "other",
      severity: (values[7] as any) || "medium",
      status: (values[8] as any) || "pending",
      factoryName: values[9] || "",
      reportedBy: values[10] || "",
      reportedDate: values[11] || new Date().toISOString().split("T")[0],
      contactPhone: values[12] || "",
      contactEmail: values[13] || "",
      affectedResidents: Number.parseInt(values[14]) || 0,
      evidence: values[15] ? values[15].split(";") : [],
      tags: values[16] ? values[16].split(";") : [],
    }
  })
}

// Helper function to properly parse CSV line with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  
  // Add the last field
  result.push(current.trim())
  
  return result
}

