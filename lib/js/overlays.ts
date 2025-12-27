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
    const response = await fetch("/api/admin/overlays")
    const data = await response.json()
    if (data.success && data.overlays) {
      return data.overlays.map((o: any) => ({
        id: o.id,
        name: o.name,
        emoji: o.emoji,
        imageUrl: o.imageUrl,
        type: o.type || "emoji",
      }))
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

