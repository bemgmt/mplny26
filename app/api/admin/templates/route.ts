import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/js/config"

/**
 * GET /api/admin/templates
 * Get all templates
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      templates: config.templates,
      count: config.templates.length,
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
    
    // In a real implementation, this would:
    // 1. Save uploaded images to storage
    // 2. Add template to database
    // 3. Return the new template
    
    const newTemplate = {
      id: `template-${Date.now()}`,
      name,
      description: description || "",
      category,
      thumbnail: thumbnailUrl || "/templates/default-thumb.png",
      image: imageUrl || "/templates/default.png",
    }
    
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

