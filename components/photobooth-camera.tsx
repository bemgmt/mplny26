"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, RotateCcw, Download, Sparkles, ArrowLeft, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { startCamera, stopCamera } from "@/lib/js/camera"
import { applyOverlayToCanvas } from "@/lib/js/photobooth"
import { downloadImage, formatDateForFilename } from "@/lib/js/utils"
import { getOverlays, getOverlaysAsync, refreshOverlays, Overlay } from "@/lib/js/overlays"
import { config } from "@/lib/js/config"

interface PhotoboothCameraProps {
  onPhotoCapture: (photoDataUrl: string) => void
  onBack: () => void
}

type PhotoOrientation = "horizontal" | "vertical"

export default function PhotoboothCamera({ onPhotoCapture, onBack }: PhotoboothCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState("none")
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [overlayPreviewImage, setOverlayPreviewImage] = useState<HTMLImageElement | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<PhotoOrientation>("horizontal")
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load overlays on mount and refresh periodically
  useEffect(() => {
    const loadOverlays = async () => {
      try {
        await refreshOverlays()
        const allOverlays = getOverlays()
        setOverlays(allOverlays)
      } catch (error) {
        console.error("Error loading overlays:", error)
        // Fallback to config overlays
        const configOverlays = getOverlays()
        setOverlays(configOverlays)
      }
    }
    
    // Load immediately
    loadOverlays()
    
    // Refresh overlays every 30 seconds to pick up new uploads
    const interval = setInterval(() => {
      loadOverlays()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Load overlay preview image when selected overlay changes
  useEffect(() => {
    const overlay = overlays.find(o => o.id === selectedOverlay)
    if (overlay && overlay.type === "image" && overlay.imageUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setOverlayPreviewImage(img)
      }
      img.onerror = () => {
        console.error("Failed to load overlay preview:", overlay.imageUrl)
        setOverlayPreviewImage(null)
      }
      img.src = overlay.imageUrl
    } else {
      setOverlayPreviewImage(null)
    }
  }, [selectedOverlay, overlays])

  // Draw overlay preview on video (for image-based overlays)
  useEffect(() => {
    if (!videoRef.current || !previewCanvasRef.current || !overlayPreviewImage) {
      // Clear canvas if no overlay preview
      if (previewCanvasRef.current) {
        const ctx = previewCanvasRef.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height)
        }
      }
      return
    }

    const video = videoRef.current
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const updatePreview = () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationFrameId = requestAnimationFrame(updatePreview)
        return
      }

      // Match canvas size to video display size
      const rect = video.getBoundingClientRect()
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width
        canvas.height = rect.height
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw video frame first (scaled to fit canvas)
      const videoAspect = video.videoWidth / video.videoHeight
      const canvasAspect = canvas.width / canvas.height
      
      let drawWidth = canvas.width
      let drawHeight = canvas.height
      let drawX = 0
      let drawY = 0
      
      if (videoAspect > canvasAspect) {
        // Video is wider, fit to height
        drawHeight = canvas.height
        drawWidth = canvas.height * videoAspect
        drawX = (canvas.width - drawWidth) / 2
      } else {
        // Video is taller, fit to width
        drawWidth = canvas.width
        drawHeight = canvas.width / videoAspect
        drawY = (canvas.height - drawHeight) / 2
      }
      
      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)
      
      // Then draw overlay on top (compositing)
      ctx.drawImage(overlayPreviewImage, 0, 0, canvas.width, canvas.height)

      animationFrameId = requestAnimationFrame(updatePreview)
    }

    updatePreview()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [overlayPreviewImage])

  useEffect(() => {
    if (!capturedImage) {
      handleStartCamera()
    }
    return () => {
      if (stream) {
        handleStopCamera()
        setStream(null)
      }
    }
  }, [facingMode, capturedImage])

  const handleStartCamera = async () => {
    try {
      setCameraError(null)
      if (!videoRef.current) return
      
      const mediaStream = await startCamera(videoRef.current, {
        facingMode,
        width: config.camera.idealWidth,
        height: config.camera.idealHeight,
      })
      setStream(mediaStream)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError(err instanceof Error ? err.message : "Unable to access camera. Please check permissions.")
    }
  }

  const handleStopCamera = () => {
    stopCamera(stream)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Set canvas dimensions based on orientation
    if (orientation === "vertical") {
      // Portrait: height > width
      canvas.width = Math.min(video.videoWidth, video.videoHeight)
      canvas.height = Math.max(video.videoWidth, video.videoHeight)
    } else {
      // Landscape: width > height
      canvas.width = Math.max(video.videoWidth, video.videoHeight)
      canvas.height = Math.min(video.videoWidth, video.videoHeight)
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw video frame, centered and scaled
    const sourceAspect = video.videoWidth / video.videoHeight
    const canvasAspect = canvas.width / canvas.height
    
    let sx = 0
    let sy = 0
    let sw = video.videoWidth
    let sh = video.videoHeight
    
    if (sourceAspect > canvasAspect) {
      // Source is wider, crop sides
      sw = video.videoHeight * canvasAspect
      sx = (video.videoWidth - sw) / 2
    } else {
      // Source is taller, crop top/bottom
      sh = video.videoWidth / canvasAspect
      sy = (video.videoHeight - sh) / 2
    }
    
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    // Apply overlay if selected
    if (selectedOverlay !== "none") {
      await applyOverlayToCanvas(canvas, selectedOverlay)
    }

    // Get final image
    const imageDataUrl = canvas.toDataURL("image/png")
    setCapturedImage(imageDataUrl)
    
    // Stop camera after capturing
    if (stream) {
      handleStopCamera()
      setStream(null)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    // Camera will restart automatically via useEffect when capturedImage becomes null
  }

  const savePhoto = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage)
      setCapturedImage(null)
    }
  }

  const downloadPhoto = () => {
    if (!capturedImage) return
    downloadImage(capturedImage, `${formatDateForFilename()}.png`)
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Photobooth</h2>
          <div className="w-10" />
        </div>

        {/* Camera/Preview Card */}
        <Card className="overflow-hidden mb-6">
          <div className={`relative bg-muted ${orientation === "vertical" ? "aspect-[9/16]" : "aspect-video"}`}>
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{cameraError}</p>
                  <Button onClick={handleStartCamera} className="mt-4">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : capturedImage ? (
              <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Overlay Preview (for image-based overlays) */}
                {overlayPreviewImage && (
                  <canvas
                    ref={previewCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ mixBlendMode: "normal" }}
                  />
                )}
                {/* Camera Circle Button Overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-primary shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center justify-center"
                    aria-label="Take Photo"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary"></div>
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </Card>

        {/* Orientation Toggle */}
        {!capturedImage && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Photo Orientation</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={orientation === "horizontal" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrientation("horizontal")}
                className="flex-1"
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Horizontal
              </Button>
              <Button
                variant={orientation === "vertical" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrientation("vertical")}
                className="flex-1"
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                Vertical
              </Button>
            </div>
          </div>
        )}

        {/* Overlay Selector */}
        {!capturedImage && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Select Overlay</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {overlays.map((overlay) => (
                <Button
                  key={overlay.id}
                  variant={selectedOverlay === overlay.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedOverlay(overlay.id)}
                  className="flex-shrink-0"
                  title={overlay.type === "image" ? overlay.name : undefined}
                >
                  {overlay.type === "emoji" && overlay.emoji && (
                    <span className="mr-2">{overlay.emoji}</span>
                  )}
                  {overlay.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {capturedImage ? (
            <>
              <Button variant="outline" size="lg" onClick={retakePhoto}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Retake
              </Button>
              <Button variant="outline" size="lg" onClick={downloadPhoto}>
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              <Button size="lg" onClick={savePhoto}>
                <Sparkles className="mr-2 h-5 w-5" />
                Save to Gallery
              </Button>
            </>
          ) : (
            <Button variant="outline" size="lg" onClick={switchCamera}>
              <RotateCcw className="mr-2 h-5 w-5" />
              Flip Camera
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
