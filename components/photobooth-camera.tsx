"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, RotateCcw, Download, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PhotoboothCameraProps {
  onPhotoCapture: (photoDataUrl: string) => void
  onBack: () => void
}

const overlays = [
  { id: "none", name: "No Overlay", emoji: "✨" },
  { id: "lantern", name: "Lanterns", emoji: "🏮" },
  { id: "dragon", name: "Dragon", emoji: "🐉" },
  { id: "envelope", name: "Red Envelope", emoji: "🧧" },
  { id: "fireworks", name: "Fireworks", emoji: "🎆" },
]

export default function PhotoboothCamera({ onPhotoCapture, onBack }: PhotoboothCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState("lantern")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      setCameraError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("[v0] Error accessing camera:", err)
      setCameraError("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw video frame
    ctx.drawImage(video, 0, 0)

    // Draw overlay if selected
    if (selectedOverlay !== "none") {
      drawOverlay(ctx, canvas.width, canvas.height)
    }

    const imageDataUrl = canvas.toDataURL("image/png")
    setCapturedImage(imageDataUrl)
  }

  const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save()

    // Add decorative frame
    ctx.strokeStyle = "rgba(220, 38, 38, 0.8)"
    ctx.lineWidth = 20
    ctx.strokeRect(10, 10, width - 20, height - 20)

    // Add text overlay
    ctx.fillStyle = "rgba(220, 38, 38, 0.9)"
    ctx.font = "bold 48px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Lunar New Year 2026", width / 2, 80)

    ctx.font = "32px sans-serif"
    ctx.fillText("Monterey Park Chamber of Commerce", width / 2, height - 40)

    // Add decorative elements based on overlay type
    ctx.font = "64px sans-serif"
    const overlay = overlays.find((o) => o.id === selectedOverlay)
    if (overlay) {
      ctx.fillText(overlay.emoji, 100, 100)
      ctx.fillText(overlay.emoji, width - 100, 100)
      ctx.fillText(overlay.emoji, 100, height - 80)
      ctx.fillText(overlay.emoji, width - 100, height - 80)
    }

    ctx.restore()
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
    const link = document.createElement("a")
    link.download = `lunar-new-year-${Date.now()}.png`
    link.href = capturedImage
    link.click()
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
          <div className="relative aspect-video bg-muted">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{cameraError}</p>
                  <Button onClick={startCamera} className="mt-4">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : capturedImage ? (
              <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </Card>

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
            <>
              <Button variant="outline" size="lg" onClick={switchCamera}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Flip Camera
              </Button>
              <Button size="lg" onClick={capturePhoto} className="px-8">
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
