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

/**
 * Get all templates (from config + stored templates)
 */
export function getTemplates(): Template[] {
  // Get templates from config
  const configTemplates: Template[] = config.templates
  
  // Get stored templates (uploaded by team members)
  const storedTemplates = getAllTemplates()
  
  // Convert stored templates to Template format
  const storedAsTemplates: Template[] = storedTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    thumbnail: t.thumbnail,
    image: t.image,
    category: t.category,
  }))
  
  // Combine and return (stored templates first, then config templates)
  return [...storedAsTemplates, ...configTemplates]
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return config.templates.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  return config.templates.filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(config.templates.map((t) => t.category))
  return Array.from(categories)
}

