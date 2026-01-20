# Admin Dashboard Documentation

## Overview

The admin dashboard is accessible at `/admin` and provides comprehensive management tools for the photobooth system. Access requires PIN authentication (default: **1234**).

## Features

### 1. Photo Management
- **View All Photos**: Browse all photos captured from all sessions
- **Select Multiple Photos**: Click photos to select/deselect them
- **Export Photos**: Export selected photos (or all photos) as JSON
- **Delete Photos**: Delete selected photos from storage
- **Refresh**: Reload photos from storage
- **Statistics**: View total photos and storage usage

### 2. Template Management
- **View Templates**: See all available photo templates
- **Add Templates**: Create new templates with:
  - Name
  - Description
  - Category (Frames, Borders, Artistic, Modern)
  - Image URL
  - Thumbnail URL
- **Edit Templates**: Edit existing templates (UI ready)
- **Delete Templates**: Remove templates (UI ready)
- **Categories**: Organize templates by category

### 3. Background Management
- **View Backgrounds**: See all available background images
- **Color Preview**: Visual preview of background colors
- **Background Info**: View background details and IDs

### 4. Control Center
Comprehensive settings management:

#### Photobooth Settings
- **Enable/Disable**: Turn photobooth on/off
- **Auto Capture**: Enable automatic photo capture
- **Countdown Timer**: Set countdown duration (seconds)
- **Max Photos**: Limit photos per session

#### Feature Toggles
- **Overlays**: Enable/disable photo overlays
- **Templates**: Enable/disable photo templates
- **Backgrounds**: Enable/disable background images
- **Sharing**: Enable/disable photo sharing

#### Storage Settings
- **Max Storage**: Set maximum storage limit (MB)
- **Auto Cleanup**: Enable automatic cleanup of old photos
- **Cleanup After**: Set days before cleanup

## API Endpoints

### Photos
- `GET /api/admin/photos` - Get all photos
- `DELETE /api/admin/photos?ids=id1,id2` - Delete photos
- `GET /api/admin/photos/export?format=zip&ids=id1,id2` - Export photos

### Templates
- `GET /api/admin/templates` - Get all templates
- `POST /api/admin/templates` - Add new template
- `DELETE /api/admin/templates?id=template-id` - Delete template

### Settings
- `GET /api/admin/settings` - Get current settings
- `POST /api/admin/settings` - Update settings

## Usage

1. **Access Dashboard**: Navigate to `/admin` or click "Admin" button in photobooth
2. **Login**: Enter PIN **1234**
3. **Navigate Tabs**: Use tabs to switch between Photos, Templates, Backgrounds, and Control Center
4. **Manage Content**: Use buttons and dialogs to add/edit/delete items
5. **Save Settings**: Click "Save Settings" in Control Center to persist changes

## Storage

Currently uses browser localStorage. In production, this should be replaced with:
- Database (PostgreSQL, MongoDB, etc.)
- File storage (AWS S3, Cloudinary, etc.)
- Session management (Redis, etc.)

## Security

- PIN-based authentication (default: 1234)
- Session persistence (24 hours)
- Admin-only routes protected
- All operations require authentication

## Future Enhancements

- File upload for templates/backgrounds
- Photo filtering and search
- Bulk operations
- Analytics dashboard
- User management
- Event management
- Real-time photo sync

