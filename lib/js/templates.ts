/**
 * Template management utilities
 */

import { config } from "./config"
import { getAllTemplates, AdminTemplate } from "./admin-storage"

export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  image: string
  category: string
}

// Cache for server templates
let serverTemplatesCache: Template[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch templates from server
 */
async function fetchServerTemplates(): Promise<Template[]> {
  try {
    const response = await fetch("/api/admin/templates")
    const data = await response.json()
    if (data.success && data.templates) {
      return data.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        thumbnail: t.thumbnail,
        image: t.image,
        category: t.category,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching server templates:", error)
    return []
  }
}

/**
 * Get all templates (from server + config + local storage)
 */
export async function getTemplatesAsync(): Promise<Template[]> {
  // Fetch from server (with caching)
  const now = Date.now()
  if (!serverTemplatesCache || (now - lastFetchTime) > CACHE_DURATION) {
    serverTemplatesCache = await fetchServerTemplates()
    lastFetchTime = now
  }

  // Get templates from config
  const configTemplates: Template[] = config.templates
  
  // Get stored templates from localStorage (for backward compatibility)
  const storedTemplates = getAllTemplates()
  const storedAsTemplates: Template[] = storedTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    thumbnail: t.thumbnail,
    image: t.image,
    category: t.category,
  }))
  
  // Combine: server templates (newest), then stored (local), then config
  // Remove duplicates by ID
  const allTemplates = [...serverTemplatesCache, ...storedAsTemplates, ...configTemplates]
  const uniqueTemplates = allTemplates.filter((template, index, self) =>
    index === self.findIndex((t) => t.id === template.id)
  )
  
  return uniqueTemplates
}

/**
 * Get all templates (synchronous version - uses cache)
 */
export function getTemplates(): Template[] {
  // Get templates from config
  const configTemplates: Template[] = config.templates
  
  // Get stored templates from localStorage
  const storedTemplates = getAllTemplates()
  const storedAsTemplates: Template[] = storedTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    thumbnail: t.thumbnail,
    image: t.image,
    category: t.category,
  }))
  
  // Include server templates from cache if available
  const serverTemplates = serverTemplatesCache || []
  
  // Combine and remove duplicates
  const allTemplates = [...serverTemplates, ...storedAsTemplates, ...configTemplates]
  const uniqueTemplates = allTemplates.filter((template, index, self) =>
    index === self.findIndex((t) => t.id === template.id)
  )
  
  return uniqueTemplates
}

/**
 * Refresh templates from server
 */
export async function refreshTemplates(): Promise<void> {
  serverTemplatesCache = await fetchServerTemplates()
  lastFetchTime = Date.now()
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  const allTemplates = getTemplates()
  return allTemplates.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  const allTemplates = getTemplates()
  return allTemplates.filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export function getTemplateCategories(): string[] {
  const allTemplates = getTemplates()
  const categories = new Set(allTemplates.map((t) => t.category))
  return Array.from(categories)
}
