import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

/**
 * GET /api/admin/overlays/debug
 * Debug endpoint to check what overlays are in the database
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, emoji, image_url, type, created_at, updated_at
      FROM overlays
      ORDER BY created_at DESC
    `
    
    const overlays = result.rows || []
    
    // Check for duplicate image URLs
    const imageUrlMap = new Map<string, string[]>()
    overlays.forEach((overlay: any) => {
      if (overlay.image_url) {
        if (!imageUrlMap.has(overlay.image_url)) {
          imageUrlMap.set(overlay.image_url, [])
        }
        imageUrlMap.get(overlay.image_url)!.push(overlay.id)
      }
    })
    
    const duplicates = Array.from(imageUrlMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([url, ids]) => ({ url, overlayIds: ids }))
    
    return NextResponse.json({
      success: true,
      totalOverlays: overlays.length,
      overlays: overlays.map((o: any) => ({
        id: o.id,
        name: o.name,
        type: o.type,
        imageUrl: o.image_url,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      })),
      duplicateImageUrls: duplicates,
      summary: {
        total: overlays.length,
        imageType: overlays.filter((o: any) => o.type === "image").length,
        emojiType: overlays.filter((o: any) => o.type === "emoji").length,
        withImageUrl: overlays.filter((o: any) => o.image_url).length,
        duplicates: duplicates.length,
      }
    })
  } catch (error) {
    console.error("Error fetching overlays for debug:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch overlays",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}


