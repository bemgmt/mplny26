/**
 * Background management utilities
 */

import { config } from "./config"

export interface Background {
  id: string
  name: string
  description: string
  thumbnail: string
  image: string
  color: string
}

/**
 * Get all backgrounds
 */
export function getBackgrounds(): Background[] {
  return config.backgrounds
}

/**
 * Get background by ID
 */
export function getBackgroundById(id: string): Background | undefined {
  return config.backgrounds.find((b) => b.id === id)
}

