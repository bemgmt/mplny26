"use client"

import { useState } from "react"
import { Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { verifyAdminPin, setAuthenticated } from "@/lib/js/auth"
import { config } from "@/lib/js/config"

interface AdminLoginProps {
  onSuccess: () => void
  onBack?: () => void
}

export default function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (verifyAdminPin(pin)) {
        setAuthenticated(true)
        setPin("")
        onSuccess()
      } else {
        setError("Incorrect PIN. Please try again.")
        setPin("")
      }
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-4 left-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
          <p className="text-muted-foreground">{config.branding.secondaryText}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium mb-2">
              Enter Admin PIN
            </label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError("")
              }}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className="text-center text-2xl tracking-widest"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading || pin.length !== 4}>
            {isLoading ? "Verifying..." : "Login"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          For authorized personnel only
        </p>
      </Card>
    </div>
  )
}

