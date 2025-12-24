/**
 * Session management for the photobooth
 */

import { config } from "./config"

export interface SessionData {
  sessionId: string
  startTime: number
  photoCount: number
  lastActivity: number
}

/**
 * Get or create a session
 */
export function getSession(): SessionData {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      startTime: Date.now(),
      photoCount: 0,
      lastActivity: Date.now(),
    }
  }

  try {
    const stored = localStorage.getItem(config.storage.sessionKey)
    if (stored) {
      const session = JSON.parse(stored) as SessionData
      // Update last activity
      session.lastActivity = Date.now()
      localStorage.setItem(config.storage.sessionKey, JSON.stringify(session))
      return session
    }
  } catch (error) {
    console.error("Error reading session:", error)
  }

  // Create new session
  const newSession: SessionData = {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    photoCount: 0,
    lastActivity: Date.now(),
  }
  
  localStorage.setItem(config.storage.sessionKey, JSON.stringify(newSession))
  return newSession
}

/**
 * Update session photo count
 */
export function updateSessionPhotoCount(count: number): void {
  const session = getSession()
  session.photoCount = count
  session.lastActivity = Date.now()
  localStorage.setItem(config.storage.sessionKey, JSON.stringify(session))
}

/**
 * Clear session
 */
export function clearSession(): void {
  localStorage.removeItem(config.storage.sessionKey)
}

