"use client"

import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/js/config"

interface WelcomeScreenProps {
  onStart: () => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at top, rgba(92, 107, 255, 0.22), transparent 55%), radial-gradient(circle at 20% 80%, rgba(65, 196, 255, 0.14), transparent 45%), linear-gradient(160deg, rgba(8, 12, 26, 0.92), rgba(16, 20, 45, 0.95))",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(120, 140, 255, 0.12) 1px, transparent 1px), linear-gradient(rgba(120, 140, 255, 0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <video
          className="absolute right-8 bottom-8 w-40 h-40 opacity-20 pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/donna/DONNA-LogoAnimated.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center rounded-2xl border border-border/60 bg-card/70 px-6 py-5 shadow-[0_0_40px_rgba(80,100,255,0.15)]">
            <img src="/donna/DONNA-logo.png" alt="DONNA" className="h-10 md:h-12 object-contain" />
          </div>
          <h1 className="mt-8 text-5xl md:text-6xl font-semibold tracking-tight text-balance">
            {config.branding.primaryText}
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">{config.branding.secondaryText}</p>
        </div>

        <div className="mb-10 space-y-5">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Calm, structured captures with intelligent frames designed to keep the focus on you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Instant capture</span>
            </div>
            <div className="h-4 w-px bg-border/60" />
            <span>Adaptive frames</span>
            <div className="h-4 w-px bg-border/60" />
            <span>Clean sharing</span>
          </div>
        </div>

        <Button
          size="lg"
          onClick={onStart}
          className="text-base md:text-lg px-12 py-6 h-auto rounded-full shadow-[0_12px_40px_rgba(90,110,255,0.25)] hover:shadow-[0_16px_48px_rgba(90,110,255,0.35)] transition-all"
        >
          <Camera className="mr-2 h-5 w-5" />
          Start Photobooth
        </Button>

        <p className="mt-12 text-xs text-muted-foreground">{config.branding.footerText}</p>
      </div>
    </div>
  )
}
