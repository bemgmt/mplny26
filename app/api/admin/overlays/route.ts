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
    
    // Debug: Log what we're returning from database
    console.log("=== GET OVERLAYS FROM DB ===")
    console.log("Total overlays:", result.rows?.length || 0)
    result.rows?.forEach((overlay: any) => {
      console.log(`Overlay ${overlay.id}:`, {
        name: overlay.name,
        type: overlay.type,
        imageUrl: overlay.imageUrl,
        rawRow: JSON.stringify(overlay),
      })
    })
    console.log("=== END GET OVERLAYS FROM DB ===")
    
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
    
    console.log("=== SAVE OVERLAY TO DB DEBUG ===")
    console.log("Full overlay object:", JSON.stringify(overlay, null, 2))
    console.log("Overlay imageUrl value:", overlay.imageUrl)
    console.log("Overlay imageUrl type:", typeof overlay.imageUrl)
    console.log("Overlay imageUrl is null?", overlay.imageUrl === null)
    console.log("Overlay imageUrl is undefined?", overlay.imageUrl === undefined)
    console.log("Overlay imageUrl truthy?", !!overlay.imageUrl)
    
    // Prepare the imageUrl value for SQL
    const imageUrlValue = overlay.imageUrl || null
    console.log("imageUrlValue for SQL:", imageUrlValue)
    console.log("imageUrlValue type:", typeof imageUrlValue)
    
    await sql`
      INSERT INTO overlays (id, name, emoji, image_url, type, created_at, updated_at)
      VALUES (${overlay.id}, ${overlay.name}, ${overlay.emoji || null}, ${imageUrlValue}, ${overlay.type}, ${overlay.createdAt}, ${overlay.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        emoji = EXCLUDED.emoji,
        image_url = EXCLUDED.image_url,
        type = EXCLUDED.type,
        updated_at = EXCLUDED.updated_at
    `
    
    // Verify what was actually saved
    const verifyResult = await sql`
      SELECT id, name, image_url, type
      FROM overlays
      WHERE id = ${overlay.id}
    `
    
    console.log("Verification query result:", {
      found: verifyResult.rows.length > 0,
      savedOverlay: verifyResult.rows[0] ? {
        id: verifyResult.rows[0].id,
        name: verifyResult.rows[0].name,
        image_url: verifyResult.rows[0].image_url,
        type: verifyResult.rows[0].type,
      } : null,
    })
    console.log("=== END SAVE OVERLAY TO DB DEBUG ===")
    
    console.log("Overlay saved successfully to database")
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
    // Ensure imageUrl is always included (even if null)
    const allOverlays = [
      ...dbOverlays.map((overlay: any) => ({
        ...overlay,
        imageUrl: overlay.imageUrl || null, // Ensure imageUrl is always present
      })),
      ...configOverlays.filter(cfg => !dbOverlays.find(db => db.id === cfg.id)),
    ]
    
    // Debug: Log what we're sending
    console.log("=== SENDING OVERLAYS TO CLIENT ===")
    console.log("Total overlays:", allOverlays.length)
    allOverlays.forEach((overlay: any) => {
      console.log(`Overlay ${overlay.id}:`, {
        name: overlay.name,
        type: overlay.type,
        imageUrl: overlay.imageUrl,
        hasImageUrl: !!overlay.imageUrl,
      })
    })
    console.log("=== END SENDING OVERLAYS ===")
    
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
    
    console.log("=== POST OVERLAY REQUEST DEBUG ===")
    console.log("Request body:", JSON.stringify(body, null, 2))
    console.log("Extracted values:", {
      id,
      name,
      emoji,
      imageUrl,
      type,
      imageUrlType: typeof imageUrl,
      imageUrlIsNull: imageUrl === null,
      imageUrlIsUndefined: imageUrl === undefined,
    })
    
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 }
      )
    }

    // Strict validation: image overlays MUST have a valid imageUrl
    if (type === "image") {
      if (!imageUrl || imageUrl.trim() === "" || imageUrl === "null" || imageUrl === "undefined") {
        console.error("Rejecting image overlay without valid imageUrl:", {
          id,
          name,
          type,
          imageUrl,
          imageUrlType: typeof imageUrl,
        })
        return NextResponse.json(
          { success: false, error: "Image URL is required for image-type overlays. Please upload an image file." },
          { status: 400 }
        )
      }
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

    console.log("newOverlay object before save:", JSON.stringify(newOverlay, null, 2))
    console.log("newOverlay.imageUrl:", newOverlay.imageUrl)
    console.log("newOverlay.imageUrl type:", typeof newOverlay.imageUrl)
    console.log("=== END POST OVERLAY REQUEST DEBUG ===")

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

