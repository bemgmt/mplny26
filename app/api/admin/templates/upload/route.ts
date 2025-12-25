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
    const templatesDir = join(process.cwd(), "public", "templates")
    if (!existsSync(templatesDir)) {
      await mkdir(templatesDir, { recursive: true })
    }

    const timestamp = Date.now()
    const uploadedFiles: { template?: string; thumbnail?: string } = {}

    // Upload template file
    if (templateFile) {
      const templateExtension = templateFile.name.split(".").pop()?.toLowerCase() || "png"
      const templateFileName = `template-${timestamp}.${templateExtension}`
      const templatePath = join(templatesDir, templateFileName)

      const bytes = await templateFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(templatePath, buffer)

      uploadedFiles.template = `/templates/${templateFileName}`
    }

    // Upload thumbnail file
    if (thumbnailFile) {
      const thumbnailExtension = thumbnailFile.name.split(".").pop()?.toLowerCase() || "png"
      const thumbnailFileName = `template-${timestamp}-thumb.${thumbnailExtension}`
      const thumbnailPath = join(templatesDir, thumbnailFileName)

      const bytes = await thumbnailFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(thumbnailPath, buffer)

      uploadedFiles.thumbnail = `/templates/${thumbnailFileName}`
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
    return NextResponse.json(
      { success: false, error: "Failed to upload files" },
      { status: 500 }
    )
  }
}

