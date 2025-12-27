/**
 * Script to update an overlay with a new image
 * Usage: npx tsx scripts/update-overlay.ts <overlay-id> <image-path>
 * Example: npx tsx scripts/update-overlay.ts overlay-1766800234209 ./donna-logo.png
 */

import { put } from "@vercel/blob"
import { sql } from "@vercel/postgres"
import * as fs from "fs"
import * as path from "path"

async function updateOverlay(overlayId: string, imagePath: string) {
  try {
    // Check if image file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: Image file not found: ${imagePath}`)
      process.exit(1)
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath)
    const imageName = path.basename(imagePath)
    const imageExtension = path.extname(imageName).slice(1) || "png"

    console.log(`Uploading image: ${imageName}...`)

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const blobFileName = `overlays/overlay-${timestamp}.${imageExtension}`
    
    const blob = await put(blobFileName, imageBuffer, {
      access: "public",
      contentType: `image/${imageExtension === "jpg" ? "jpeg" : imageExtension}`,
    })

    console.log(`✓ Image uploaded to: ${blob.url}`)

    // Update overlay in database
    console.log(`Updating overlay ${overlayId} in database...`)
    
    const now = Date.now()
    await sql`
      UPDATE overlays
      SET image_url = ${blob.url},
          updated_at = ${now}
      WHERE id = ${overlayId}
    `

    console.log(`✓ Overlay ${overlayId} updated successfully!`)
    console.log(`New image URL: ${blob.url}`)
  } catch (error) {
    console.error("Error updating overlay:", error)
    process.exit(1)
  }
}

// Get command line arguments
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/update-overlay.ts <overlay-id> <image-path>")
  console.error("Example: npx tsx scripts/update-overlay.ts overlay-1766800234209 ./donna-logo.png")
  process.exit(1)
}

const [overlayId, imagePath] = args
updateOverlay(overlayId, imagePath)

