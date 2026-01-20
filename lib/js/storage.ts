/**
 * Storage utilities for managing photos and session data
 */

import { config } from "./config"
import { compressImageDataUrl } from "./utils"

export interface StoredPhoto {
  id: string
  dataUrl: string
  timestamp: number
}

/**
 * Get all stored photos
 */
export function getStoredPhotos(): StoredPhoto[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(config.storage.photosKey)
    if (!stored) return []
    return JSON.parse(stored) as StoredPhoto[]
  } catch (error) {
    console.error("Error reading stored photos:", error)
    return []
  }
}

/**
 * Save a photo to storage
 * Automatically compresses and removes oldest photos if limit is exceeded
 */
export async function savePhoto(dataUrl: string): Promise<StoredPhoto> {
  // Compress image before saving to reduce storage size
  let compressedDataUrl = dataUrl
  try {
    compressedDataUrl = await compressImageDataUrl(
      dataUrl,
      config.storage.compressionQuality || 0.7,
      1920,
      1080
    )
    console.log("Photo compressed for storage")
  } catch (error) {
    console.warn("Failed to compress photo, using original:", error)
    // Continue with original if compression fails
  }
  
  const photo: StoredPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dataUrl: compressedDataUrl,
    timestamp: Date.now(),
  }
  
  const photos = getStoredPhotos()
  photos.unshift(photo) // Add to beginning
  
  // Limit the number of photos stored (keep only the most recent)
  const maxPhotos = config.storage.maxPhotos || 15
  if (photos.length > maxPhotos) {
    // Remove oldest photos (keep the most recent maxPhotos)
    photos.splice(maxPhotos)
    console.log(`Photo limit reached (${maxPhotos}). Removed oldest photos.`)
  }
  
  try {
    localStorage.setItem(config.storage.photosKey, JSON.stringify(photos))
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Attempting to free space by removing older photos...")
      
      // Try progressively smaller limits
      const limits = [10, 5, 3, 1]
      let saved = false
      
      for (const limit of limits) {
        const reducedPhotos = photos.slice(0, Math.min(limit, photos.length))
        try {
          localStorage.setItem(config.storage.photosKey, JSON.stringify(reducedPhotos))
          console.log(`Successfully saved photo after reducing to ${limit} photos.`)
          saved = true
          break
        } catch (retryError) {
          // Try next smaller limit
          continue
        }
      }
      
      if (!saved) {
        // Last resort: clear all and save only the new photo
        try {
          localStorage.setItem(config.storage.photosKey, JSON.stringify([photo]))
          console.log("Saved only the new photo after clearing storage.")
        } catch (finalError) {
          console.error("Failed to save photo to localStorage:", finalError)
          // Photo is still returned, but not saved to localStorage
          // Don't show alert as this is expected in extreme cases
        }
      }
    } else {
      console.error("Error saving photo to localStorage:", error)
      throw error
    }
  }
  
  return photo
}

/**
 * Delete a photo from storage
 */
export function deletePhoto(photoId: string): void {
  const photos = getStoredPhotos()
  const filtered = photos.filter((p) => p.id !== photoId)
  localStorage.setItem(config.storage.photosKey, JSON.stringify(filtered))
}

/**
 * Clear all photos
 */
export function clearAllPhotos(): void {
  localStorage.removeItem(config.storage.photosKey)
}

/**
 * Get photo count
 */
export function getPhotoCount(): number {
  return getStoredPhotos().length
}

