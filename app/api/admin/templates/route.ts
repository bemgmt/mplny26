import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/js/config"
import { sql } from "@vercel/postgres"

// Initialize the templates table if it doesn't exist
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        thumbnail TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `
  } catch (error) {
    console.error("Error ensuring table exists:", error)
    // Table might already exist, continue
  }
}

/**
 * Get templates from Neon Postgres
 */
async function getTemplatesFromDB(): Promise<any[]> {
  try {
    await ensureTableExists()
    const result = await sql`
      SELECT id, name, description, category, thumbnail, image, created_at as createdAt
      FROM templates
      ORDER BY created_at DESC
    `
    return result.rows || []
  } catch (error) {
    console.error("Error reading templates from database:", error)
    // If database is not configured, return empty array
    return []
  }
}

/**
 * Save template to Neon Postgres
 */
async function saveTemplateToDB(template: any): Promise<void> {
  try {
    await ensureTableExists()
    await sql`
      INSERT INTO templates (id, name, description, category, thumbnail, image, created_at)
      VALUES (${template.id}, ${template.name}, ${template.description}, ${template.category}, ${template.thumbnail}, ${template.image}, ${template.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        thumbnail = EXCLUDED.thumbnail,
        image = EXCLUDED.image
    `
  } catch (error) {
    console.error("Error saving template to database:", error)
    throw error
  }
}

/**
 * Delete template from Neon Postgres
 */
async function deleteTemplateFromDB(templateId: string): Promise<void> {
  try {
    await ensureTableExists()
    await sql`DELETE FROM templates WHERE id = ${templateId}`
  } catch (error) {
    console.error("Error deleting template from database:", error)
    throw error
  }
}

/**
 * GET /api/admin/templates
 * Get all templates (config + globally stored templates from Neon)
 */
export async function GET() {
  try {
    // Get templates from Neon Postgres
    const dbTemplates = await getTemplatesFromDB()
    
    // Combine database templates with config templates
    const allTemplates = [
      ...dbTemplates,
      ...config.templates,
    ]
    
    return NextResponse.json({
      success: true,
      templates: allTemplates,
      count: allTemplates.length,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/templates
 * Add a new template (stored in Neon Postgres)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, imageUrl, thumbnailUrl } = body
    
    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Name and category are required" },
        { status: 400 }
      )
    }
    
    // Create new template
    const templateId = `template-${Date.now()}`
    const newTemplate = {
      id: templateId,
      name,
      description: description || "",
      category,
      thumbnail: thumbnailUrl || imageUrl || "/templates/default-thumb.png",
      image: imageUrl || "/templates/default.png",
      createdAt: Date.now(),
    }

    // Save to Neon Postgres
    await saveTemplateToDB(newTemplate)
    
    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: "Template added successfully",
    })
  } catch (error) {
    console.error("Error adding template:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add template" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/templates
 * Delete a template from Neon Postgres
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      )
    }
    
    // Delete from Neon Postgres
    await deleteTemplateFromDB(templateId)
    
    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
      templateId,
    })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
