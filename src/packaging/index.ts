import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

export interface PackageConfig {
  outputZipPath: string;
  seed: number;
  specVersion: string;
  effectiveConfig: any;
  files: { path: string; type: string }[]; // e.g., [{ path: 'fabric-123.svg', type: 'svg' }]
  includePrintSpec: boolean;
}

export interface PackageStructure {
  rootDir: string;
  assetsDir: string;
  metadataDir: string;
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

  // Create directories
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(metadataDir);

  // Copy asset files
  for (const file of config.files) {
    const dest = path.join(assetsDir, path.basename(file.path));
    await fs.copy(file.path, dest);
  }

  const structure: PackageStructure = {
    rootDir,
    assetsDir,
    metadataDir
  };

  if (config.includePrintSpec) {
    structure.printSpecPath = path.join(rootDir, TEMPLATES.printSpecFile);
    // Placeholder for generating print spec
    await fs.writeFile(structure.printSpecPath, '# Print Specification\n\nTODO: Add print guidance.');
  }

  return structure;
}