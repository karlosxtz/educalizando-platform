import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const brandingDir = path.join(publicDir, 'branding');

const sourceFile = path.join(brandingDir, 'logo-educalizando.png');

async function main() {
  try {
    // Check if source exists
    await fs.access(sourceFile);
    console.log(`Processing source image: ${sourceFile}`);

    const sourceImage = sharp(sourceFile);

    // Definitions for all needed images
    const squareIcons = [
      { path: path.join(publicDir, 'apple-touch-icon.png'), size: 180 },
      { path: path.join(publicDir, 'favicon.png'), size: 32 },
      { path: path.join(publicDir, 'icon-192.png'), size: 192 },
      { path: path.join(publicDir, 'icon-512.png'), size: 512 },
      { path: path.join(publicDir, 'maskable-icon-512.png'), size: 512, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      { path: path.join(publicDir, 'logo-icon.png'), size: 512 },
      
      { path: path.join(brandingDir, 'apple-touch-icon.png'), size: 180 },
      { path: path.join(brandingDir, 'avatar-128.png'), size: 128 },
      { path: path.join(brandingDir, 'avatar-256.png'), size: 256 },
      { path: path.join(brandingDir, 'avatar-512.png'), size: 512 },
      { path: path.join(brandingDir, 'favicon-16.png'), size: 16 },
      { path: path.join(brandingDir, 'favicon-32.png'), size: 32 },
      { path: path.join(brandingDir, 'favicon-48.png'), size: 48 },
      { path: path.join(brandingDir, 'logo-educalizando-icon-192.png'), size: 192 },
      { path: path.join(brandingDir, 'logo-educalizando-icon-512.png'), size: 512 },
      { path: path.join(brandingDir, 'logo-educalizando-icon.png'), size: 512 },
    ];

    // The original image is 2172x724 (3:1 horizontal).
    // We will extract the left 724x724 square for the square icons (assuming the symbol is on the left).
    const iconBase = sharp(sourceFile).extract({ left: 0, top: 0, width: 724, height: 724 });

    // For icons, we use the extracted square part.
    for (const icon of squareIcons) {
      await iconBase.clone()
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: icon.background || { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(icon.path);
      console.log(`Generated square icon: ${icon.path}`);
    }

    // Direct copy or resize for horizontal/main logos
    // Main logos can just be copies of the original or slightly resized if needed.
    // Let's just copy the source for these as they are likely meant to be the full horizontal version.
    const mainLogos = [
      path.join(publicDir, 'logo-horizontal.png'),
      path.join(publicDir, 'logo.png'),
      path.join(brandingDir, 'logo-educalizando-dark.png'),
      path.join(brandingDir, 'logo-educalizando-horizontal.png'),
      path.join(brandingDir, 'logo-educalizando-light.png'),
      path.join(brandingDir, 'logo-educalizando.png')
    ];

    for (const logo of mainLogos) {
      await fs.copyFile(sourceFile, logo);
      console.log(`Copied main logo to: ${logo}`);
    }

    // Social and OG (typically 1200x630 or similar)
    const ogLogos = [
      { path: path.join(brandingDir, 'logo-og.png'), width: 1200, height: 630 },
      { path: path.join(brandingDir, 'logo-social.png'), width: 1200, height: 630 }
    ];

    for (const og of ogLogos) {
      await sharp(sourceFile)
        .resize(og.width, og.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Or white? Let's use transparent.
        })
        .toFile(og.path);
      console.log(`Generated OG logo: ${og.path}`);
    }

    // Create favicon.ico using favicon-32.png as a simple fallback
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');
    await iconBase.clone().resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(faviconIcoPath);
    console.log(`Generated favicon.ico at: ${faviconIcoPath}`);
    
    const brandingFaviconIcoPath = path.join(brandingDir, 'favicon.ico');
    await fs.copyFile(faviconIcoPath, brandingFaviconIcoPath);
    
    console.log('Finished updating logos successfully!');

  } catch (error) {
    console.error('Error updating logos:', error);
  }
}

main();
