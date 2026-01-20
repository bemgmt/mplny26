import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

/**
 * POST /api/admin/templates/upload
 * Upload template images to Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const templateFile = formData.get("template") as File | null
    const thumbnailFile = formData.get("thumbnail") as File | null

    // Validate that at least one file is provided
    if (!templateFile && !thumbnailFile) {
      return NextResponse.json(
        { success: false, error: "At least one file (template or thumbnail) is required" },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    const allowedExtensions = [".png", ".jpg", ".jpeg"]

    if (templateFile) {
      const fileType = templateFile.type
      const fileName = templateFile.name.toLowerCase()
      const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

      if (!allowedTypes.includes(fileType) && !hasValidExtension) {
        return NextResponse.json(
          { success: false, error: "Template file must be .png or .jpg format" },
          { status: 400 }
        )
      }
    }

    if (thumbnailFile) {
      const fileType = thumbnailFile.type
      const fileName = thumbnailFile.name.toLowerCase()
      const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

      if (!allowedTypes.includes(fileType) && !hasValidExtension) {
        return NextResponse.json(
          { success: false, error: "Thumbnail file must be .png or .jpg format" },
          { status: 400 }
        )
      }
    }

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (templateFile && templateFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Template file is too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }
    if (thumbnailFile && thumbnailFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Thumbnail file is too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const uploadedFiles: { template?: string; thumbnail?: string } = {}

    // Upload template file to Vercel Blob
    if (templateFile) {
      try {
        const templateExtension = templateFile.name.split(".").pop()?.toLowerCase() || "png"
        const templateFileName = `templates/template-${timestamp}.${templateExtension}`
        
        const blob = await put(templateFileName, templateFile, {
          access: "public",
        })

        uploadedFiles.template = blob.url
      } catch (fileError) {
        console.error("Error uploading template file:", fileError)
        return NextResponse.json(
          { success: false, error: `Failed to upload template file: ${fileError instanceof Error ? fileError.message : "Unknown error"}` },
          { status: 500 }
        )
      }
    }

    // Upload thumbnail file to Vercel Blob
    if (thumbnailFile) {
      try {
        const thumbnailExtension = thumbnailFile.name.split(".").pop()?.toLowerCase() || "png"
        const thumbnailFileName = `templates/template-${timestamp}-thumb.${thumbnailExtension}`
        
        const blob = await put(thumbnailFileName, thumbnailFile, {
          access: "public",
        })

        uploadedFiles.thumbnail = blob.url
      } catch (fileError) {
        console.error("Error uploading thumbnail file:", fileError)
        // If template was uploaded successfully, we can still return it
        if (uploadedFiles.template) {
          uploadedFiles.thumbnail = uploadedFiles.template
        } else {
          return NextResponse.json(
            { success: false, error: `Failed to upload thumbnail file: ${fileError instanceof Error ? fileError.message : "Unknown error"}` },
            { status: 500 }
          )
        }
      }
    }

    // If only one file is uploaded, use it for both template and thumbnail
    if (templateFile && !thumbnailFile) {
      uploadedFiles.thumbnail = uploadedFiles.template
    } else if (thumbnailFile && !templateFile) {
      uploadedFiles.template = uploadedFiles.thumbnail
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: "Files uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading template files:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: `Failed to upload files: ${errorMessage}` },
      { status: 500 }
    )
  }
}
