import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

/**
 * GET /api/admin/overlays/test
 * Test endpoint to verify Vercel Blob Storage is configured correctly
 */
export async function GET() {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    
    if (!hasToken) {
      return NextResponse.json({
        success: false,
        error: "BLOB_READ_WRITE_TOKEN environment variable is not set",
        details: {
          tokenPresent: false,
          message: "Please set BLOB_READ_WRITE_TOKEN in your Vercel project settings"
        }
      }, { status: 500 })
    }

    // Try to upload a small test file
    try {
      const testContent = new Blob(["test"], { type: "text/plain" })
      const testFileName = `test/test-${Date.now()}.txt`
      
      const blob = await put(testFileName, testContent, {
        access: "public",
      })

      return NextResponse.json({
        success: true,
        message: "Vercel Blob Storage is configured correctly",
        details: {
          tokenPresent: true,
          testUploadSuccessful: true,
          testFileUrl: blob.url,
          tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + "..."
        }
      })
    } catch (uploadError) {
      return NextResponse.json({
        success: false,
        error: "Failed to upload test file to Vercel Blob",
        details: {
          tokenPresent: true,
          testUploadSuccessful: false,
          error: uploadError instanceof Error ? uploadError.message : "Unknown error",
          message: "Token is present but upload failed. Check token permissions."
        }
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error testing Vercel Blob Storage",
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 500 })
  }
}

