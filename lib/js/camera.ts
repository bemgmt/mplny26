/**
 * Camera utilities and management
 */

import { config } from "./config"

export interface CameraOptions {
  facingMode?: "user" | "environment"
  width?: number
  height?: number
}

/**
 * Start camera stream
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  options: CameraOptions = {}
): Promise<MediaStream> {
  const { facingMode = config.camera.defaultFacingMode, width = config.camera.idealWidth, height = config.camera.idealHeight } = options

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: width },
        height: { ideal: height },
      },
      audio: false,
    })

    videoElement.srcObject = stream
    return stream
  } catch (error) {
    console.error("Error accessing camera:", error)
    throw new Error("Unable to access camera. Please check permissions.")
  }
}

/**
 * Stop camera stream
 */
export function stopCamera(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

/**
 * Capture photo from video element
 */
export function capturePhotoFromVideo(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
): string {
  const canvas = canvasElement
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Draw video frame
  ctx.drawImage(videoElement, 0, 0)

  return canvas.toDataURL("image/png")
}

/**
 * Check if camera is available
 */
export async function isCameraAvailable(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === "videoinput")
  } catch {
    return false
  }
}

