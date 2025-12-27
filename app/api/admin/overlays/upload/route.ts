import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

/**
 * POST /api/admin/overlays/upload
 * Upload overlay image files (.png, .jpg, .jpeg) to Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const overlayFile = formData.get("overlay") as File | null

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

    const timestamp = Date.now()

    // Upload overlay file to Vercel Blob
    try {
      const overlayExtension = overlayFile.name.split(".").pop()?.toLowerCase() || "png"
      const overlayFileName = `overlays/overlay-${timestamp}.${overlayExtension}`
      
      const blob = await put(overlayFileName, overlayFile, {
        access: "public",
      })

      return NextResponse.json({
        success: true,
        file: blob.url,
        message: "File uploaded successfully",
      })
    } catch (fileError) {
      console.error("Error uploading overlay file:", fileError)
      return NextResponse.json(
        { success: false, error: `Failed to upload overlay file: ${fileError instanceof Error ? fileError.message : "Unknown error"}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error uploading overlay files:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    )
  }
}

