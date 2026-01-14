// Composition outputs for fabric patterns

import { TileConfig } from './tile';
import { WeaveConfig } from './weave';

export interface CompositionConfig {
  tile: TileConfig;
  weave: WeaveConfig;
  repeatX: number; // e.g., 4 for 4-wide
}

// 4.1 Emit master tile SVG (already in tile.ts, but here for composition)
export function generateMasterTile(config: CompositionConfig): string {
  // Assume tile and weave configs match
  const tileSvg = generateTileSVG(config.tile); // need to import or pass overlay
  // For now, generate without overlay, but integrate
  return tileSvg;
}

// Helper to generate tile with overlay
import { generateTileSVG } from './tile';
import { generateWeaveOverlay } from './weave';

export function generateTileWithOverlay(config: CompositionConfig): string {
  const tileSvg = generateTileSVG(config.tile);
  const overlaySvg = generateWeaveOverlay(config.weave);
  return tileSvg.replace('</svg>', overlaySvg + '</svg>');
}

// 4.2 Generate 4-wide composite SVG
export function generateCompositeSVG(config: CompositionConfig): string {
  const masterTile = generateTileWithOverlay(config);
  const tileWidth = config.tile.width;
  const tileHeight = config.tile.height;
  const totalWidth = tileWidth * config.repeatX;
  const totalHeight = tileHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;

  for (let i = 0; i < config.repeatX; i++) {
    const x = i * tileWidth;
    // Use <use> to reference master tile, but since string, duplicate
    svg += `<g transform="translate(${x}, 0)">${masterTile.replace('<svg', '<g').replace('</svg>', '</g>')}</g>`;
  }

  svg += '</svg>';
  return svg;
}

// 4.3 Create flattened SVG variant
export function generateFlattenedSVG(compositeSvg: string): string {
  // Remove <defs> and expand gradients inline if possible
  // For simplicity, remove defs and keep elements
  let flattened = compositeSvg.replace(/<defs>[\s\S]*?<\/defs>/g, '');
  // Since gradients are per rib, and repeated, it might duplicate, but for now, keep
  return flattened;
}

// 4.4 Test helpers
export function validateSVG(svg: string): boolean {
  // Basic check: has <svg> and </svg>
  return svg.includes('<svg') && svg.includes('</svg>');
}

export function getSVGSize(svg: string): number {
  return Buffer.byteLength(svg, 'utf8');
}