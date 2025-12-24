"use client"

import { ArrowLeft, Download, Trash2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PhotoGalleryProps {
  photos: string[]
  onBack: () => void
  onDeletePhoto: (index: number) => void
}

export default function PhotoGallery({ photos, onBack, onDeletePhoto }: PhotoGalleryProps) {
  const downloadPhoto = (photoDataUrl: string, index: number) => {
    const link = document.createElement("a")
    link.download = `lunar-new-year-photo-${index + 1}.png`
    link.href = photoDataUrl
    link.click()
  }

  const sharePhoto = async (photoDataUrl: string) => {
    try {
      const blob = await (await fetch(photoDataUrl)).blob()
      const file = new File([blob], "lunar-new-year.png", { type: "image/png" })

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: "Lunar New Year 2026",
          text: "Check out my Lunar New Year photo!",
        })
      }
    } catch (err) {
      console.error("[v0] Error sharing:", err)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Photo Gallery</h2>
          <div className="w-10" />
        </div>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
              <p className="text-muted-foreground mb-6">Start taking photos to build your gallery</p>
              <Button onClick={onBack}>Take Your First Photo</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <Card key={index} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => downloadPhoto(photo, index)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {navigator.share && (
                      <Button size="icon" variant="secondary" onClick={() => sharePhoto(photo)} title="Share">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="destructive" onClick={() => onDeletePhoto(index)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-muted-foreground">Photo {photos.length - index}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
