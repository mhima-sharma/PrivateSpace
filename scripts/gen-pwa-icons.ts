/**
 * Generates PWA icons from the brand logo.
 *  • icon-192.png / icon-512.png — standard ("any") icons (rounded mark).
 *  • icon-maskable-512.png       — full-bleed gradient for Android maskable.
 *  • apple-touch-icon.png (180)  — full-bleed (iOS adds its own rounding).
 *
 * Run with: npx tsx scripts/gen-pwa-icons.ts
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC = join(process.cwd(), "public");

// Full-bleed variant (no transparent corners) for maskable / apple icons.
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF8A3D"/>
      <stop offset="1" stop-color="#F25C05"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <text x="256" y="268" fill="white" font-family="Georgia, 'Times New Roman', serif"
        font-size="210" font-weight="700" letter-spacing="4" text-anchor="middle"
        dominant-baseline="central">MS</text>
</svg>`;

async function main() {
  const logo = await readFile(join(PUBLIC, "logo.svg"));
  const maskable = Buffer.from(maskableSvg);

  const out: [Buffer, number, string][] = [
    [logo, 192, "icon-192.png"],
    [logo, 512, "icon-512.png"],
    [maskable, 512, "icon-maskable-512.png"],
    [maskable, 180, "apple-touch-icon.png"],
  ];

  for (const [src, size, name] of out) {
    const png = await sharp(src, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(join(PUBLIC, name), png);
    console.log(`✓ ${name} (${size}×${size})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
