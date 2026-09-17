import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
    buffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return crc ^ -1;
  }

  return Buffer.concat([signature, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

function drawOriaIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = isMaskable ? 0.72 : 0.88;
  const r = (Math.min(w, h) / 2) * scale;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (isMaskable) {
    // Solid background for maskable icons
    if (dist > r * 1.3) {
      return [11, 12, 16, 255]; // background fill
    }
  } else {
    // Transparent outside circle for standard icons
    if (dist > r * 1.05) {
      return [0, 0, 0, 0];
    }
  }

  // Outer gold ring
  if (dist >= r * 0.94 && dist <= r * 1.04) {
    const angle = Math.atan2(dy, dx);
    const grad = 0.5 + 0.5 * Math.sin(angle * 3);
    return [
      Math.floor(212 + 43 * grad),
      Math.floor(175 + 67 * grad),
      Math.floor(55 + 140 * grad),
      255
    ];
  }

  // Diamond shape
  const nx = (x - cx) / (r * 0.62);
  const ny = (y - cy) / (r * 0.62);

  // Faceted crown & pavilion
  let inUpper = ny < 0.05 && (Math.abs(nx) * 0.8 + Math.abs(ny - 0.05) * 1.15) <= 0.85;
  let inLower = ny >= 0.05 && (Math.abs(nx) + (ny - 0.05) * 0.95) <= 0.95;

  if (inUpper || inLower) {
    // Facet lines
    const isEdge = Math.abs(Math.abs(nx) - 0.45) < 0.03 || Math.abs(ny - 0.05) < 0.03;
    if (isEdge) {
      return [255, 248, 220, 255]; // Bright facet edge
    }

    // Emerald accent point at top right
    const emDist = Math.sqrt(Math.pow(nx - 0.42, 2) + Math.pow(ny + 0.4, 2));
    if (emDist < 0.15) {
      return [16, 185, 129, 255]; // Emerald #10B981
    }

    const light = 0.5 * (1 - ny) + 0.3 * (1 - Math.abs(nx));
    return [
      Math.min(255, Math.floor(212 + light * 43)),
      Math.min(255, Math.floor(175 + light * 65)),
      Math.min(255, Math.floor(55 + light * 120)),
      255
    ];
  }

  // Inner background
  return [11, 12, 16, 255]; // #0B0C10
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#191B24"/>
      <stop offset="100%" stop-color="#0B0C10"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5D6"/>
      <stop offset="35%" stop-color="#E5C158"/>
      <stop offset="70%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#996515"/>
    </linearGradient>
    <linearGradient id="facetGlow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bgGrad)" stroke="url(#goldGrad)" stroke-width="10" filter="url(#goldGlow)"/>

  <!-- Diamond Crown & Pavilion -->
  <g transform="translate(256 256) scale(2.8) translate(-50 -50)">
    <!-- Outer Faceted Diamond -->
    <polygon points="50,6 88,34 50,94 12,34" stroke="url(#goldGrad)" stroke-width="2.8" fill="rgba(18, 16, 22, 0.9)" />
    <!-- Table & Inner Facets -->
    <polygon points="28,34 72,34 50,94" stroke="url(#goldGrad)" stroke-width="1.6" fill="none" />
    <polygon points="50,6 28,34 50,56 72,34" stroke="url(#goldGrad)" stroke-width="1.4" fill="url(#facetGlow)" />
    <!-- Sparkle Points -->
    <circle cx="50" cy="56" r="3.5" fill="#FFF2C6" />
    <circle cx="80" cy="30" r="2.8" fill="#10B981" />
  </g>
</svg>`;

function generateForDir(targetDir) {
  const iconsDir = path.join(targetDir, 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  console.log(`Generating icons in ${targetDir}...`);

  // SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(targetDir, 'favicon.svg'), svgContent, 'utf8');

  // PNGs
  const sizes = [
    { name: 'pwa-192x192.png', size: 192, maskable: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false },
    { name: 'pwa-maskable-192x192.png', size: 192, maskable: true },
    { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-16x16.png', size: 16, maskable: false }
  ];

  for (const item of sizes) {
    const pngBuf = createPNG(item.size, item.size, (x, y, w, h) => drawOriaIcon(x, y, w, h, item.maskable));
    fs.writeFileSync(path.join(iconsDir, item.name), pngBuf);
    // Also mirror top-level common names
    if (['pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'].includes(item.name)) {
      fs.writeFileSync(path.join(targetDir, item.name), pngBuf);
    }
  }

  console.log(`Generated all icons in ${targetDir}`);
}

generateForDir(path.resolve('oria-main/public'));
generateForDir(path.resolve('oria-admin/public'));
