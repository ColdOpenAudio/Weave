// Test script for composition outputs
import { generateTileWithOverlay, generateCompositeSVG, generateFlattenedSVG, validateSVG, getSVGSize, CompositionConfig } from './generators/composition';
import { createRibProfile } from './generators/tile';

const tileConfig = {
  width: 100,
  height: 100,
  seed: 12345,
  ribProfile: createRibProfile(5, '#333', '#666', '#999'),
  napDensity: 0.05,
  driftBands: 3
};

const weaveConfig = {
  width: 100,
  height: 100,
  seed: 12345,
  eventDensity: 0.02,
  minFeatureMm: 1,
  xWrap: true,
  yWrap: false
};

const compConfig: CompositionConfig = {
  tile: tileConfig,
  weave: weaveConfig,
  repeatX: 4
};

// 4.1 Master tile
const masterTile = generateTileWithOverlay(compConfig);
console.log('Master tile valid:', validateSVG(masterTile));
console.log('Master tile size:', getSVGSize(masterTile));

// 4.2 Composite
const composite = generateCompositeSVG(compConfig);
console.log('Composite valid:', validateSVG(composite));
console.log('Composite size:', getSVGSize(composite));

// 4.3 Flattened
const flattened = generateFlattenedSVG(composite);
console.log('Flattened valid:', validateSVG(flattened));
console.log('Flattened size:', getSVGSize(flattened));

// 4.4 Consistency
const composite2 = generateCompositeSVG(compConfig);
console.log('Consistency:', composite === composite2 ? 'Same' : 'Different');