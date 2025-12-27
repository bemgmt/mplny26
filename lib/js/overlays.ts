/**
 * Overlay management utilities
 */

import { config } from "./config"

export interface Overlay {
  id: string
  name: string
  emoji?: string
  imageUrl?: string
  type: "emoji" | "image"
}

// Cache for server overlays
let serverOverlaysCache: Overlay[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch overlays from server
 */
async function fetchServerOverlays(): Promise<Overlay[]> {
  try {
    // Add cache-busting query parameter to ensure fresh data
    const response = await fetch(`/api/admin/overlays?t=${Date.now()}`)
    const data = await response.json()
    
    // Debug: Log raw API response
    console.log("Raw API response:", data)
    if (data.success && data.overlays) {
      console.log("Raw overlays from API:", data.overlays)
      
      const overlays = data.overlays.map((o: any) => {
        // Handle both imageUrl and image_url (in case of inconsistency)
        const imageUrl = o.imageUrl || o.image_url || null
        
        const overlay = {
          id: o.id,
          name: o.name,
          emoji: o.emoji || null,
          imageUrl: imageUrl,
          type: o.type || "emoji",
        }
        
        console.log(`Mapped overlay ${overlay.id}:`, {
          name: overlay.name,
          type: overlay.type,
          imageUrl: overlay.imageUrl,
          rawImageUrl: o.imageUrl,
          rawImage_url: o.image_url,
        })
        
        return overlay
      })
      
      // Debug: Log what we fetched
      console.log("Fetched overlays from server:", overlays.map(o => ({
        id: o.id,
        name: o.name,
        type: o.type,
        imageUrl: o.imageUrl,
      })))
      
      return overlays
    }
    return []
  } catch (error) {
    console.error("Error fetching server overlays:", error)
    return []
  }
}

/**
 * Get all overlays (from server + config)
 */
export async function getOverlaysAsync(): Promise<Overlay[]> {
  // Fetch from server (with caching)
  const now = Date.now()
  if (!serverOverlaysCache || (now - lastFetchTime) > CACHE_DURATION) {
    serverOverlaysCache = await fetchServerOverlays()
    lastFetchTime = now
  }

  // Get overlays from config
  const configOverlays: Overlay[] = config.overlays.map(overlay => ({
    id: overlay.id,
    name: overlay.name,
    emoji: overlay.emoji,
    type: "emoji" as const,
  }))
  
  // Combine: server overlays (newest), then config
  // Remove duplicates by ID
  const allOverlays = [...serverOverlaysCache, ...configOverlays]
  const uniqueOverlays = allOverlays.filter((overlay, index, self) =>
    index === self.findIndex((o) => o.id === overlay.id)
  )
  
  return uniqueOverlays
}

/**
 * Get all overlays (synchronous version - uses cache)
 */
export function getOverlays(): Overlay[] {
  // Get overlays from config
  const configOverlays: Overlay[] = config.overlays.map(overlay => ({
    id: overlay.id,
    name: overlay.name,
    emoji: overlay.emoji,
    type: "emoji" as const,
  }))
  
  // Include server overlays from cache if available
  const serverOverlays = serverOverlaysCache || []
  
  // Combine and remove duplicates
  const allOverlays = [...serverOverlays, ...configOverlays]
  const uniqueOverlays = allOverlays.filter((overlay, index, self) =>
    index === self.findIndex((o) => o.id === overlay.id)
  )
  
  return uniqueOverlays
}

/**
 * Refresh overlays from server
 */
export async function refreshOverlays(): Promise<void> {
  serverOverlaysCache = await fetchServerOverlays()
  lastFetchTime = Date.now()
}

/**
 * Get overlay by ID
 */
export function getOverlayById(id: string): Overlay | undefined {
  const allOverlays = getOverlays()
  return allOverlays.find((o) => o.id === id)
}

