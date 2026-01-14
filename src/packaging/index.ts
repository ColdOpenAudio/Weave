import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import { generateManifest } from './manifest';
import { generateChecksums } from './checksums';
import { generatePalettes, PaletteColor } from './palette';

export interface PackageConfig {
  outputZipPath: string;
  seed: number;
  specVersion: string;
  effectiveConfig: any;
  files: { path: string; type: string }[]; // e.g., [{ path: 'fabric-123.svg', type: 'svg' }]
  colors?: PaletteColor[];
  includePrintSpec: boolean;
}

export interface PackageStructure {
  rootDir: string;
  assetsDir: string;
  metadataDir: string;
  manifestPath: string;
  checksumsPath: string;
  palettesDir?: string;
  printSpecPath?: string;
}

// Configurable templates for folder and file naming
const TEMPLATES = {
  rootDir: 'fabric-package-{seed}',
  assetsDir: 'assets',
  metadataDir: 'metadata',
  manifestFile: 'manifest.json',
  checksumsFile: 'checksums.sha256',
  paletteDir: 'palettes',
  printSpecFile: 'print-spec.md'
};

export async function createPackageStructure(config: PackageConfig): Promise<PackageStructure> {
  const rootDir = path.join(path.dirname(config.outputZipPath), TEMPLATES.rootDir.replace('{seed}', config.seed.toString()));
  const assetsDir = path.join(rootDir, TEMPLATES.assetsDir);
  const metadataDir = path.join(rootDir, TEMPLATES.metadataDir);
  const manifestPath = path.join(metadataDir, TEMPLATES.manifestFile);
  const checksumsPath = path.join(metadataDir, TEMPLATES.checksumsFile);

  // Create directories
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(metadataDir);

  // Copy asset files
  const fileList = [];
  const copiedFiles = [];
  for (const file of config.files) {
    const dest = path.join(assetsDir, path.basename(file.path));
    await fs.copy(file.path, dest);
    const name = path.basename(file.path);
    fileList.push({ name, type: file.type });
    copiedFiles.push(name);
  }

  // Generate manifest
  await generateManifest(config.seed, config.specVersion, config.effectiveConfig, fileList, manifestPath);

  // Generate checksums
  await generateChecksums(copiedFiles, assetsDir, checksumsPath);

  const structure: PackageStructure = {
    rootDir,
    assetsDir,
    metadataDir,
    manifestPath,
    checksumsPath
  };

  if (config.colors && config.colors.length > 0) {
    const palettesDir = path.join(metadataDir, TEMPLATES.paletteDir);
    await fs.ensureDir(palettesDir);
    await generatePalettes(config.colors, palettesDir);
    structure.palettesDir = palettesDir;
  }

  if (config.includePrintSpec) {
    structure.printSpecPath = path.join(rootDir, TEMPLATES.printSpecFile);
    // Placeholder for generating print spec
    await fs.writeFile(structure.printSpecPath, '# Print Specification\n\nTODO: Add print guidance.');
  }

  return structure;
}