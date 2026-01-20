"use client"

import { Camera, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/js/config"

interface WelcomeScreenProps {
  onStart: () => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/LNY-bkg.jpg')",
        }}
      />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Logo/Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
            <Camera className="h-12 w-12 text-primary" />
          </div>
          <h1 
            className="text-5xl md:text-6xl font-bold text-balance mb-4 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent"
            style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {config.branding.primaryText}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-foreground/90 mb-2">Photobooth Experience</p>
          <p className="text-sm md:text-base text-muted-foreground">{config.branding.secondaryText}</p>
        </div>

        {/* Description */}
        <div className="mb-10 space-y-4">
          <p className="text-lg text-foreground/80 text-balance leading-relaxed">
            Capture the magic of Lunar New Year with festive photo overlays and filters. Create memorable moments to
            share with family and friends.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Festive Overlays</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Instant Capture</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>Easy Sharing</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onStart}
          className="text-lg px-12 py-6 h-auto rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Camera className="mr-2 h-5 w-5" />
          Start Photobooth
        </Button>

        {/* Footer */}
        <p className="mt-12 text-xs text-muted-foreground">{config.branding.footerText}</p>
      </div>
    </div>
  )
}
