/**
 * Main photobooth functionality
 */

import { config } from "./config"

export interface Overlay {
  id: string
  name: string
  emoji: string
}

/**
 * Get all available overlays
 */
export function getOverlays(): Overlay[] {
  return config.overlays
}

/**
 * Get overlay by ID
 */
export function getOverlayById(id: string): Overlay | undefined {
  return config.overlays.find((o) => o.id === id)
}

/**
 * Draw overlay on canvas
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
    if (overlay) {
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
export function applyOverlayToCanvas(
  canvas: HTMLCanvasElement,
  overlayId: string
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  drawOverlay(ctx, canvas.width, canvas.height, overlayId)
}

