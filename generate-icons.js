/**
 * Script to generate PWA icons from Logo.png
 *
 * This script requires the 'sharp' package to be installed.
 * Run: npm install sharp
 * Then: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('❌ Sharp is not installed. Please run: npm install sharp');
      process.exit(1);
    }

    const inputPath = path.join(__dirname, 'public', 'Logo.png');
    const outputDir = path.join(__dirname, 'public');

    // Check if Logo.png exists
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Logo.png not found in public folder');
      process.exit(1);
    }

    console.log('📦 Generating PWA icons...\n');

    const sizes = [
      { size: 152, name: 'icon-152x152.png' },
      { size: 192, name: 'icon-192x192.png' },
      { size: 512, name: 'icon-512x512.png' },
    ];

    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);

      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Created ${name} (${size}x${size})`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('📝 Don\'t forget to update manifest.json with the new icon paths.');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
