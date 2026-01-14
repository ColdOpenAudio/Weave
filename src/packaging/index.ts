import * as fs from 'fs-extra';
import * as path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { generateManifest } from './manifest';
import { generateChecksums } from './checksums';
import { generatePalettes, PaletteColor, PaletteFormat } from './palette';

export interface PackageConfig {
  outputZipPath: string;
  seed: number;
  specVersion: string;
  effectiveConfig: any;
  files: { path: string; type: string }[]; // e.g., [{ path: 'fabric-123.svg', type: 'svg' }]
  colors?: PaletteColor[];
  paletteFormats?: PaletteFormat[];
  includePrintSpec: boolean;
  deterministic?: boolean;
  generatedAt?: string;
  cleanup?: boolean;
  templates?: Partial<PackageTemplates>;
}

export interface PackageStructure {
  rootDir: string;
  assetsDir: string;
  metadataDir: string;
  manifestPath: string;
  checksumsPath: string;
  palettesDir?: string;
  printSpecPath?: string;
  files: { path: string; type: string }[];
}

export interface PackageTemplates {
  rootDir: string;
  assetsDir: string;
  metadataDir: string;
  manifestFile: string;
  checksumsFile: string;
  paletteDir: string;
  printSpecFile: string;
}

// Configurable templates for folder and file naming
const DEFAULT_TEMPLATES: PackageTemplates = {
  rootDir: 'fabric-package-{seed}',
  assetsDir: 'assets',
  metadataDir: 'metadata',
  manifestFile: 'manifest.json',
  checksumsFile: 'checksums.sha256',
  paletteDir: 'palettes',
  printSpecFile: 'print-spec.md'
};

export async function createPackageStructure(config: PackageConfig): Promise<PackageStructure> {
  const templates = resolveTemplates(config.templates);
  const rootDirName = applyTemplate(templates.rootDir, { seed: config.seed });
  const rootDir = path.join(path.dirname(config.outputZipPath), rootDirName);
  const assetsDir = path.join(rootDir, templates.assetsDir);
  const metadataDir = path.join(rootDir, templates.metadataDir);
  const manifestPath = path.join(metadataDir, templates.manifestFile);
  const checksumsPath = path.join(metadataDir, templates.checksumsFile);

  // Create directories
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(metadataDir);

  // Copy asset files
  const fileList: { path: string; type: string }[] = [];
  const checksumFiles: string[] = [];
  for (const file of config.files) {
    const dest = path.join(assetsDir, path.basename(file.path));
    await fs.copy(file.path, dest);
    const fileName = path.basename(file.path);
    const relPath = toPosixPath(path.posix.join(templates.assetsDir, fileName));
    fileList.push({ path: relPath, type: file.type });
    checksumFiles.push(relPath);
  }

  // Generate manifest
  const generatedAt =
    config.generatedAt ?? (config.deterministic ? new Date(0).toISOString() : new Date().toISOString());

  const structure: PackageStructure = {
    rootDir,
    assetsDir,
    metadataDir,
    manifestPath,
    checksumsPath,
    files: fileList
  };

  if (config.colors && config.colors.length > 0) {
    const palettesDir = path.join(metadataDir, templates.paletteDir);
    await fs.ensureDir(palettesDir);
    await generatePalettes(config.colors, palettesDir, config.paletteFormats);
    structure.palettesDir = palettesDir;
    const paletteFormats = config.paletteFormats ?? ['ase', 'gpl', 'json'];
    for (const format of paletteFormats) {
      const relPath = toPosixPath(path.posix.join(templates.metadataDir, templates.paletteDir, `palette.${format}`));
      fileList.push({ path: relPath, type: `palette-${format}` });
      checksumFiles.push(relPath);
    }
  }

  if (config.includePrintSpec) {
    structure.printSpecPath = path.join(rootDir, templates.printSpecFile);
    const printSpecContent = buildPrintSpec(config.seed, config.specVersion, generatedAt);
    await fs.writeFile(structure.printSpecPath, printSpecContent, 'utf8');
    const relPath = toPosixPath(path.posix.join(templates.printSpecFile));
    fileList.push({ path: relPath, type: 'print-spec' });
    checksumFiles.push(relPath);
  }

  await generateManifest(config.seed, config.specVersion, config.effectiveConfig, fileList, manifestPath, generatedAt);

  const manifestRelPath = toPosixPath(path.posix.join(templates.metadataDir, templates.manifestFile));
  checksumFiles.push(manifestRelPath);
  await generateChecksums(checksumFiles, rootDir, checksumsPath);

  return structure;
}

export async function createPackageZip(
  structure: PackageStructure,
  outputZipPath: string,
  deterministic = false
): Promise<void> {
  const rootDirParent = path.dirname(structure.rootDir);
  const resolvedZipPath = path.resolve(outputZipPath);
  if (resolvedZipPath.startsWith(path.resolve(structure.rootDir) + path.sep)) {
    throw new Error('outputZipPath must not be inside the package root directory');
  }

  await fs.ensureDir(path.dirname(outputZipPath));

  const files = await collectFiles(structure.rootDir, rootDirParent);
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = createWriteStream(outputZipPath);
  const fixedDate = deterministic ? new Date(0) : new Date();

  const archiveDone = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);
  });

  archive.pipe(output);

  for (const file of files) {
    if (path.resolve(file.absPath) === resolvedZipPath) {
      continue;
    }
    archive.file(file.absPath, {
      name: toPosixPath(file.relPath),
      date: fixedDate
    });
  }

  await archive.finalize();
  await archiveDone;
}

export async function createPackage(config: PackageConfig): Promise<PackageStructure> {
  const structure = await createPackageStructure(config);
  await createPackageZip(structure, config.outputZipPath, config.deterministic ?? false);
  if (config.cleanup) {
    await fs.remove(structure.rootDir);
  }
  return structure;
}

function resolveTemplates(templates?: Partial<PackageTemplates>): PackageTemplates {
  return { ...DEFAULT_TEMPLATES, ...(templates ?? {}) };
}

function applyTemplate(template: string, values: { seed: number }): string {
  return template.replace('{seed}', values.seed.toString());
}

function buildPrintSpec(seed: number, specVersion: string, generatedAt?: string): string {
  const lines = [
    '# Print Specification',
    '',
    `Seed: ${seed}`,
    `Spec Version: ${specVersion}`,
    generatedAt ? `Generated At: ${generatedAt}` : 'Generated At: (unspecified)',
    '',
    'TODO: Add print guidance.'
  ];
  return lines.join('\n') + '\n';
}

async function collectFiles(
  rootDir: string,
  rootDirParent: string
): Promise<{ absPath: string; relPath: string }[]> {
  const files: { absPath: string; relPath: string }[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath);
      } else if (entry.isFile()) {
        const relPath = path.relative(rootDirParent, absPath);
        files.push({ absPath, relPath });
      }
    }
  }

  await walk(rootDir);
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return files;
}

function toPosixPath(inputPath: string): string {
  return inputPath.split(path.sep).join('/');
}
