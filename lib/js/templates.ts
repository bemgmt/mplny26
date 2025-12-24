/**
 * Template management utilities
 */

import { config } from "./config"

export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  image: string
  category: string
}

/**
 * Get all templates
 */
export function getTemplates(): Template[] {
  return config.templates
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

