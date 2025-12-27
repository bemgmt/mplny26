/**
 * Main photobooth functionality
 */

import { config } from "./config"

export interface Overlay {
  id: string
  name: string
  emoji?: string
  imageUrl?: string // For image-based overlays
  type: "emoji" | "image" // Type of overlay
}

/**
 * Get all available overlays (from config + database)
 */
export function getOverlays(): Overlay[] {
  // Convert config overlays to new format
  const configOverlays: Overlay[] = config.overlays.map(overlay => ({
    id: overlay.id,
    name: overlay.name,
    emoji: overlay.emoji,
    type: "emoji" as const,
  }))
  
  return configOverlays
}

/**
 * Get overlay by ID
 */
export function getOverlayById(id: string): Overlay | undefined {
  return getOverlays().find((o) => o.id === id)
}

/**
 * Draw overlay on canvas (for emoji-based overlays)
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlayId: string = "lantern"
): void {
  ctx.save()

  // Add decorative frame
  ctx.strokeStyle = "rgba(220, 38, 38, 0.8)"
  ctx.lineWidth = 20
  ctx.strokeRect(10, 10, width - 20, height - 20)

  // Add text overlay
  ctx.fillStyle = "rgba(220, 38, 38, 0.9)"
  ctx.font = "bold 48px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(config.branding.primaryText, width / 2, 80)

  ctx.font = "32px sans-serif"
  ctx.fillText(config.branding.secondaryText, width / 2, height - 40)

  // Add decorative elements based on overlay type
  if (overlayId !== "none") {
    const overlay = getOverlayById(overlayId)
    if (overlay && overlay.type === "emoji" && overlay.emoji) {
      ctx.font = "64px sans-serif"
      ctx.fillText(overlay.emoji, 100, 100)
      ctx.fillText(overlay.emoji, width - 100, 100)
      ctx.fillText(overlay.emoji, 100, height - 80)
      ctx.fillText(overlay.emoji, width - 100, height - 80)
    }
  }

  ctx.restore()
}

/**
 * Apply overlay to captured image
 */
export async function applyOverlayToCanvas(
  canvas: HTMLCanvasElement,
  overlayId: string
): Promise<void> {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const overlay = getOverlayById(overlayId)
  
  if (!overlay) {
    // If overlay not found, use default emoji overlay
    drawOverlay(ctx, canvas.width, canvas.height, overlayId)
    return
  }

  if (overlay.type === "image" && overlay.imageUrl) {
    // Image-based overlay - draw the image over the photo
    return new Promise((resolve, reject) => {
      const overlayImg = new Image()
      overlayImg.crossOrigin = "anonymous"
      
      overlayImg.onload = () => {
        // Draw the overlay image over the photo, covering the entire canvas
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
        resolve()
      }
      
      overlayImg.onerror = () => {
        console.error("Failed to load overlay image:", overlay.imageUrl)
        // Fallback to emoji overlay
        drawOverlay(ctx, canvas.width, canvas.height, overlayId)
        resolve()
      }
      
      overlayImg.src = overlay.imageUrl
    })
  } else {
    // Emoji-based overlay
    drawOverlay(ctx, canvas.width, canvas.height, overlayId)
  }
}
