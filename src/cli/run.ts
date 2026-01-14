import fs from 'fs';
import path from 'path';
import { generateCompositeSVG } from '../generators/composition.js';
import { exportComposition } from '../export/index.js';
import type { ExportOptions } from '../export/index.js';
import { createPackage } from '../packaging/index.js';
import type { PaletteFormat } from '../packaging/palette.js';

export interface GenerateRunOptions {
  seed: number;
  outputDir: string;
  exportFormat?: string;
  colorPolicy: 'web' | 'print';
  dpi: number;
  enableSeparations: boolean;
}

export interface PackageRunOptions {
  seed: number;
  outputDir: string;
  outputZipPath: string;
  includePrintSpec: boolean;
  deterministic: boolean;
  cleanup: boolean;
  palettePath?: string;
  paletteFormats: PaletteFormat[];
}

export interface GenerateResult {
  svgPath: string;
}

export async function generateFromConfig(config: any, options: GenerateRunOptions): Promise<GenerateResult> {
  const cfg = { ...config, seed: options.seed };
  const compConfig = {
    tile: {
      width: cfg.tile.tile_width,
      height: cfg.tile.tile_height,
      seed: cfg.seed,
      ribProfile: { width: 2, shadowColor: '#333', midColor: '#666', highlightColor: '#999' },
      napDensity: 0.1,
      driftBands: 3
    },
    weave: {
      width: cfg.tile.tile_width,
      height: cfg.tile.tile_height,
      seed: cfg.seed,
      eventDensity: 0.02,
      minFeatureMm: cfg.constraints?.min_feature_mm || 1,
      maxShapesPerTile: cfg.constraints?.max_shapes_per_tile || 1000,
      xWrap: true,
      yWrap: false
    },
    repeatX: cfg.tile.repeat_x
  };

  const svg = generateCompositeSVG(compConfig);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const svgPath = path.join(options.outputDir, `fabric-${options.seed}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated SVG: ${svgPath}`);

  if (options.exportFormat) {
    const exportOptions: ExportOptions = {
      format: options.exportFormat as any,
      colorPolicy: options.colorPolicy,
      dpi: options.dpi,
      enableSeparations: options.enableSeparations,
      outputDir: options.outputDir,
      seed: options.seed
    };
    await exportComposition(svg, exportOptions);
    const ext = options.exportFormat === 'jpg' ? 'jpg' : options.exportFormat;
    console.log(`Exported to ${options.exportFormat}: ${path.join(options.outputDir, `fabric-${options.seed}.${ext}`)}`);
  }

  return { svgPath };
}

export async function packageFromConfig(config: any, options: PackageRunOptions): Promise<void> {
  const files = resolvePackageFiles(options.outputDir, options.outputZipPath);
  const paletteColors = options.palettePath ? loadPaletteColors(options.palettePath) : undefined;

  await createPackage({
    outputZipPath: options.outputZipPath,
    seed: options.seed,
    specVersion: config.spec_version ?? '1.0',
    effectiveConfig: config,
    files,
    colors: paletteColors,
    paletteFormats: options.paletteFormats,
    includePrintSpec: options.includePrintSpec,
    deterministic: options.deterministic,
    cleanup: options.cleanup
  });

  console.log(`Created package: ${options.outputZipPath}`);
}

function resolvePackageFiles(outputDir: string, outputZipPath: string): { path: string; type: string }[] {
  const files: { path: string; type: string }[] = [];
  const resolvedZipPath = path.resolve(outputZipPath);

  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output dir does not exist: ${outputDir}`);
  }

  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absPath = path.resolve(outputDir, entry.name);
    if (absPath === resolvedZipPath) continue;
    files.push({ path: absPath, type: inferFileType(absPath) });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function inferFileType(filePath: string): string {
  const ext = path.extname(filePath).slice(1);
  return ext ? ext.toLowerCase() : 'unknown';
}

function loadPaletteColors(palettePath: string): { name: string; hex: string }[] {
  const raw = fs.readFileSync(palettePath, 'utf8');
  const parsed = JSON.parse(raw);
  const colors = Array.isArray(parsed) ? parsed : parsed.colors;

  if (!Array.isArray(colors)) {
    throw new Error('Palette JSON must be an array or an object with a colors array');
  }

  return colors.map((color: { name: string; hex: string }) => ({
    name: String(color.name),
    hex: String(color.hex)
  }));
}
