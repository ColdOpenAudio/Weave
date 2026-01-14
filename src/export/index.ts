import { ExportOptions } from './types';

export { ExportOptions };

import { applyColorPolicy } from './colors';

import { exportPDF, exportEPS } from './vector';

import { exportRaster } from './raster';

import { extractSeparations } from './separations';

import * as path from 'path';

// Registry of format handlers for easy extension
const formatHandlers: Record<string, (svg: string, options: ExportOptions, outputPath: string) => Promise<void>> = {
  'pdf': async (svg, options, outputPath) => {
    await exportPDF(svg, outputPath);
  },
  'eps': async (svg, options, outputPath) => {
    await exportEPS(svg, outputPath);
  },
  'tiff': async (svg, options, outputPath) => {
    await exportRaster(svg, 'tiff', outputPath, options.dpi || 300);
  },
  'png': async (svg, options, outputPath) => {
    await exportRaster(svg, 'png', outputPath, options.dpi || 300);
  },
  'jpg': async (svg, options, outputPath) => {
    await exportRaster(svg, 'jpg', outputPath, options.dpi || 300);
  },
  'webp': async (svg, options, outputPath) => {
    await exportRaster(svg, 'webp', outputPath, options.dpi || 300);
  },
  // To add a new format, add an entry here and implement the handler function
};

export async function exportComposition(svg: string, options: ExportOptions): Promise<void> {

  svg = applyColorPolicy(svg, options.colorPolicy);

  const baseName = `fabric-${options.seed}`;

  const ext = getExtension(options.format);

  const outputPath = path.join(options.outputDir, `${baseName}.${ext}`);

  if (options.enableSeparations) {

    const { layers, combined } = extractSeparations(svg);

    // Export combined

    await exportToFormat(combined, options, outputPath);

    // Export layers

    for (const layer of layers) {

      const layerPath = path.join(options.outputDir, `${baseName}-${layer.name}.${ext}`);

      await exportToFormat(layer.svg, options, layerPath);

    }

  } else {

    await exportToFormat(svg, options, outputPath);

  }

}

async function exportToFormat(svg: string, options: ExportOptions, outputPath: string): Promise<void> {

  const handler = formatHandlers[options.format];

  if (!handler) {

    throw new Error(`Unsupported export format: ${options.format}. Add a handler to formatHandlers in index.ts`);

  }

  await handler(svg, options, outputPath);

}

function getExtension(format: string): string {

  const extMap: Record<string, string> = {

    'pdf': 'pdf',

    'eps': 'eps',

    'tiff': 'tiff',

    'png': 'png',

    'jpg': 'jpg',

    'webp': 'webp',

  };

  return extMap[format] || format; // Fallback to format name as extension

}