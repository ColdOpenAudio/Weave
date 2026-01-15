import fs from 'fs';
import path from 'path';
import process from 'process';
import Ajv from 'ajv';
import { createPackage } from './packaging/index.js';
import type { PaletteColor, PaletteFormat } from './packaging/palette.js';
import { selectProjectFolder } from './cli/dialogs.js';
import { showMainMenu } from './cli/menu.js';
import { generateFromConfig } from './cli/run.js';

function fail(msg: string, code = 1): never {
  console.error(msg);
  process.exit(code);
}

function mergeConfigs(base: any, preset: any): any {
  if (typeof base !== 'object' || base === null || typeof preset !== 'object' || preset === null) {
    return preset; // scalars or arrays replace
  }
  if (Array.isArray(base) || Array.isArray(preset)) {
    return preset; // arrays replace
  }
  const result = { ...base };
  for (const key in preset) {
    if (preset[key] === null) {
      fail(`Preset cannot set key '${key}' to null (deletion not allowed)`, 2);
    }
    if (key === 'spec_version') {
      fail(`Preset cannot override 'spec_version'`, 2);
    }
    if (!(key in base)) {
      fail(`Preset cannot introduce new top-level key '${key}'`, 2);
    }
    result[key] = mergeConfigs(base[key], preset[key]);
  }
  return result;
}

async function run() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log('Usage:');
    console.log('  node dist/index.js validate-base <configPath>');
    console.log('  node dist/index.js validate-preset <presetPath>');
    console.log('  node dist/index.js validate-effective --base <basePath> --preset <presetPath>');
    console.log('  node dist/index.js validate --base <configPath>');
    console.log('  node dist/index.js validate --preset <presetPath>');
    console.log('  node dist/index.js validate --effective --base <basePath> --preset <presetPath>');
    console.log('  node dist/index.js generate --config <configPath> --seed <number> [--output-dir <dir>] [--export <format>] [--color-policy <policy>] [--dpi <number>] [--separations]');
    console.log('  node dist/index.js batch --config <configPath> --seeds <list> [--seed-file <path>] [--output-dir <dir>] [--export <format>] [--color-policy <policy>] [--dpi <number>] [--separations] [--manifest <path>]');
    console.log('  node dist/index.js init');
    console.log('  node dist/index.js menu');
    console.log('  node dist/index.js package --config <configPath> --seed <number> [--output-dir <dir>] [--output-zip <path>] [--file <path>] [--palette <path>] [--palette-formats <list>] [--include-print-spec] [--deterministic] [--cleanup]');
    console.log('  node dist/index.js help');
    process.exit(0);
  }

  if (cmd === 'validate-base') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No config path provided for validate-base', 2);
    validateBaseConfig(cfgArg);
    process.exit(0);
  }

  if (cmd === 'validate-preset') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No preset path provided for validate-preset', 2);
    validatePresetConfig(cfgArg);
    process.exit(0);
  }

  if (cmd === 'validate-effective') {
    let basePath = '';
    let presetPath = '';
    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--base' && i + 1 < argv.length) {
        basePath = argv[i + 1];
        i++;
      } else if (argv[i] === '--preset' && i + 1 < argv.length) {
        presetPath = argv[i + 1];
        i++;
      } else {
        fail(`Unknown argument: ${argv[i]}`, 2);
      }
    }
    if (!basePath || !presetPath) fail('Both --base and --preset paths are required for validate-effective', 2);

    validateEffectiveConfig(basePath, presetPath);
    process.exit(0);
  }

  if (cmd === 'validate') {
    let basePath = '';
    let presetPath = '';
    let effective = false;

    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--base' && argv[i + 1]) {
        basePath = argv[i + 1];
        i++;
      } else if (argv[i] === '--preset' && argv[i + 1]) {
        presetPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--effective') {
        effective = true;
      } else {
        fail(`Unknown argument: ${argv[i]}`, 2);
      }
    }

    if (effective) {
      if (!basePath || !presetPath) {
        fail('Both --base and --preset paths are required for --effective', 2);
      }
      validateEffectiveConfig(basePath, presetPath);
      process.exit(0);
    }

    if (basePath) {
      validateBaseConfig(basePath);
      process.exit(0);
    }

    if (presetPath) {
      validatePresetConfig(presetPath);
      process.exit(0);
    }

    fail('Provide --base or --preset (or --effective with both)', 2);
  }

  if (cmd === 'generate') {
    let configPath = '';
    let seed = 0;
    let outputDir = './output';
    let exportFormat: string | undefined;
    let colorPolicy: 'web' | 'print' = 'web';
    let dpi = 300;
    let enableSeparations = false;

    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--config' && argv[i + 1]) {
        configPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--seed' && argv[i + 1]) {
        seed = parseInt(argv[i + 1]);
        i++;
      } else if (argv[i] === '--output-dir' && argv[i + 1]) {
        outputDir = argv[i + 1];
        i++;
      } else if (argv[i] === '--export' && argv[i + 1]) {
        exportFormat = argv[i + 1];
        i++;
      } else if (argv[i] === '--color-policy' && argv[i + 1]) {
        colorPolicy = parseColorPolicy(argv[i + 1]);
        i++;
      } else if (argv[i] === '--dpi' && argv[i + 1]) {
        dpi = parseInt(argv[i + 1]);
        i++;
      } else if (argv[i] === '--separations') {
        enableSeparations = true;
      }
    }

    if (!configPath) fail('No config path provided for generate', 2);
    if (seed <= 0) fail('Seed must be a positive integer', 2);

    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    await generateFromConfig(cfg, {
      seed,
      outputDir,
      exportFormat: exportFormat || undefined,
      colorPolicy,
      dpi,
      enableSeparations
    });

    process.exit(0);
  }

  if (cmd === 'batch') {
    let configPath = '';
    let outputDir = './output';
    let exportFormat: string | undefined;
    let colorPolicy: 'web' | 'print' = 'web';
    let dpi = 300;
    let enableSeparations = false;
    let seedsArg = '';
    let seedFile = '';
    let manifestPath = '';

    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--config' && argv[i + 1]) {
        configPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--seeds' && argv[i + 1]) {
        seedsArg = argv[i + 1];
        i++;
      } else if (argv[i] === '--seed-file' && argv[i + 1]) {
        seedFile = argv[i + 1];
        i++;
      } else if (argv[i] === '--output-dir' && argv[i + 1]) {
        outputDir = argv[i + 1];
        i++;
      } else if (argv[i] === '--export' && argv[i + 1]) {
        exportFormat = argv[i + 1];
        i++;
      } else if (argv[i] === '--color-policy' && argv[i + 1]) {
        colorPolicy = parseColorPolicy(argv[i + 1]);
        i++;
      } else if (argv[i] === '--dpi' && argv[i + 1]) {
        dpi = parseInt(argv[i + 1]);
        i++;
      } else if (argv[i] === '--separations') {
        enableSeparations = true;
      } else if (argv[i] === '--manifest' && argv[i + 1]) {
        manifestPath = argv[i + 1];
        i++;
      } else {
        fail(`Unknown argument: ${argv[i]}`, 2);
      }
    }

    if (!configPath) fail('No config path provided for batch', 2);
    const seeds = parseSeedList(seedsArg, seedFile);
    if (seeds.length === 0) {
      fail('Provide --seeds or --seed-file with at least one seed', 2);
    }

    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    fs.mkdirSync(outputDir, { recursive: true });
    const manifestRows: string[] = ['seed,svg_path,export_path'];

    for (const seed of seeds) {
      const result = await generateFromConfig(cfg, {
        seed,
        outputDir,
        exportFormat: exportFormat || undefined,
        colorPolicy,
        dpi,
        enableSeparations
      });
      const exportPath = exportFormat
        ? path.join(outputDir, `fabric-${seed}.${exportFormat === 'jpg' ? 'jpg' : exportFormat}`)
        : '';
      manifestRows.push(`${seed},${result.svgPath},${exportPath}`);
    }

    const outputManifest = manifestPath || path.join(outputDir, 'batch-manifest.csv');
    fs.writeFileSync(outputManifest, `${manifestRows.join('\n')}\n`);
    console.log(`Batch manifest: ${outputManifest}`);
    process.exit(0);
  }

  if (cmd === 'package') {
    let configPath = '';
    let seed = 0;
    let outputDir = './output';
    let outputZipPath = '';
    let includePrintSpec = false;
    let deterministic = false;
    let cleanup = false;
    let palettePath = '';
    let paletteFormats: PaletteFormat[] | undefined;
    const fileArgs: string[] = [];

    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--config' && argv[i + 1]) {
        configPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--seed' && argv[i + 1]) {
        seed = parseInt(argv[i + 1]);
        i++;
      } else if (argv[i] === '--output-dir' && argv[i + 1]) {
        outputDir = argv[i + 1];
        i++;
      } else if (argv[i] === '--output-zip' && argv[i + 1]) {
        outputZipPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--file' && argv[i + 1]) {
        fileArgs.push(argv[i + 1]);
        i++;
      } else if (argv[i] === '--palette' && argv[i + 1]) {
        palettePath = argv[i + 1];
        i++;
      } else if (argv[i] === '--palette-formats' && argv[i + 1]) {
        paletteFormats = argv[i + 1].split(',').map((format) => format.trim()) as PaletteFormat[];
        i++;
      } else if (argv[i] === '--include-print-spec') {
        includePrintSpec = true;
      } else if (argv[i] === '--deterministic') {
        deterministic = true;
      } else if (argv[i] === '--cleanup') {
        cleanup = true;
      } else {
        fail(`Unknown argument: ${argv[i]}`, 2);
      }
    }

    if (!configPath) fail('No config path provided for package', 2);
    if (seed <= 0) fail('Seed must be a positive integer', 2);

    if (!outputZipPath) {
      outputZipPath = path.join(outputDir, `fabric-package-${seed}.zip`);
    }

    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const specVersion = cfg.spec_version ?? '1.0';
    const effectiveConfig = cfg;

    const files = resolvePackageFiles(outputDir, fileArgs, outputZipPath);
    if (files.length === 0) {
      fail('No files found to package. Provide --file entries or ensure --output-dir has files.', 2);
    }

    let paletteColors: PaletteColor[] | undefined;
    if (palettePath) {
      paletteColors = loadPaletteColors(palettePath);
    }

    await createPackage({
      outputZipPath,
      seed,
      specVersion,
      effectiveConfig,
      files,
      colors: paletteColors,
      paletteFormats,
      includePrintSpec,
      deterministic,
      cleanup
    });

    console.log(`Created package: ${outputZipPath}`);
    process.exit(0);
  }

  if (cmd === 'init') {
    const selected = selectProjectFolder('Select or create a project folder for exports');
    const resolved = path.resolve(selected);
    fs.mkdirSync(resolved, { recursive: true });
    console.log(`Project folder created: ${resolved}`);
    console.log(`Use this path as --output-dir for generate/package.`);
    await showMainMenu({ projectDir: resolved });
    process.exit(0);
  }

  if (cmd === 'menu') {
    await showMainMenu();
    process.exit(0);
  }

  fail(`Unknown command: ${cmd}`);
}

run().catch((e) => fail(`Unhandled error: ${String(e)}`, 99));

function parseColorPolicy(value: string): 'web' | 'print' {
  if (value === 'web' || value === 'print') {
    return value;
  }
  fail(`Invalid color policy: ${value}. Use "web" or "print".`, 2);
}

function parseSeedList(seedsArg: string, seedFile: string): number[] {
  const seeds: number[] = [];
  if (seedsArg) {
    const parts = seedsArg.split(',').map((value) => value.trim()).filter(Boolean);
    for (const part of parts) {
      const parsed = Number.parseInt(part, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        seeds.push(parsed);
      }
    }
  }
  if (seedFile) {
    const content = fs.readFileSync(seedFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        seeds.push(parsed);
      }
    }
  }
  return Array.from(new Set(seeds));
}

function validateBaseConfig(configPath: string): void {
  const repoRoot = process.cwd();
  const resolved = resolveRepoPath(repoRoot, configPath, 'Config');
  const cfgObj = readJsonFile(resolved, 'config');
  const schemaObj = readJsonFile(path.resolve(repoRoot, 'configs', 'schema.base.json'), 'schema');
  validateAgainstSchema(schemaObj, cfgObj, 'Config');
  console.log('Config is valid according to schema.base.json');
}

function validatePresetConfig(presetPath: string): void {
  const repoRoot = process.cwd();
  const resolved = resolveRepoPath(repoRoot, presetPath, 'Preset');
  const cfgObj = readJsonFile(resolved, 'preset');
  const schemaObj = readJsonFile(path.resolve(repoRoot, 'configs', 'schema.preset.json'), 'schema');
  validateAgainstSchema(schemaObj, cfgObj, 'Preset');
  console.log('Preset is valid according to schema.preset.json');
}

function validateEffectiveConfig(basePath: string, presetPath: string): void {
  const repoRoot = process.cwd();
  const baseResolved = resolveRepoPath(repoRoot, basePath, 'Base');
  const presetResolved = resolveRepoPath(repoRoot, presetPath, 'Preset');
  const baseObj = readJsonFile(baseResolved, 'base');
  const presetObj = readJsonFile(presetResolved, 'preset');
  const effectiveObj = mergeConfigs(baseObj, presetObj);
  const schemaObj = readJsonFile(path.resolve(repoRoot, 'configs', 'schema.base.json'), 'schema');
  validateAgainstSchema(schemaObj, effectiveObj, 'Effective config');
  console.log('Effective config is valid according to schema.base.json');
}

function resolveRepoPath(repoRoot: string, inputPath: string, label: string): string {
  const resolved = path.resolve(repoRoot, inputPath);
  if (!resolved.startsWith(repoRoot)) {
    fail(`${label} path must be inside repository`, 2);
  }
  return resolved;
}

function readJsonFile(filePath: string, label: string): any {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    fail(`Failed to read ${label}: ${String(err)}`, 2);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`Failed to parse ${label} JSON: ${String(err)}`, 2);
  }
}

function validateAgainstSchema(schemaObj: object, data: any, label: string): void {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schemaObj);
  const valid = validate(data);
  if (!valid) {
    console.error(`${label} validation failed:`);
    console.error(validate.errors);
    process.exit(2);
  }
}

function resolvePackageFiles(outputDir: string, fileArgs: string[], outputZipPath: string): { path: string; type: string }[] {
  const files: { path: string; type: string }[] = [];
  const resolvedZipPath = path.resolve(outputZipPath);

  if (fileArgs.length > 0) {
    for (const filePath of fileArgs) {
      const absPath = path.resolve(filePath);
      if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
        fail(`Package file not found or not a file: ${filePath}`, 2);
      }
      files.push({ path: absPath, type: inferFileType(absPath) });
    }
  } else {
    if (!fs.existsSync(outputDir)) {
      fail(`Output dir does not exist: ${outputDir}`, 2);
    }
    const entries = fs.readdirSync(outputDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const absPath = path.resolve(outputDir, entry.name);
      if (absPath === resolvedZipPath) continue;
      files.push({ path: absPath, type: inferFileType(absPath) });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function inferFileType(filePath: string): string {
  const ext = path.extname(filePath).slice(1);
  return ext ? ext.toLowerCase() : 'unknown';
}

function loadPaletteColors(palettePath: string): PaletteColor[] {
  const raw = fs.readFileSync(palettePath, 'utf8');
  const parsed = JSON.parse(raw);
  const colors = Array.isArray(parsed) ? parsed : parsed.colors;

  if (!Array.isArray(colors)) {
    fail('Palette JSON must be an array or an object with a colors array', 2);
  }

  const normalized: PaletteColor[] = colors.map((color: PaletteColor) => ({
    name: String(color.name),
    hex: String(color.hex)
  }));

  for (const color of normalized) {
    if (!color.name || !color.hex) {
      fail('Palette colors must include name and hex', 2);
    }
  }

  return normalized;
}
