/**
 * Authentication utilities for admin access
 */

const ADMIN_PIN = "1234"
const AUTH_KEY = "photobooth-admin-auth"

export interface AuthState {
  isAuthenticated: boolean
  timestamp: number
}

/**
 * Verify admin PIN
 */
export function verifyAdminPin(pin: string): boolean {
  return pin === ADMIN_PIN
}

/**
 * Set authentication state
 */
export function setAuthenticated(isAuthenticated: boolean): void {
  if (typeof window === "undefined") return
  
  const authState: AuthState = {
    isAuthenticated,
    timestamp: Date.now(),
  }
  
  if (isAuthenticated) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState))
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) return false
    
    const authState = JSON.parse(stored) as AuthState
    // Check if auth is still valid (24 hours)
    const isValid = Date.now() - authState.timestamp < 24 * 60 * 60 * 1000
    
    if (!isValid) {
      localStorage.removeItem(AUTH_KEY)
      return false
    }
    
    return authState.isAuthenticated
  } catch {
    return false
  }
}

/**
 * Logout admin
 */
export function logout(): void {
  setAuthenticated(false)
}

