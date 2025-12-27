"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, RotateCcw, Download, Sparkles, ArrowLeft, Maximize2, Minimize2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { startCamera, stopCamera } from "@/lib/js/camera"
import { getOverlays, applyOverlayToCanvas, applyTemplateToCanvas } from "@/lib/js/photobooth"
import { downloadImage, formatDateForFilename } from "@/lib/js/utils"
import { config } from "@/lib/js/config"
import { getTemplates, getTemplatesAsync, refreshTemplates, Template } from "@/lib/js/templates"

interface PhotoboothCameraProps {
  onPhotoCapture: (photoDataUrl: string) => void
  onBack: () => void
}

const overlays = getOverlays()

type PhotoOrientation = "horizontal" | "vertical"

export default function PhotoboothCamera({ onPhotoCapture, onBack }: PhotoboothCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState("lantern")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatePreviewImage, setTemplatePreviewImage] = useState<HTMLImageElement | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<PhotoOrientation>("horizontal")
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load templates on mount and refresh periodically
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        await refreshTemplates()
        const allTemplates = getTemplates()
        setTemplates(allTemplates)
      } catch (error) {
        console.error("Error loading templates:", error)
        // Fallback to config templates
        setTemplates(config.templates)
      }
    }
    
    // Load immediately
    loadTemplates()
    
    // Refresh templates every 30 seconds to pick up new uploads
    const interval = setInterval(() => {
      loadTemplates()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Load template preview image when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          setTemplatePreviewImage(img)
        }
        img.onerror = () => {
          console.error("Failed to load template preview:", template.image)
          setTemplatePreviewImage(null)
        }
        img.src = template.image
      } else {
        setTemplatePreviewImage(null)
      }
    } else {
      setTemplatePreviewImage(null)
    }
  }, [selectedTemplate, templates])

  // Draw template preview on video
  useEffect(() => {
    if (!videoRef.current || !previewCanvasRef.current || !templatePreviewImage) {
      // Clear canvas if no template
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

      // Clear and draw template overlay
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(templatePreviewImage, 0, 0, canvas.width, canvas.height)

      animationFrameId = requestAnimationFrame(updatePreview)
    }

    updatePreview()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [templatePreviewImage])

  useEffect(() => {
    handleStartCamera()
    return () => {
      handleStopCamera()
    }
  }, [facingMode])

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
      applyOverlayToCanvas(canvas, selectedOverlay)
    }

    // Apply template if selected (after overlay)
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        try {
          await applyTemplateToCanvas(canvas, template.image)
        } catch (error) {
          console.error("Error applying template:", error)
        }
      }
    }

    // Get final image
    const imageDataUrl = canvas.toDataURL("image/png")
    setCapturedImage(imageDataUrl)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
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
                {/* Template Preview Overlay */}
                {templatePreviewImage && (
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
                >
                  <span className="mr-2">{overlay.emoji}</span>
                  {overlay.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Template Selector */}
        {!capturedImage && templates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Select Template</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedTemplate === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTemplate(null)}
                className="flex-shrink-0"
              >
                None
              </Button>
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTemplate(template.id)}
                  className="flex-shrink-0"
                  title={template.description}
                >
                  {template.name}
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
