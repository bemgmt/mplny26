/**
 * Admin storage utilities for managing photos and templates
 */

export interface AdminPhoto {
  id: string
  dataUrl: string
  timestamp: number
  sessionId?: string
  metadata?: {
    overlay?: string
    template?: string
    background?: string
  }
}

export interface AdminTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  image: string
  category: string
  createdAt: number
}

/**
 * Get all photos from all sessions
 */
export function getAllPhotos(): AdminPhoto[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem("lunar-new-year-photos")
    if (!stored) return []
    
    const photos = JSON.parse(stored) as AdminPhoto[]
    return photos.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Error reading photos:", error)
    return []
  }
}

/**
 * Get photos by date range
 */
export function getPhotosByDateRange(startDate: Date, endDate: Date): AdminPhoto[] {
  const allPhotos = getAllPhotos()
  return allPhotos.filter(
    (photo) => photo.timestamp >= startDate.getTime() && photo.timestamp <= endDate.getTime()
  )
}

/**
 * Delete photos by IDs
 */
export function deletePhotosByIds(ids: string[]): number {
  if (typeof window === "undefined") return 0
  
  try {
    const photos = getAllPhotos()
    const filtered = photos.filter((p) => !ids.includes(p.id))
    localStorage.setItem("lunar-new-year-photos", JSON.stringify(filtered))
    return photos.length - filtered.length
  } catch (error) {
    console.error("Error deleting photos:", error)
    return 0
  }
}

/**
 * Export photos as JSON
 */
export function exportPhotosAsJSON(photos: AdminPhoto[]): string {
  return JSON.stringify(photos, null, 2)
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
  const photos = getAllPhotos()
  const totalSize = photos.reduce((acc, photo) => {
    // Estimate size from data URL (rough approximation)
    return acc + (photo.dataUrl.length * 0.75) // Base64 is ~33% larger
  }, 0)
  
  return {
    totalPhotos: photos.length,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    oldestPhoto: photos.length > 0 ? new Date(photos[photos.length - 1].timestamp) : null,
    newestPhoto: photos.length > 0 ? new Date(photos[0].timestamp) : null,
  }
}

/**
 * Template storage key
 */
const TEMPLATES_STORAGE_KEY = "lunar-new-year-templates"

/**
 * Get all stored templates
 */
export function getAllTemplates(): AdminTemplate[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!stored) return []
    
    const templates = JSON.parse(stored) as AdminTemplate[]
    return templates.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error reading templates:", error)
    return []
  }
}

/**
 * Save a template
 */
export function saveTemplate(template: AdminTemplate): void {
  if (typeof window === "undefined") return
  
  try {
    const templates = getAllTemplates()
    const existingIndex = templates.findIndex((t) => t.id === template.id)
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template
    } else {
      templates.push(template)
    }
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error("Error saving template:", error)
  }
}

/**
 * Delete a template by ID
 */
export function deleteTemplateById(id: string): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const templates = getAllTemplates()
    const filtered = templates.filter((t) => t.id !== id)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered))
    return templates.length > filtered.length
  } catch (error) {
    console.error("Error deleting template:", error)
    return false
  }
}

