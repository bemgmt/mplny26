import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/settings
 * Get admin settings
 */
export async function GET() {
  try {
    // In a real implementation, this would fetch from database
    const settings = {
      photobooth: {
        enabled: true,
        autoCapture: false,
        countdown: 3,
        maxPhotos: 50,
      },
      branding: {
        title: "Lunar New Year Gala 2026",
        organization: "Monterey Park Chamber of Commerce",
        footerText: "Year of the Fire Horse • 新年快樂 • Gong Xi Fa Cai",
      },
      storage: {
        maxStorageMB: 500,
        autoCleanup: true,
        cleanupAfterDays: 7,
      },
      features: {
        overlays: true,
        templates: true,
        backgrounds: true,
        sharing: true,
      },
    }
    
    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings
 * Update admin settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In a real implementation, this would save to database
    const updatedSettings = {
      ...body,
      updatedAt: new Date().toISOString(),
    }
    
    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

