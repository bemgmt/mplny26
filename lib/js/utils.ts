/**
 * Utility functions for the photobooth
 */

/**
 * Compress image data URL to JPEG with quality setting
 * This significantly reduces file size for storage
 */
export function compressImageDataUrl(dataUrl: string, quality: number = 0.7, maxWidth: number = 1920, maxHeight: number = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      let width = img.width
      let height = img.height

      // Calculate new dimensions if image is too large
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height
        if (width > height) {
          width = maxWidth
          height = maxWidth / aspectRatio
        } else {
          height = maxHeight
          width = maxHeight * aspectRatio
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedDataUrl)
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = dataUrl
  })
}

/**
 * Convert data URL to blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Download image from data URL
 */
export function downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataURL
  link.click()
}

/**
 * Detect if user is on an Apple device
 */
export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

/**
 * Check if AirDrop is likely available
 */
export function isAirDropSupported(): boolean {
  return isShareSupported() && isAppleDevice()
}

/**
 * Share image using Web Share API (AirDrop on Apple devices)
 */
export async function shareViaAirDrop(dataURL: string, title: string, text: string): Promise<void> {
  try {
    const blob = await (await fetch(dataURL)).blob()
    const file = new File([blob], "wsgvr-happyhour.png", { type: "image/png" })

    if (navigator.share) {
      await navigator.share({
        files: [file],
        title,
        text,
      })
    }
  } catch (err) {
    console.error("Error sharing:", err)
  }
}

/**
 * Share image via email by opening a mail client
 */
export function shareViaEmail(dataURL: string, subject: string, body: string): void {
  const filename = `wsgvr-happyhour-${Date.now()}.png`
  downloadImage(dataURL, filename)
  const message = `${body}\n\nA photo has been downloaded. Please attach ${filename} to this email.`
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  window.location.href = mailto
}

/**
 * Format date for filename
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return `wsgvr-${date.getTime()}`
}

