"use client"

import { useState, useEffect } from "react"
import { Camera, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import WelcomeScreen from "@/components/welcome-screen"
import PhotoboothCamera from "@/components/photobooth-camera"
import PhotoGallery from "@/components/photo-gallery"
import { getStoredPhotos, savePhoto, deletePhoto, getPhotoCount } from "@/lib/js/storage"
import { getSession, updateSessionPhotoCount } from "@/lib/js/session"

type Screen = "welcome" | "camera" | "gallery"

export default function PhotoboothApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])

  // Load photos from storage on mount
  useEffect(() => {
    const stored = getStoredPhotos()
    setCapturedPhotos(stored.map((p) => p.dataUrl))
    
    // Initialize session
    getSession()
  }, [])

  const handlePhotoCapture = (photoDataUrl: string) => {
    // Save to storage
    savePhoto(photoDataUrl)
    
    // Update state
    setCapturedPhotos((prev) => [photoDataUrl, ...prev])
    
    // Update session
    updateSessionPhotoCount(getPhotoCount())
  }

  const handleDeletePhoto = (index: number) => {
    const stored = getStoredPhotos()
    if (stored[index]) {
      deletePhoto(stored[index].id)
    }
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index))
    updateSessionPhotoCount(getPhotoCount())
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

      {/* Admin Access Link - Hidden in corner */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = "/admin"}
          className="text-xs opacity-50 hover:opacity-100"
        >
          Admin
        </Button>
      </div>
    </div>
  )
}
