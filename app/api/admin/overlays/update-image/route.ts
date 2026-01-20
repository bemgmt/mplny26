import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@vercel/postgres"
import { createHash } from "crypto"

/**
 * POST /api/admin/overlays/update-image
 * Update an existing overlay's image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const overlayId = formData.get("overlayId") as string | null
    const overlayFile = formData.get("overlay") as File | null

    if (!overlayId) {
      return NextResponse.json(
        { success: false, error: "Overlay ID is required" },
        { status: 400 }
      )
    }

    if (!overlayFile) {
      return NextResponse.json(
        { success: false, error: "Overlay file is required" },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    const allowedExtensions = [".png", ".jpg", ".jpeg"]

    const fileType = overlayFile.type
    const fileName = overlayFile.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

    if (!allowedTypes.includes(fileType) && !hasValidExtension) {
      return NextResponse.json(
        { success: false, error: "Overlay file must be .png or .jpg format" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (overlayFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Overlay file is too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel project settings."
        },
        { status: 500 }
      )
    }

    // Calculate file hash for verification
    const fileBuffer = await overlayFile.arrayBuffer()
    const fileHash = createHash("md5").update(Buffer.from(fileBuffer)).digest("hex")
    const fileSize = overlayFile.size
    const firstBytes = Buffer.from(fileBuffer.slice(0, 20)).toString("hex")

    // Upload new image to Vercel Blob
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const overlayExtension = overlayFile.name.split(".").pop()?.toLowerCase() || "png"
    const overlayFileName = `overlays/overlay-${timestamp}-${randomSuffix}.${overlayExtension}`
    
    // Log what we're about to upload
    console.log("=== BLOB UPDATE IMAGE DEBUG ===")
    console.log("Overlay ID:", overlayId)
    console.log("File received:", {
      name: overlayFile.name,
      type: overlayFile.type,
      size: fileSize,
      lastModified: overlayFile.lastModified,
      hash: fileHash,
      firstBytes: firstBytes,
    })
    console.log("Generated filename:", overlayFileName)
    console.log("Timestamp:", timestamp)
    console.log("Random suffix:", randomSuffix)
    console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN)
    
    const blob = await put(overlayFileName, overlayFile, {
      access: "public",
    })

    // Log what Blob returned
    console.log("Blob response:", {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
      downloadUrl: blob.downloadUrl,
      fullResponse: JSON.stringify(blob, null, 2),
    })

    // Check current database value before update
    const currentOverlay = await sql`
      SELECT image_url FROM overlays WHERE id = ${overlayId}
    `
    console.log("Current image_url in database:", currentOverlay.rows[0]?.image_url)
    console.log("New image_url to save:", blob.url)

    // Update overlay in database
    const now = Date.now()
    await sql`
      UPDATE overlays
      SET image_url = ${blob.url},
          updated_at = ${now}
      WHERE id = ${overlayId}
    `

    // Verify the update
    const updatedOverlay = await sql`
      SELECT image_url FROM overlays WHERE id = ${overlayId}
    `
    console.log("Verified image_url in database after update:", updatedOverlay.rows[0]?.image_url)
    console.log("=== END BLOB UPDATE IMAGE DEBUG ===")

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
      message: "Overlay image updated successfully",
      debug: {
        overlayId,
        filename: overlayFileName,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        fileSize: fileSize,
        blobSize: blob.size,
        fileHash: fileHash,
        timestamp: timestamp,
        randomSuffix: randomSuffix,
        previousImageUrl: currentOverlay.rows[0]?.image_url,
        newImageUrl: updatedOverlay.rows[0]?.image_url,
      }
    })
  } catch (error) {
    console.error("Error updating overlay image:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: `Failed to update overlay image: ${errorMessage}` },
      { status: 500 }
    )
  }
}

