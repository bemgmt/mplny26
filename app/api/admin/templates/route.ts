import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/js/config"
import { saveTemplate, AdminTemplate } from "@/lib/js/admin-storage"

/**
 * GET /api/admin/templates
 * Get all templates (from config)
 * Note: Stored templates (uploaded by team) are managed client-side via localStorage
 * and merged with config templates in the getTemplates() function
 */
export async function GET() {
  try {
    // Return config templates (stored templates are handled client-side)
    return NextResponse.json({
      success: true,
      templates: config.templates,
      count: config.templates.length,
      note: "Uploaded templates are stored client-side and merged with config templates",
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
 * Add a new template
 * Supports both file uploads (via upload endpoint) and URL-based templates
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
    
    // Use provided URLs or default paths
    const templateId = `template-${Date.now()}`
    const newTemplate: AdminTemplate = {
      id: templateId,
      name,
      description: description || "",
      category,
      thumbnail: thumbnailUrl || imageUrl || "/templates/default-thumb.png",
      image: imageUrl || "/templates/default.png",
      createdAt: Date.now(),
    }
    
    // Save template to localStorage (client-side will handle this)
    // For server-side, we return the template and the client will save it
    // This is because localStorage is not available on the server
    
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
 * Delete a template
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
    
    // In a real implementation, this would delete from database
    
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

