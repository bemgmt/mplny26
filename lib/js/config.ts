/**
 * Configuration for WSGVR Affiliate Happy Hour Photobooth
 */

export const config = {
  app: {
    name: "WSGVR Affiliate Happy Hour Photobooth",
    organization: "West San Gabriel Valley REALTORS®",
    year: 2026,
    theme: "wsgvr-happy-hour",
  },
  camera: {
    defaultFacingMode: "user" as "user" | "environment",
    idealWidth: 1920,
    idealHeight: 1080,
  },
  overlays: [
    { id: "none", name: "No Overlay" },
    {
      id: "wsgvr-frame-vertical",
      name: "WSGVR Happy Hour Vertical",
      type: "image",
      imageUrl: "/img/overlays/wsgvr-affiliate-happyhour-vertical.svg",
    },
  ],
  storage: {
    photosKey: "wsgvr-happyhour-photos",
    sessionKey: "wsgvr-happyhour-session",
    maxPhotos: 15, // Maximum number of photos to keep in localStorage (reduced due to size limits)
    compressionQuality: 0.7, // JPEG compression quality (0.0 to 1.0)
  },
  branding: {
    primaryText: "Affiliate Happy Hour",
    secondaryText: "West San Gabriel Valley REALTORS®",
    footerText: "Thursday, January 29, 2026 • 3:00 PM – 6:00 PM • Holiday Inn Monterey Park",
  },
  templates: [
    {
      id: "template-1",
      name: "Classic Frame",
      description: "Traditional red and gold frame",
      thumbnail: "/templates/template-1-thumb.png",
      image: "/templates/template-1.png",
      category: "frames",
    },
    {
      id: "template-2",
      name: "Dragon Border",
      description: "Decorative dragon border design",
      thumbnail: "/templates/template-2-thumb.png",
      image: "/templates/template-2.png",
      category: "borders",
    },
    {
      id: "template-3",
      name: "Lantern Frame",
      description: "Festive lantern-themed frame",
      thumbnail: "/templates/template-3-thumb.png",
      image: "/templates/template-3.png",
      category: "frames",
    },
    {
      id: "template-4",
      name: "Calligraphy Style",
      description: "Elegant calligraphy-inspired design",
      thumbnail: "/templates/template-4-thumb.png",
      image: "/templates/template-4.png",
      category: "artistic",
    },
    {
      id: "template-5",
      name: "Modern Minimalist",
      description: "Clean and modern design",
      thumbnail: "/templates/template-5-thumb.png",
      image: "/templates/template-5.png",
      category: "modern",
    },
  ],
  backgrounds: [
    {
      id: "bg-1",
      name: "Red Silk",
      description: "Traditional red silk texture",
      thumbnail: "/backgrounds/bg-1-thumb.png",
      image: "/backgrounds/bg-1.png",
      color: "#dc2626",
    },
    {
      id: "bg-2",
      name: "Gold Pattern",
      description: "Luxurious gold pattern",
      thumbnail: "/backgrounds/bg-2-thumb.png",
      image: "/backgrounds/bg-2.png",
      color: "#fbbf24",
    },
    {
      id: "bg-3",
      name: "Bamboo Forest",
      description: "Serene bamboo forest scene",
      thumbnail: "/backgrounds/bg-3-thumb.png",
      image: "/backgrounds/bg-3.png",
      color: "#16a34a",
    },
    {
      id: "bg-4",
      name: "Temple Courtyard",
      description: "Traditional temple setting",
      thumbnail: "/backgrounds/bg-4-thumb.png",
      image: "/backgrounds/bg-4.png",
      color: "#b45309",
    },
    {
      id: "bg-5",
      name: "Fireworks Night",
      description: "Celebratory fireworks display",
      thumbnail: "/backgrounds/bg-5-thumb.png",
      image: "/backgrounds/bg-5.png",
      color: "#1e40af",
    },
    {
      id: "bg-6",
      name: "Cherry Blossom",
      description: "Beautiful cherry blossom scene",
      thumbnail: "/backgrounds/bg-6-thumb.png",
      image: "/backgrounds/bg-6.png",
      color: "#ec4899",
    },
  ],
} as const

export type Config = typeof config
