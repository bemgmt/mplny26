"use client"

import { ArrowLeft, Download, Trash2, Send, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { downloadImage, shareViaAirDrop, shareViaEmail, isAirDropSupported } from "@/lib/js/utils"
import { config } from "@/lib/js/config"

interface PhotoGalleryProps {
  photos: string[]
  onBack: () => void
  onDeletePhoto: (index: number) => void
}

export default function PhotoGallery({ photos, onBack, onDeletePhoto }: PhotoGalleryProps) {
  const handleDownloadPhoto = (photoDataUrl: string, index: number) => {
    downloadImage(photoDataUrl, `wsgvr-happyhour-${index + 1}.png`)
  }

  const handleSharePhoto = async (photoDataUrl: string) => {
    await shareViaAirDrop(
      photoDataUrl,
      config.branding.primaryText,
      "Captured at the WSGVR Affiliate Happy Hour."
    )
  }

  const handleEmailPhoto = (photoDataUrl: string) => {
    shareViaEmail(photoDataUrl, config.branding.primaryText, "Captured at the WSGVR Affiliate Happy Hour.")
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Gallery</h2>
          <div className="w-10" />
        </div>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <Card className="p-12 border-border/60 bg-card/70">
            <div className="text-center">
              <div className="flex items-center justify-center mb-5">
                <div className="rounded-2xl border border-border/60 bg-background/40 px-6 py-4 text-sm uppercase tracking-[0.25em] text-muted-foreground">
                  WSGVR Happy Hour
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No captures yet</h3>
              <p className="text-muted-foreground mb-6">
                Start capturing to build your Happy Hour gallery.
              </p>
              <Button onClick={onBack}>Take Your First Photo</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <Card key={index} className="overflow-hidden border-border/60 bg-card/70">
                <div className="relative aspect-video">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Capture {photos.length - index}</p>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDownloadPhoto(photo, index)}
                        title="Download"
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleSharePhoto(photo)}
                        title={isAirDropSupported() ? "AirDrop" : "AirDrop (Apple devices only)"}
                        className="h-8 w-8"
                        disabled={!isAirDropSupported()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEmailPhoto(photo)}
                        title="Email"
                        className="h-8 w-8"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => onDeletePhoto(index)}
                        title="Delete"
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
