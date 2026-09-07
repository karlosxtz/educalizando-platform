import sharp from 'sharp';

async function checkTransparency() {
  const image = sharp('public/branding/logo-educalizando.png');
  const metadata = await image.metadata();
  console.log(`Has alpha channel: ${metadata.hasAlpha}`);
  
  const stats = await image.stats();
  if (stats.channels.length > 3) {
    console.log(`Min alpha: ${stats.channels[3].min}`);
    console.log(`Max alpha: ${stats.channels[3].max}`);
    if (stats.channels[3].min < 255) {
      console.log('Result: Image has transparent pixels (transparent background).');
    } else {
      console.log('Result: Image has an alpha channel but all pixels are fully opaque (solid background).');
    }
  } else {
    console.log('Result: Image does NOT have an alpha channel (solid background).');
  }
}

checkTransparency().catch(console.error);
