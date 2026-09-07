import sharp from 'sharp';

async function makeTransparent() {
  const inputPath = 'public/branding/logo-educalizando.png';
  
  // First ensure the image has an alpha channel
  const imgWithAlpha = await sharp(inputPath).ensureAlpha().toBuffer();
  
  const { data, info } = await sharp(imgWithAlpha).raw().toBuffer({ resolveWithObject: true });
  
  // Iterate over pixels. Info.channels should be 4 (RGBA)
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // If pixel is close to white, set alpha to 0
    if (r >= 235 && g >= 235 && b >= 235) {
      data[i + 3] = 0; // Set alpha to transparent
    }
  }
  
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
  .png()
  .toFile(inputPath);
  
  console.log('Logo background made transparent successfully.');
}

makeTransparent().catch(console.error);
