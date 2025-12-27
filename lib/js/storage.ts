/**
 * Storage utilities for managing photos and session data
 */

import { config } from "./config"

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
 * Automatically removes oldest photos if limit is exceeded
 */
export function savePhoto(dataUrl: string): StoredPhoto {
  const photo: StoredPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dataUrl,
    timestamp: Date.now(),
  }
  
  const photos = getStoredPhotos()
  photos.unshift(photo) // Add to beginning
  
  // Limit the number of photos stored (keep only the most recent)
  const maxPhotos = config.storage.maxPhotos || 50
  if (photos.length > maxPhotos) {
    // Remove oldest photos (keep the most recent maxPhotos)
    photos.splice(maxPhotos)
    console.log(`Photo limit reached (${maxPhotos}). Removed ${photos.length - maxPhotos} oldest photos.`)
  }
  
  try {
    localStorage.setItem(config.storage.photosKey, JSON.stringify(photos))
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Attempting to free space by removing older photos...")
      
      // Try to remove older photos and retry
      // Keep only the most recent 25 photos
      const reducedPhotos = photos.slice(0, Math.min(25, photos.length))
      try {
        localStorage.setItem(config.storage.photosKey, JSON.stringify(reducedPhotos))
        console.log("Successfully saved photo after reducing storage.")
        return photo
      } catch (retryError) {
        console.error("Still unable to save photo after reducing storage. Clearing all photos and saving only the new one.", retryError)
        // Last resort: clear all and save only the new photo
        try {
          localStorage.setItem(config.storage.photosKey, JSON.stringify([photo]))
          console.log("Saved only the new photo after clearing storage.")
        } catch (finalError) {
          console.error("Failed to save photo to localStorage:", finalError)
          // Photo is still returned, but not saved to localStorage
          alert("Unable to save photo to storage. The photo may not persist after page reload.")
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

