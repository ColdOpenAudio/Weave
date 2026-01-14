// Test script for tile generation
import { createRibProfile, generateTileSVG, TileConfig } from './generators/tile';

const config: TileConfig = {
  width: 100,
  height: 100,
  seed: 12345,
  ribProfile: createRibProfile(5, '#333', '#666', '#999'),
  napDensity: 0.05,
  driftBands: 3
};

const svg = generateTileSVG(config);
console.log(svg);

// Basic tests
if (svg.includes('<svg')) console.log('SVG generated');
if (svg.includes('rib-field')) console.log('Rib field present');
if (svg.includes('nap-layer')) console.log('Nap layer present');
if (svg.includes('drift-bands')) console.log('Drift bands present');

// Seed reproducibility
const svg2 = generateTileSVG(config);
if (svg === svg2) console.log('Seed reproducible');
else console.log('Not reproducible');