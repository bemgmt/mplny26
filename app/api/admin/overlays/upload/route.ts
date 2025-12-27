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
      // Check if BLOB_READ_WRITE_TOKEN is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("BLOB_READ_WRITE_TOKEN is not set")
        return NextResponse.json(
          { 
            success: false, 
            error: "Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel project settings.",
            details: "Go to Vercel Dashboard → Your Project → Storage → Blob → Settings to get your token"
          },
          { status: 500 }
        )
      }

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
      const errorMessage = fileError instanceof Error ? fileError.message : "Unknown error"
      
      // Provide more helpful error messages
      let helpfulMessage = errorMessage
      if (errorMessage.includes("token") || errorMessage.includes("unauthorized") || errorMessage.includes("403")) {
        helpfulMessage = "Blob storage token is invalid or expired. Please check your BLOB_READ_WRITE_TOKEN in Vercel settings."
      } else if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        helpfulMessage = "Network error connecting to Vercel Blob. Please try again."
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to upload overlay file: ${helpfulMessage}`,
          originalError: errorMessage
        },
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

