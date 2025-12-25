import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * POST /api/admin/templates/upload
 * Upload template image files (.png, .jpg, .jpeg)
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

    // Ensure templates directory exists
    const publicDir = join(process.cwd(), "public")
    const templatesDir = join(publicDir, "templates")
    
    try {
      // Check if public directory exists
      if (!existsSync(publicDir)) {
        console.error("Public directory does not exist:", publicDir)
        return NextResponse.json(
          { success: false, error: "Public directory not found. Please ensure the public folder exists." },
          { status: 500 }
        )
      }
      
      // Create templates directory if it doesn't exist
      if (!existsSync(templatesDir)) {
        await mkdir(templatesDir, { recursive: true })
        console.log("Created templates directory:", templatesDir)
      }
    } catch (dirError) {
      console.error("Error creating templates directory:", dirError)
      const errorMsg = dirError instanceof Error ? dirError.message : "Unknown error"
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create templates directory: ${errorMsg}. This may be a permissions issue or the file system may be read-only.` 
        },
        { status: 500 }
      )
    }

    const timestamp = Date.now()
    const uploadedFiles: { template?: string; thumbnail?: string } = {}

    // Upload template file
    if (templateFile) {
      try {
        const templateExtension = templateFile.name.split(".").pop()?.toLowerCase() || "png"
        const templateFileName = `template-${timestamp}.${templateExtension}`
        const templatePath = join(templatesDir, templateFileName)

        const bytes = await templateFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(templatePath, buffer)

        uploadedFiles.template = `/templates/${templateFileName}`
      } catch (fileError) {
        console.error("Error uploading template file:", fileError)
        return NextResponse.json(
          { success: false, error: `Failed to upload template file: ${fileError instanceof Error ? fileError.message : "Unknown error"}` },
          { status: 500 }
        )
      }
    }

    // Upload thumbnail file
    if (thumbnailFile) {
      try {
        const thumbnailExtension = thumbnailFile.name.split(".").pop()?.toLowerCase() || "png"
        const thumbnailFileName = `template-${timestamp}-thumb.${thumbnailExtension}`
        const thumbnailPath = join(templatesDir, thumbnailFileName)

        const bytes = await thumbnailFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(thumbnailPath, buffer)

        uploadedFiles.thumbnail = `/templates/${thumbnailFileName}`
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

