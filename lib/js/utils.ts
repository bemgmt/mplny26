/**
 * Utility functions for the photobooth
 */

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
 * Share image using Web Share API
 */
export async function shareImage(dataURL: string, title: string, text: string): Promise<void> {
  try {
    const blob = await (await fetch(dataURL)).blob()
    const file = new File([blob], "lunar-new-year.png", { type: "image/png" })

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
 * Format date for filename
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return `lunar-new-year-${date.getTime()}`
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

