"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Settings,
  LogOut,
  Image,
  Palette,
  ArrowLeft,
  Camera,
  Download,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  Database,
  Power,
  RefreshCw,
  Upload,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import AdminLogin from "@/components/admin-login"
import { isAuthenticated, logout } from "@/lib/js/auth"
import { getOverlays, refreshOverlays, Overlay } from "@/lib/js/overlays"
import { getBackgrounds } from "@/lib/js/backgrounds"
import { getAllPhotos, deletePhotosByIds, getStorageStats, exportPhotosAsJSON } from "@/lib/js/admin-storage"
import { config } from "@/lib/js/config"

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [photos, setPhotos] = useState<any[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [overlayRefreshKey, setOverlayRefreshKey] = useState(0)
  const [isAddingOverlay, setIsAddingOverlay] = useState(false)
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newOverlay, setNewOverlay] = useState({
    name: "",
    emoji: "",
    imageUrl: "",
    type: "image" as "emoji" | "image",
  })
  const [overlayFile, setOverlayFile] = useState<File | null>(null)
  const [overlayPreview, setOverlayPreview] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthenticated(isAuthenticated())
      setChecking(false)
      if (isAuthenticated()) {
        loadPhotos()
        loadStats()
        loadSettings()
        loadOverlays()
      }
    }
  }, [authenticated])

  const loadOverlays = async () => {
    try {
      // Refresh overlays from server
      await refreshOverlays()
      // Force re-render by updating state
      setOverlayRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error("Error loading overlays:", error)
    }
  }

  const loadPhotos = () => {
    const allPhotos = getAllPhotos()
    setPhotos(allPhotos)
  }

  const loadStats = () => {
    const storageStats = getStorageStats()
    setStats(storageStats)
  }

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleLogout = () => {
    logout()
    setAuthenticated(false)
  }

  const handleDeletePhotos = () => {
    if (selectedPhotos.length === 0) return
    
    if (confirm(`Delete ${selectedPhotos.length} photo(s)?`)) {
      deletePhotosByIds(selectedPhotos)
      setSelectedPhotos([])
      loadPhotos()
      loadStats()
    }
  }

  const handleExportPhotos = () => {
    const photosToExport = selectedPhotos.length > 0
      ? photos.filter((p) => selectedPhotos.includes(p.id))
      : photos
    
    const json = exportPhotosAsJSON(photosToExport)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `photobooth-export-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (file: File | null) => {
    setOverlayFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setOverlayPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setOverlayPreview(null)
    }
  }

  const startEditingOverlay = (overlay: Overlay) => {
    setEditingOverlay(overlay)
    setNewOverlay({
      name: overlay.name,
      emoji: overlay.emoji || "",
      imageUrl: overlay.imageUrl || "",
      type: overlay.type,
    })
    setIsAddingOverlay(true)
  }

  const cancelEdit = () => {
    setEditingOverlay(null)
    setIsAddingOverlay(false)
    setNewOverlay({
      name: "",
      emoji: "",
      imageUrl: "",
      type: "image",
    })
    setOverlayFile(null)
    setOverlayPreview(null)
  }

  const handleSaveOverlay = async () => {
    if (!newOverlay.name) {
      alert("Name is required")
      return
    }

    if (newOverlay.type === "emoji" && !newOverlay.emoji) {
      alert("Emoji is required for emoji-type overlays")
      return
    }

    // For new overlays, require image. For editing, allow keeping existing image
    if (newOverlay.type === "image" && !editingOverlay && !overlayFile && !newOverlay.imageUrl) {
      alert("Please provide either an overlay image file or URL")
      return
    }

    setIsUploading(true)
    try {
      let imageUrl: string | null = null

      console.log("=== SAVE OVERLAY DEBUG ===")
      console.log("Overlay type:", newOverlay.type)
      console.log("Has overlayFile:", !!overlayFile)
      console.log("overlayFile details:", overlayFile ? {
        name: overlayFile.name,
        size: overlayFile.size,
        type: overlayFile.type,
      } : null)
      console.log("Is editing:", !!editingOverlay)
      console.log("Editing overlay imageUrl:", editingOverlay?.imageUrl)
      console.log("newOverlay.imageUrl:", newOverlay.imageUrl)

      // Upload file to Vercel Blob if provided (this takes priority)
      if (overlayFile && newOverlay.type === "image") {
        console.log("Uploading file to Blob...")
        const uploadFormData = new FormData()
        uploadFormData.append("overlay", overlayFile)

        try {
          const uploadResponse = await fetch("/api/admin/overlays/upload", {
            method: "POST",
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error("Upload HTTP error:", uploadResponse.status, errorText)
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`)
          }

          const uploadData = await uploadResponse.json()
          console.log("Upload response:", uploadData)
          
          if (uploadData.success && uploadData.file) {
            imageUrl = uploadData.file
            console.log("✅ New image uploaded successfully:", imageUrl)
          } else {
            console.error("❌ Upload failed - response:", uploadData)
            throw new Error(uploadData.error || "Failed to upload file - no URL returned")
          }
        } catch (uploadError) {
          console.error("❌ Upload exception:", uploadError)
          throw new Error(`Failed to upload file: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`)
        }
      } else if (newOverlay.type === "image") {
        // If editing and no new file uploaded, keep existing imageUrl
        imageUrl = editingOverlay?.imageUrl || newOverlay.imageUrl || null
        console.log("Using existing imageUrl:", imageUrl)
        if (!imageUrl) {
          console.warn("WARNING: Image overlay has no imageUrl!")
        }
      }
      
      console.log("Final imageUrl before save:", imageUrl)
      console.log("=== END SAVE OVERLAY DEBUG ===")

      // Save overlay to server (globally accessible)
      const overlayData = {
        id: editingOverlay?.id, // Include ID if editing
        name: newOverlay.name,
        emoji: newOverlay.type === "emoji" ? newOverlay.emoji : null,
        imageUrl: newOverlay.type === "image" ? imageUrl : null,
        type: newOverlay.type,
      }
      
      console.log("Saving overlay to database:", {
        id: overlayData.id,
        name: overlayData.name,
        imageUrl: overlayData.imageUrl,
        type: overlayData.type,
      })

      const response = await fetch("/api/admin/overlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overlayData),
      })

      const data = await response.json()
      if (data.success && data.overlay) {
        // Refresh overlays from server
        await refreshOverlays()
        
        alert(editingOverlay ? "Overlay updated successfully!" : "Overlay added successfully! It will be available to all users.")
        cancelEdit()
        // Refresh the page to show new overlay
        window.location.reload()
      } else {
        throw new Error(data.error || "Failed to save overlay")
      }
    } catch (error) {
      console.error("Error saving overlay:", error)
      alert(error instanceof Error ? error.message : "Failed to save overlay")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteOverlay = async (overlayId: string) => {
    if (!confirm("Are you sure you want to delete this overlay?")) return

    try {
      const response = await fetch(`/api/admin/overlays?id=${overlayId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        await refreshOverlays()
        alert("Overlay deleted successfully!")
        window.location.reload()
      } else {
        throw new Error(data.error || "Failed to delete overlay")
      }
    } catch (error) {
      console.error("Error deleting overlay:", error)
      alert(error instanceof Error ? error.message : "Failed to delete overlay")
    }
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      
      const data = await response.json()
      if (data.success) {
        alert("Settings saved successfully!")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} onBack={() => router.push("/")} />
  }

  const overlays = getOverlays()
  const backgrounds = getBackgrounds()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">{config.branding.secondaryText}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Photos</p>
                  <p className="text-2xl font-bold">{stats.totalPhotos}</p>
                </div>
                <Camera className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">{stats.totalSizeMB} MB</p>
                </div>
                <Database className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overlays</p>
                  <p className="text-2xl font-bold">{overlays.length}</p>
                </div>
                <Sparkles className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Backgrounds</p>
                  <p className="text-2xl font-bold">{backgrounds.length}</p>
                </div>
                <Palette className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="photos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="photos">
              <Camera className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="overlays">
              <Sparkles className="mr-2 h-4 w-4" />
              Overlays
            </TabsTrigger>
            <TabsTrigger value="backgrounds">
              <Palette className="mr-2 h-4 w-4" />
              Backgrounds
            </TabsTrigger>
            <TabsTrigger value="control">
              <Power className="mr-2 h-4 w-4" />
              Control Center
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Event Photos</h2>
                  <p className="text-muted-foreground">Manage and export photos from all sessions</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportPhotos}
                    disabled={photos.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export {selectedPhotos.length > 0 ? `${selectedPhotos.length} ` : ""}Photos
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeletePhotos}
                    disabled={selectedPhotos.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                  <Button variant="outline" onClick={loadPhotos}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No photos found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <Card
                      key={photo.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        selectedPhotos.includes(photo.id) ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setSelectedPhotos((prev) =>
                          prev.includes(photo.id)
                            ? prev.filter((id) => id !== photo.id)
                            : [...prev, photo.id]
                        )
                      }}
                    >
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={photo.dataUrl}
                          alt={`Photo ${photo.id}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedPhotos.includes(photo.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Overlays Tab */}
          <TabsContent value="overlays" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Photo Overlays</h2>
                  <p className="text-muted-foreground">Manage overlays (emoji or image-based) that can be applied to photos</p>
                </div>
                <Dialog open={isAddingOverlay} onOpenChange={(open) => {
                  if (!open) cancelEdit()
                  setIsAddingOverlay(open)
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Overlay
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingOverlay ? "Edit Overlay" : "Add New Overlay"}</DialogTitle>
                      <DialogDescription>
                        Create emoji-based overlays or upload image overlays (.png or .jpg). Overlays will be available for use in the photobooth.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Overlay Type</Label>
                        <Select
                          value={newOverlay.type}
                          onValueChange={(value: "emoji" | "image") => setNewOverlay({ ...newOverlay, type: value, imageUrl: "", emoji: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emoji">Emoji Overlay</SelectItem>
                            <SelectItem value="image">Image Overlay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Overlay Name</Label>
                        <Input
                          value={newOverlay.name}
                          onChange={(e) => setNewOverlay({ ...newOverlay, name: e.target.value })}
                          placeholder="Lanterns"
                        />
                      </div>
                      {newOverlay.type === "emoji" && (
                        <div>
                          <Label>Emoji</Label>
                          <Input
                            value={newOverlay.emoji}
                            onChange={(e) => setNewOverlay({ ...newOverlay, emoji: e.target.value })}
                            placeholder="🏮"
                            maxLength={2}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter a single emoji character
                          </p>
                        </div>
                      )}
                      {newOverlay.type === "image" && (
                        <>
                          <div>
                            <Label>Overlay Image</Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    handleFileChange(file)
                                  }}
                                  className="cursor-pointer"
                                />
                              </div>
                              {overlayPreview && (
                                <div className="relative w-full h-32 border rounded-md overflow-hidden">
                                  <img
                                    src={overlayPreview}
                                    alt="Overlay preview"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Upload a .png or .jpg file, or use URL below
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label>Overlay Image URL (Alternative)</Label>
                            <Input
                              value={newOverlay.imageUrl}
                              onChange={(e) => setNewOverlay({ ...newOverlay, imageUrl: e.target.value })}
                              placeholder="/overlays/overlay.png"
                              disabled={!!overlayFile}
                            />
                            {overlayFile && (
                              <p className="text-xs text-muted-foreground mt-1">
                                File upload takes priority over URL
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveOverlay} 
                          className="flex-1"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              {editingOverlay ? "Update Overlay" : "Upload & Save Overlay"}
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={cancelEdit}
                          disabled={isUploading}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overlays.map((overlay) => {
                  const isConfigOverlay = config.overlays.some(o => o.id === overlay.id)
                  return (
                    <Card key={overlay.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        {overlay.type === "image" && overlay.imageUrl ? (
                          <img
                            src={`${overlay.imageUrl}?t=${overlay.id}`}
                            alt={overlay.name}
                            className="w-full h-full object-contain"
                            key={`${overlay.id}-${overlay.imageUrl}`}
                            onError={(e) => {
                              console.error("Failed to load overlay image:", {
                                overlayId: overlay.id,
                                overlayName: overlay.name,
                                imageUrl: overlay.imageUrl,
                              })
                            }}
                          />
                        ) : overlay.type === "emoji" && overlay.emoji ? (
                          <div className="text-center p-4">
                            <div className="text-6xl mb-2">{overlay.emoji}</div>
                            <p className="text-sm text-muted-foreground">{overlay.name}</p>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <div className="text-4xl mb-2">✨</div>
                            <p className="text-sm text-muted-foreground">Overlay Preview</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{overlay.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {overlay.type}
                          </span>
                          <div className="flex gap-1">
                            {!isConfigOverlay && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => startEditingOverlay(overlay)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDeleteOverlay(overlay.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {isConfigOverlay && (
                              <span className="text-xs text-muted-foreground">Built-in</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Backgrounds Tab */}
          <TabsContent value="backgrounds" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Background Images</h2>
              <p className="text-muted-foreground mb-6">
                Manage background images that can be used in photo compositions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgrounds.map((background) => (
                  <Card key={background.id} className="overflow-hidden">
                    <div
                      className="aspect-video flex items-center justify-center"
                      style={{ backgroundColor: background.color }}
                    >
                      <div className="text-center p-4 text-white">
                        <div className="text-4xl mb-2">🎨</div>
                        <p className="text-sm opacity-90">Background Preview</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{background.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{background.description}</p>
                      <div className="flex items-center justify-between">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-border"
                          style={{ backgroundColor: background.color }}
                        />
                        <span className="text-xs text-muted-foreground">ID: {background.id}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Control Center Tab */}
          <TabsContent value="control" className="space-y-4">
            {settings && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Control Center</h2>
                    <p className="text-muted-foreground">Manage photobooth settings and features</p>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Photobooth Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Photobooth Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Photobooth</Label>
                          <p className="text-sm text-muted-foreground">Turn photobooth on/off</p>
                        </div>
                        <Switch
                          checked={settings.photobooth.enabled}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              photobooth: { ...settings.photobooth, enabled: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Capture</Label>
                          <p className="text-sm text-muted-foreground">Automatically capture photos</p>
                        </div>
                        <Switch
                          checked={settings.photobooth.autoCapture}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              photobooth: { ...settings.photobooth, autoCapture: checked },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Countdown Timer (seconds)</Label>
                        <Input
                          type="number"
                          value={settings.photobooth.countdown}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              photobooth: { ...settings.photobooth, countdown: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max Photos per Session</Label>
                        <Input
                          type="number"
                          value={settings.photobooth.maxPhotos}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              photobooth: { ...settings.photobooth, maxPhotos: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Feature Toggles</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Overlays</Label>
                          <p className="text-sm text-muted-foreground">Enable photo overlays</p>
                        </div>
                        <Switch
                          checked={settings.features.overlays}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, overlays: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Templates</Label>
                          <p className="text-sm text-muted-foreground">Enable photo templates</p>
                        </div>
                        <Switch
                          checked={settings.features.templates}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, templates: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Backgrounds</Label>
                          <p className="text-sm text-muted-foreground">Enable background images</p>
                        </div>
                        <Switch
                          checked={settings.features.backgrounds}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, backgrounds: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sharing</Label>
                          <p className="text-sm text-muted-foreground">Enable photo sharing</p>
                        </div>
                        <Switch
                          checked={settings.features.sharing}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              features: { ...settings.features, sharing: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Storage Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Storage Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Max Storage (MB)</Label>
                        <Input
                          type="number"
                          value={settings.storage.maxStorageMB}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              storage: { ...settings.storage, maxStorageMB: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Cleanup</Label>
                          <p className="text-sm text-muted-foreground">Automatically clean old photos</p>
                        </div>
                        <Switch
                          checked={settings.storage.autoCleanup}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              storage: { ...settings.storage, autoCleanup: checked },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Cleanup After (days)</Label>
                        <Input
                          type="number"
                          value={settings.storage.cleanupAfterDays}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              storage: { ...settings.storage, cleanupAfterDays: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

