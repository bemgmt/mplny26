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
 */
export function savePhoto(dataUrl: string): StoredPhoto {
  const photo: StoredPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dataUrl,
    timestamp: Date.now(),
  }
  
  const photos = getStoredPhotos()
  photos.unshift(photo) // Add to beginning
  localStorage.setItem(config.storage.photosKey, JSON.stringify(photos))
  
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

