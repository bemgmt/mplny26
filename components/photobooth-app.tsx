"use client"

import { useState } from "react"
import { Camera, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import WelcomeScreen from "@/components/welcome-screen"
import PhotoboothCamera from "@/components/photobooth-camera"
import PhotoGallery from "@/components/photo-gallery"

type Screen = "welcome" | "camera" | "gallery"

export default function PhotoboothApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])

  const handlePhotoCapture = (photoDataUrl: string) => {
    setCapturedPhotos((prev) => [photoDataUrl, ...prev])
  }

  const handleDeletePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="relative min-h-screen">
      {currentScreen === "welcome" && <WelcomeScreen onStart={() => setCurrentScreen("camera")} />}

      {currentScreen === "camera" && (
        <PhotoboothCamera onPhotoCapture={handlePhotoCapture} onBack={() => setCurrentScreen("welcome")} />
      )}

      {currentScreen === "gallery" && (
        <PhotoGallery
          photos={capturedPhotos}
          onBack={() => setCurrentScreen("camera")}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {currentScreen !== "welcome" && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex gap-3 bg-card/95 backdrop-blur-lg border border-border rounded-full px-4 py-3 shadow-xl">
            <Button
              variant={currentScreen === "welcome" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setCurrentScreen("welcome")}
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant={currentScreen === "camera" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setCurrentScreen("camera")}
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              variant={currentScreen === "gallery" ? "default" : "ghost"}
              size="icon"
              className="rounded-full relative"
              onClick={() => setCurrentScreen("gallery")}
            >
              <Sparkles className="h-5 w-5" />
              {capturedPhotos.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {capturedPhotos.length}
                </span>
              )}
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
