/**
 * Main photobooth functionality
 */

import { config } from "./config"
import { getOverlays as getAllOverlays, getOverlayById as getOverlayByIdFromOverlays, Overlay } from "./overlays"

// Re-export Overlay type for convenience
export type { Overlay }

/**
 * Get overlay by ID (from overlays module which includes database overlays)
 */
export function getOverlayById(id: string): Overlay | undefined {
  return getOverlayByIdFromOverlays(id)
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
  overlayId: string,
  overlay?: Overlay
): Promise<void> {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Use provided overlay or try to find it
  const overlayToUse = overlay || getOverlayById(overlayId)
  
  if (!overlayToUse) {
    // If overlay not found, use default emoji overlay
    drawOverlay(ctx, canvas.width, canvas.height, overlayId)
    return
  }

  if (overlayToUse.type === "image" && overlayToUse.imageUrl) {
    // Image-based overlay - composite the image over the photo
    // The photo is already drawn on the canvas, so we just draw the overlay on top
    return new Promise((resolve, reject) => {
      const overlayImg = new Image()
      overlayImg.crossOrigin = "anonymous"
      
      overlayImg.onload = () => {
        // Save the current canvas state (which has the photo)
        ctx.save()
        
        // Use source-over compositing to ensure photo shows through transparent areas
        ctx.globalCompositeOperation = "source-over"
        
        // Draw the overlay image over the photo (photo shows through transparent areas)
        // This preserves the photo underneath and composites the overlay on top
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
        
        // Restore canvas state
        ctx.restore()
        resolve()
      }
      
      overlayImg.onerror = () => {
        console.error("Failed to load overlay image:", overlayToUse.imageUrl)
        // Fallback to emoji overlay
        drawOverlay(ctx, canvas.width, canvas.height, overlayId)
        resolve()
      }
      
      overlayImg.src = overlayToUse.imageUrl
    })
  } else {
    // Emoji-based overlay
    drawOverlay(ctx, canvas.width, canvas.height, overlayId)
  }
}
