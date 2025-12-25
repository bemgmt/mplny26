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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import AdminLogin from "@/components/admin-login"
import { isAuthenticated, logout } from "@/lib/js/auth"
import { getTemplates, getTemplateCategories } from "@/lib/js/templates"
import { getBackgrounds } from "@/lib/js/backgrounds"
import { getAllPhotos, deletePhotosByIds, getStorageStats, exportPhotosAsJSON, saveTemplate, AdminTemplate } from "@/lib/js/admin-storage"
import { config } from "@/lib/js/config"

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [photos, setPhotos] = useState<any[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "frames",
    imageUrl: "",
    thumbnailUrl: "",
  })
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [templatePreview, setTemplatePreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthenticated(isAuthenticated())
      setChecking(false)
      if (isAuthenticated()) {
        loadPhotos()
        loadStats()
        loadSettings()
      }
    }
  }, [authenticated])

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

  const handleFileChange = (file: File | null, type: "template" | "thumbnail") => {
    if (type === "template") {
      setTemplateFile(file)
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setTemplatePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setTemplatePreview(null)
      }
    } else {
      setThumbnailFile(file)
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setThumbnailPreview(null)
      }
    }
  }

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.category) {
      alert("Name and category are required")
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = newTemplate.imageUrl
      let thumbnailUrl = newTemplate.thumbnailUrl

      // Upload files if provided
      if (templateFile || thumbnailFile) {
        const uploadFormData = new FormData()
        if (templateFile) {
          uploadFormData.append("template", templateFile)
        }
        if (thumbnailFile) {
          uploadFormData.append("thumbnail", thumbnailFile)
        }

        const uploadResponse = await fetch("/api/admin/templates/upload", {
          method: "POST",
          body: uploadFormData,
        })

        const uploadData = await uploadResponse.json()
        if (uploadData.success && uploadData.files) {
          imageUrl = uploadData.files.template || imageUrl
          thumbnailUrl = uploadData.files.thumbnail || thumbnailUrl
        } else {
          throw new Error(uploadData.error || "Failed to upload files")
        }
      }

      // Create template with uploaded file URLs or provided URLs
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          imageUrl,
          thumbnailUrl,
        }),
      })

      const data = await response.json()
      if (data.success && data.template) {
        // Save template to localStorage
        const templateToSave: AdminTemplate = {
          id: data.template.id,
          name: data.template.name,
          description: data.template.description,
          category: data.template.category,
          thumbnail: thumbnailUrl || imageUrl || data.template.thumbnail,
          image: imageUrl || data.template.image,
          createdAt: Date.now(),
        }
        saveTemplate(templateToSave)
        
        alert("Template added successfully!")
        setIsAddingTemplate(false)
        setNewTemplate({
          name: "",
          description: "",
          category: "frames",
          imageUrl: "",
          thumbnailUrl: "",
        })
        setTemplateFile(null)
        setThumbnailFile(null)
        setTemplatePreview(null)
        setThumbnailPreview(null)
        // Refresh the page to show new template
        window.location.reload()
      } else {
        throw new Error(data.error || "Failed to add template")
      }
    } catch (error) {
      console.error("Error adding template:", error)
      alert(error instanceof Error ? error.message : "Failed to add template")
    } finally {
      setIsUploading(false)
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

  const templates = getTemplates()
  const backgrounds = getBackgrounds()
  const categories = getTemplateCategories()

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
                  <p className="text-sm text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <Image className="h-8 w-8 text-primary opacity-50" />
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
            <TabsTrigger value="templates">
              <Image className="mr-2 h-4 w-4" />
              Templates
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Photo Templates</h2>
                  <p className="text-muted-foreground">Manage templates that can be applied to photos</p>
                </div>
                <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                          placeholder="Classic Frame"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newTemplate.description}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, description: e.target.value })
                          }
                          placeholder="Traditional red and gold frame"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newTemplate.category}
                          onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="frames">Frames</SelectItem>
                            <SelectItem value="borders">Borders</SelectItem>
                            <SelectItem value="artistic">Artistic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Template Image</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                handleFileChange(file, "template")
                              }}
                              className="cursor-pointer"
                            />
                          </div>
                          {templatePreview && (
                            <div className="relative w-full h-32 border rounded-md overflow-hidden">
                              <img
                                src={templatePreview}
                                alt="Template preview"
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
                        <Label>Template Image URL (Alternative)</Label>
                        <Input
                          value={newTemplate.imageUrl}
                          onChange={(e) => setNewTemplate({ ...newTemplate, imageUrl: e.target.value })}
                          placeholder="/templates/template.png"
                          disabled={!!templateFile}
                        />
                        {templateFile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            File upload takes priority over URL
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Thumbnail Image</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                handleFileChange(file, "thumbnail")
                              }}
                              className="cursor-pointer"
                            />
                          </div>
                          {thumbnailPreview && (
                            <div className="relative w-full h-32 border rounded-md overflow-hidden">
                              <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Upload a .png or .jpg file, or use URL below (optional - will use template image if not provided)
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label>Thumbnail URL (Alternative)</Label>
                        <Input
                          value={newTemplate.thumbnailUrl}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, thumbnailUrl: e.target.value })
                          }
                          placeholder="/templates/template-thumb.png"
                          disabled={!!thumbnailFile}
                        />
                        {thumbnailFile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            File upload takes priority over URL
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddTemplate} 
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
                              <Upload className="mr-2 h-4 w-4" />
                              Upload & Save Template
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingTemplate(false)
                            setTemplateFile(null)
                            setThumbnailFile(null)
                            setTemplatePreview(null)
                            setThumbnailPreview(null)
                          }}
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
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm text-muted-foreground">Template Preview</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {template.category}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
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
