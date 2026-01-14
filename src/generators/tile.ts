// Core tile engine for corduroy fabric generation

export interface RibProfile {
  width: number;
  shadowColor: string;
  midColor: string;
  highlightColor: string;
}

export interface TileConfig {
  width: number;
  height: number;
  seed: number;
  ribProfile: RibProfile;
  napDensity: number; // e.g., 0.1 for 10% coverage
  driftBands: number; // number of macro bands
}

// Simple seeded PRNG
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// 1.1 Define rib profile functions
export function createRibProfile(width: number, shadow: string, mid: string, highlight: string): RibProfile {
  return { width, shadowColor: shadow, midColor: mid, highlightColor: highlight };
}

// 1.2 Implement single-wale rib field generation
export function generateRibField(config: TileConfig): string {
  const { width, height, seed, ribProfile } = config;
  const rand = new SeededRandom(seed);
  let svg = `<g id="rib-field">`;

  // Generate vertical ribs with slight randomness in position
  const numRibs = Math.floor(width / ribProfile.width);
  for (let i = 0; i < numRibs; i++) {
    const x = i * ribProfile.width + (rand.next() - 0.5) * 2; // slight jitter
    // Simple rect for rib with gradient
    svg += `<rect x="${x}" y="0" width="${ribProfile.width}" height="${height}" fill="url(#rib-gradient-${i})"/>`;
    // Define gradient
    svg += `<defs><linearGradient id="rib-gradient-${i}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${ribProfile.shadowColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${ribProfile.midColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ribProfile.highlightColor};stop-opacity:1" />
    </linearGradient></defs>`;
  }
  svg += `</g>`;
  return svg;
}

// 1.3 Add nap micro-streak layer
export function generateNapLayer(config: TileConfig): string {
  const { width, height, seed, napDensity } = config;
  const rand = new SeededRandom(seed + 1); // different seed
  let svg = `<g id="nap-layer">`;

  const numStreaks = Math.floor(width * height * napDensity / 100); // density based
  for (let i = 0; i < numStreaks; i++) {
    const x = rand.next() * width;
    const y = rand.next() * height;
    const length = 1 + rand.next() * 3; // 1-4 units
    const angle = rand.next() * Math.PI * 2;
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    svg += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#f0f0f0" stroke-width="0.5" opacity="0.3"/>`;
  }
  svg += `</g>`;
  return svg;
}

// 1.4 Implement drift bands
export function generateDriftBands(config: TileConfig): string {
  const { width, height, seed, driftBands } = config;
  const rand = new SeededRandom(seed + 2);
  let svg = `<g id="drift-bands">`;

  const bandHeight = height / driftBands;
  for (let i = 0; i < driftBands; i++) {
    const y = i * bandHeight;
    const opacity = 0.1 + rand.next() * 0.2; // subtle variation
    svg += `<rect x="0" y="${y}" width="${width}" height="${bandHeight}" fill="#000000" opacity="${opacity}"/>`;
  }
  svg += `</g>`;
  return svg;
}

// 1.5 Integrate all layers into composite tile SVG
export function generateTileSVG(config: TileConfig, overlay?: string): string {
  const ribField = generateRibField(config);
  const napLayer = generateNapLayer(config);
  const driftBands = generateDriftBands(config);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}">
    ${driftBands}
    ${ribField}
    ${napLayer}
    ${overlay || ''}
  </svg>`;

  return svg;
}