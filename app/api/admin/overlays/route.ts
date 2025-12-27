import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/js/config"
import { sql } from "@vercel/postgres"

// Initialize the overlays table if it doesn't exist
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS overlays (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        emoji VARCHAR(10),
        image_url TEXT,
        type VARCHAR(20) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `
  } catch (error) {
    console.error("Error ensuring table exists:", error)
    // Table might already exist, continue
  }
}

/**
 * Get overlays from Neon Postgres
 */
async function getOverlaysFromDB(): Promise<any[]> {
  try {
    await ensureTableExists()
    const result = await sql`
      SELECT id, name, emoji, image_url as imageUrl, type, created_at as createdAt, updated_at as updatedAt
      FROM overlays
      ORDER BY created_at DESC
    `
    return result.rows || []
  } catch (error) {
    console.error("Error reading overlays from database:", error)
    // If database is not configured, return empty array
    return []
  }
}

/**
 * Save overlay to Neon Postgres
 */
async function saveOverlayToDB(overlay: any): Promise<void> {
  try {
    await ensureTableExists()
    await sql`
      INSERT INTO overlays (id, name, emoji, image_url, type, created_at, updated_at)
      VALUES (${overlay.id}, ${overlay.name}, ${overlay.emoji || null}, ${overlay.imageUrl || null}, ${overlay.type}, ${overlay.createdAt}, ${overlay.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        emoji = EXCLUDED.emoji,
        image_url = EXCLUDED.image_url,
        type = EXCLUDED.type,
        updated_at = EXCLUDED.updated_at
    `
  } catch (error) {
    console.error("Error saving overlay to database:", error)
    throw error
  }
}

/**
 * Delete overlay from Neon Postgres
 */
async function deleteOverlayFromDB(overlayId: string): Promise<void> {
  try {
    await ensureTableExists()
    await sql`DELETE FROM overlays WHERE id = ${overlayId}`
  } catch (error) {
    console.error("Error deleting overlay from database:", error)
    throw error
  }
}

/**
 * GET /api/admin/overlays
 * Get all overlays (config + globally stored overlays from Neon)
 */
export async function GET() {
  try {
    // Get overlays from Neon Postgres
    const dbOverlays = await getOverlaysFromDB()
    
    // Convert config overlays to new format
    const configOverlays = config.overlays.map(overlay => ({
      id: overlay.id,
      name: overlay.name,
      emoji: overlay.emoji,
      type: "emoji" as const,
    }))
    
    // Combine database overlays with config overlays
    // Database overlays take precedence (they can override config overlays)
    const allOverlays = [
      ...dbOverlays,
      ...configOverlays.filter(cfg => !dbOverlays.find(db => db.id === cfg.id)),
    ]
    
    return NextResponse.json({
      success: true,
      overlays: allOverlays,
      count: allOverlays.length,
    })
  } catch (error) {
    console.error("Error fetching overlays:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch overlays" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/overlays
 * Add or update an overlay (stored in Neon Postgres)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, emoji, imageUrl, type } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 }
      )
    }

    if (type === "image" && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required for image-type overlays" },
        { status: 400 }
      )
    }

    if (type === "emoji" && !emoji) {
      return NextResponse.json(
        { success: false, error: "Emoji is required for emoji-type overlays" },
        { status: 400 }
      )
    }
    
    // Use provided ID or generate new one
    const overlayId = id || `overlay-${Date.now()}`
    const now = Date.now()
    const newOverlay = {
      id: overlayId,
      name,
      emoji: type === "emoji" ? emoji : null,
      imageUrl: type === "image" ? imageUrl : null,
      type,
      createdAt: now,
      updatedAt: now,
    }

    // Save to Neon Postgres
    await saveOverlayToDB(newOverlay)
    
    return NextResponse.json({
      success: true,
      overlay: newOverlay,
      message: id ? "Overlay updated successfully" : "Overlay added successfully",
    })
  } catch (error) {
    console.error("Error saving overlay:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save overlay" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/overlays
 * Delete an overlay from Neon Postgres
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const overlayId = searchParams.get("id")
    
    if (!overlayId) {
      return NextResponse.json(
        { success: false, error: "Overlay ID is required" },
        { status: 400 }
      )
    }
    
    // Don't allow deleting config overlays
    const configOverlay = config.overlays.find(o => o.id === overlayId)
    if (configOverlay) {
      return NextResponse.json(
        { success: false, error: "Cannot delete built-in overlay" },
        { status: 400 }
      )
    }
    
    // Delete from Neon Postgres
    await deleteOverlayFromDB(overlayId)
    
    return NextResponse.json({
      success: true,
      message: "Overlay deleted successfully",
      overlayId,
    })
  } catch (error) {
    console.error("Error deleting overlay:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete overlay" },
      { status: 500 }
    )
  }
}

