// Test script for weave overlay
import { generateTileSVG, createRibProfile, TileConfig } from './generators/tile';
import { generateWeaveOverlay, generateTileWithOverlay, WeaveConfig } from './generators/weave';

const tileConfig: TileConfig = {
  width: 100,
  height: 100,
  seed: 12345,
  ribProfile: createRibProfile(5, '#333', '#666', '#999'),
  napDensity: 0.05,
  driftBands: 3
};

const weaveConfig: WeaveConfig = {
  width: 100,
  height: 100,
  seed: 12345,
  eventDensity: 0.02,
  minFeatureMm: 1,
  xWrap: true,
  yWrap: false
};

const tileSvg = generateTileSVG(tileConfig);
const overlaySvg = generateWeaveOverlay(weaveConfig);
const fullSvg = generateTileWithOverlay(tileSvg, overlaySvg);

console.log(fullSvg);

// Tests
if (fullSvg.includes('weave-overlay')) console.log('Overlay present');
if (fullSvg.includes('<circle') || fullSvg.includes('<line') || fullSvg.includes('<rect')) console.log('Events generated');

// Determinism
const overlaySvg2 = generateWeaveOverlay(weaveConfig);
if (overlaySvg === overlaySvg2) console.log('Placement deterministic');
else console.log('Not deterministic');

// Density check (rough)
const eventCount = (overlaySvg.match(/<circle|<line|<rect/g) || []).length;
console.log(`Events generated: ${eventCount}`);

// Test with Y wrap
const weaveConfigY: WeaveConfig = { ...weaveConfig, yWrap: true };
const overlayY = generateWeaveOverlay(weaveConfigY);
console.log('Y wrap enabled, events:', (overlayY.match(/<circle|<line|<rect/g) || []).length);