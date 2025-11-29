import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = join(__dirname, '..', 'attached_assets', 'stock_images', 'luxury_black_limousi_4dcee597.jpg');
const outputDir = join(__dirname, '..', 'client', 'public');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputImage)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
