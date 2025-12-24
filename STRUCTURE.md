# Project Structure

This project has been restructured to match the glogangpb repository organization while maintaining the Lunar New Year 2026 theme and Monterey Park Chamber of Commerce branding.

## Directory Structure

```
photobooth/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── photobooth-app.tsx    # Main app component
│   ├── photobooth-camera.tsx # Camera component
│   ├── photo-gallery.tsx     # Gallery component
│   ├── welcome-screen.tsx    # Welcome screen
│   └── ui/                   # UI components (shadcn/ui)
├── lib/                  # Library code
│   ├── js/               # JavaScript/TypeScript modules (similar to glogangpb/js/)
│   │   ├── camera.ts     # Camera utilities
│   │   ├── config.ts     # Configuration
│   │   ├── photobooth.ts # Photobooth logic
│   │   ├── session.ts    # Session management
│   │   ├── storage.ts     # Storage utilities
│   │   └── utils.ts      # Utility functions
│   └── utils.ts          # General utilities
├── public/               # Public assets
│   ├── filters/          # Filter assets (similar to glogangpb/public/filters/)
│   ├── face-filters/     # Face filter assets (similar to glogangpb/face-filters/)
│   ├── img/
│   │   └── overlays/     # Overlay images (similar to glogangpb/img/overlays/)
│   └── ...               # Other public assets
├── scripts/              # Utility scripts (similar to glogangpb/scripts/)
│   └── README.md
└── styles/               # Additional styles
    └── globals.css
```

## Key Changes from Original Structure

1. **Created `lib/js/` folder** - Modular JavaScript/TypeScript files similar to glogangpb's `js/` folder:
   - `camera.ts` - Camera functionality
   - `config.ts` - Centralized configuration
   - `photobooth.ts` - Photobooth logic and overlays
   - `session.ts` - Session management
   - `storage.ts` - LocalStorage utilities
   - `utils.ts` - Utility functions

2. **Reorganized `public/` folder** - Matches glogangpb structure:
   - `public/filters/` - Filter assets
   - `public/face-filters/` - Face filter assets
   - `public/img/overlays/` - Overlay images

3. **Created `scripts/` folder** - For utility scripts similar to glogangpb

4. **Updated components** - Now use the modular structure from `lib/js/`

## Preserved Elements

- ✅ Lunar New Year 2026 theme
- ✅ Monterey Park Chamber of Commerce branding
- ✅ All colors and styling
- ✅ All UI components and functionality
- ✅ Welcome screen with festive decorations
- ✅ Photo overlays (lanterns, dragon, envelope, fireworks)
- ✅ Gallery functionality
- ✅ Download and share features

## Configuration

All configuration is centralized in `lib/js/config.ts`, including:
- App name and organization
- Camera settings
- Overlay definitions
- Storage keys
- Branding text

This makes it easy to maintain and update the theme and branding.

