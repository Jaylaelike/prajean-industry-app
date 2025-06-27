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
  const headers = lines[0].split(",").map((h) => h.trim())

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))

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

// Sample CSV data structure
export const SAMPLE_CSV_DATA = `id,title,description,latitude,longitude,audioUrl,category,severity,status,factoryName,reportedBy,reportedDate,contactPhone,contactEmail,affectedResidents,evidence,tags
1,"Excessive Noise Pollution","Chemical plant operating machinery at night causing severe noise pollution",13.7563,100.5018,"https://nis1j7mrn8.ufs.sh/f/zD359AIVpUoBNwyys2B60XJ9w23sf4YtdonUKrkIiPAWFDgc","noise","high","pending","Bangkok Chemical Industries","Somchai Jaidee","2024-06-20","+66-89-123-4567","somchai.j@email.com",45,"Audio recording;Photos;Witness statements","night-shift;machinery;residential-area"
2,"Chemical Smell & Air Pollution","Strong chemical odors from textile factory causing respiratory issues",18.7883,98.9853,"https://nis1j7mrn8.ufs.sh/f/zD359AIVpUoBhi7uZ18g5YpIfqtOPSa3buviFoDEdwJW6KsX","air","critical","investigating","Northern Textile Co.","Niran Patel","2024-06-18","+66-82-987-6543","niran.patel@email.com",120,"Air quality readings;Medical reports;Audio testimony","chemical-odor;health-impact;textile"
3,"Water Contamination","Factory discharge turning local canal dark brown with unusual smell",7.8804,98.3923,"https://nis1j7mrn8.ufs.sh/f/zD359AIVpUoB7Fimy6KaF2V7tOW5YZTA64KjPD8iofSeB3x0","water","high","resolved","Southern Manufacturing","Malee Fishing Group","2024-06-15","+66-85-456-7890","malee.fishing@email.com",75,"Water samples;Fish mortality photos;Community audio","discharge;fishing;canal"
4,"Industrial Waste Dumping","Illegal dumping of industrial waste near residential area",16.4419,102.836,"https://nis1j7mrn8.ufs.sh/f/zD359AIVpUoB7Fimy6KaF2V7tOW5YZTA64KjPD8iofSeB3x0","waste","critical","pending","Northeast Industries","Isaan Community Group","2024-06-22","+66-87-234-5678","isaan.community@email.com",200,"Waste photos;Soil samples;Community testimony","illegal-dumping;health-risk;industrial-waste"
5,"Air Quality Deterioration","Multiple factories causing severe air pollution affecting entire district",12.6847,101.1496,"https://nis1j7mrn8.ufs.sh/f/zD359AIVpUoBNwyys2B60XJ9w23sf4YtdonUKrkIiPAWFDgc","air","critical","investigating","Southern Industrial Complex","Hat Yai Environmental Group","2024-06-19","+66-84-567-8901","hatyai.env@email.com",300,"Air monitoring data;Health reports;Satellite images","multiple-sources;district-wide;air-quality"`
