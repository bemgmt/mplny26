# Vercel Blob & Neon Postgres Setup Guide

This application uses Vercel Blob Storage for template images and Neon Postgres (via Vercel Marketplace) for template metadata. Templates uploaded by team members are stored globally and persist across server restarts.

## Setup Instructions

### 1. Create Vercel Blob Store

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Blob**
6. Give it a name (e.g., "photobooth-templates")
7. Click **Create**

### 2. Create Neon Postgres Database

1. In your Vercel dashboard, go to your project
2. Navigate to **Storage** tab
3. Click **Browse Marketplace** or **Create Database**
4. Select **Neon** (Postgres database)
5. Click **Add Integration** or **Create**
6. Follow the setup wizard:
   - Create a new Neon account (if needed) or connect existing
   - Choose a database name (e.g., "photobooth")
   - Select a region closest to your users
   - Click **Create** or **Connect**

### 3. Get Your Connection Details

After creating both stores, Vercel automatically creates environment variables:

1. In your Vercel dashboard, go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Vercel automatically creates environment variables:
   - `BLOB_READ_WRITE_TOKEN` (for Blob storage)
   - `POSTGRES_URL` (for Neon Postgres connection)
   - `POSTGRES_PRISMA_URL` (optional, for Prisma)
   - `POSTGRES_URL_NON_POOLING` (optional, for direct connections)

### 4. Add Environment Variables

**For Local Development:**
Create or update `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
POSTGRES_URL=postgresql://user:password@host:5432/database?sslmode=require
```

You can find your connection string in:
- Vercel Dashboard → Your Project → Storage → Neon → Settings
- Or in the Neon dashboard: https://console.neon.tech

**For Production:**
Vercel automatically adds these environment variables when you create the stores. They should already be available in:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify the variables are present:
   - `BLOB_READ_WRITE_TOKEN`
   - `POSTGRES_URL`
3. If missing, you can find them in your storage store settings

### 5. Deploy

After adding the environment variables, redeploy your application:

```bash
git add .
git commit -m "Add Vercel Blob and Neon Postgres integration"
git push
```

Vercel will automatically detect the new environment variables and redeploy.

## How It Works

### Template Upload Flow

1. **Team member uploads template** via Admin Dashboard
2. **Files are uploaded to Vercel Blob** (images stored with public URLs)
3. **Template metadata is stored** in Neon Postgres (persistent SQL database)
4. **All users can access** templates via `/api/admin/templates` endpoint
5. **Templates are cached** client-side for 5 minutes to reduce API calls

### Storage Architecture

- **Images**: Stored in Vercel Blob Storage (public URLs)
- **Metadata**: Stored in Neon Postgres (persists across server restarts)
- **Database Table**: Automatically created on first use (`templates` table)
- **Persistence**: Templates survive server restarts and deployments

### Database Schema

The application automatically creates a `templates` table with the following structure:

```sql
CREATE TABLE templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  thumbnail TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at BIGINT NOT NULL
)
```

## Important Notes

### Persistent Storage

The template metadata is stored in Neon Postgres, which means:
- ✅ Templates persist across server restarts
- ✅ Templates persist across deployments
- ✅ Templates are shared across all server instances
- ✅ SQL queries for complex operations
- ✅ ACID compliance for data integrity
- ✅ No data loss on server restarts
- ✅ Scalable and production-ready

### Template Access

- **Global Access**: All users see templates uploaded by any team member
- **Real-time**: Templates appear after upload (with 5-minute cache)
- **Cache**: Client-side caching reduces API calls
- **Fallback**: Config templates + localStorage templates still work

### Neon Postgres Benefits

- **Serverless**: Auto-scales with your application
- **Free Tier**: Generous free tier for development
- **Fast**: Low-latency connections
- **Reliable**: Built on Postgres with high availability
- **SQL**: Full SQL support for complex queries

## Testing

1. Upload a template via Admin Dashboard
2. Check Vercel Blob dashboard to see uploaded files
3. Check Neon dashboard to see the `templates` table and data
4. Templates should appear for all users
5. Verify templates persist across page refreshes
6. Verify templates persist after server restart

## Troubleshooting

### "Failed to upload files" Error

- Check that `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify the token has read/write permissions
- Check Vercel Blob store is created and active

### Templates Not Appearing

- Clear browser cache
- Check browser console for errors
- Verify API endpoint `/api/admin/templates` returns templates
- Check that templates are being fetched on page load
- Verify Neon database connection is working

### Database Connection Errors

- Check that `POSTGRES_URL` is set correctly
- Verify Neon database is active and running
- Check Neon dashboard for connection issues
- Ensure the database is in the same region as your Vercel deployment
- Verify SSL mode is set to `require` in connection string

### Table Creation Issues

- The table is automatically created on first use
- If issues occur, you can manually create it in Neon dashboard:
  1. Go to Neon dashboard → Your database → SQL Editor
  2. Run the CREATE TABLE statement from the schema above
  3. Or let the application create it automatically

### Server Restart Loses Templates

- This should not happen with Neon Postgres
- If templates are lost, check:
  - Neon database is active and accessible
  - `POSTGRES_URL` is set correctly
  - Check Neon dashboard for database status
  - Verify the `templates` table exists and has data
  - Check application logs for database errors

## Neon Dashboard Access

You can access your Neon database directly:

1. Go to Vercel Dashboard → Your Project → Storage → Neon
2. Click **Open in Neon Dashboard** or visit https://console.neon.tech
3. View tables, run queries, and monitor your database
4. Use the SQL Editor to inspect or modify data

## Migration from Vercel KV (if applicable)

If you were previously using Vercel KV, the migration is automatic:
- Old KV data is not migrated automatically
- New templates will be stored in Neon Postgres
- You may need to re-upload templates after switching to Neon
