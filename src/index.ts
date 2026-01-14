import fs from 'fs';
import path from 'path';
import process from 'process';
import Ajv from 'ajv';
import { generateCompositeSVG } from './generators/composition.js';
import { exportComposition, ExportOptions } from './export/index.js';
import { createPackage } from './packaging/index.js';
import type { PaletteColor, PaletteFormat } from './packaging/palette.js';

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
    console.log('  node dist/index.js generate --config <configPath> --seed <number> [--output-dir <dir>] [--export <format>] [--color-policy <policy>] [--dpi <number>] [--separations]');
    console.log('  node dist/index.js package --config <configPath> --seed <number> [--output-dir <dir>] [--output-zip <path>] [--file <path>] [--palette <path>] [--palette-formats <list>] [--include-print-spec] [--deterministic] [--cleanup]');
    console.log('  node dist/index.js help');
    process.exit(0);
  }

  if (cmd === 'validate-base') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No config path provided for validate-base', 2);

    const repoRoot = process.cwd();
    const resolved = path.resolve(repoRoot, cfgArg);
    if (!resolved.startsWith(repoRoot)) fail('Config path must be inside repository', 2);

    let rawCfg: string;
    try {
      rawCfg = fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      fail(`Failed to read config: ${String(err)}`, 2);
    }

    let cfgObj: unknown;
    try {
      cfgObj = JSON.parse(rawCfg);
    } catch (err) {
      fail(`Failed to parse JSON: ${String(err)}`, 2);
    }

    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.base.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }

    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(cfgObj);
    if (!valid) {
      console.error('Config validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Config is valid according to schema.base.json');
    process.exit(0);
  }

  if (cmd === 'validate-preset') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No preset path provided for validate-preset', 2);

    const repoRoot = process.cwd();
    const resolved = path.resolve(repoRoot, cfgArg);
    if (!resolved.startsWith(repoRoot)) fail('Preset path must be inside repository', 2);

    let rawCfg: string;
    try {
      rawCfg = fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      fail(`Failed to read preset: ${String(err)}`, 2);
    }

    let cfgObj: unknown;
    try {
      cfgObj = JSON.parse(rawCfg);
    } catch (err) {
      fail(`Failed to parse JSON: ${String(err)}`, 2);
    }

    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.preset.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }

    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(cfgObj);
    if (!valid) {
      console.error('Preset validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Preset is valid according to schema.preset.json');
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

    const repoRoot = process.cwd();

    // Load base
    const baseResolved = path.resolve(repoRoot, basePath);
    if (!baseResolved.startsWith(repoRoot)) fail('Base path must be inside repository', 2);
    let baseRaw: string;
    try {
      baseRaw = fs.readFileSync(baseResolved, 'utf8');
    } catch (err) {
      fail(`Failed to read base config: ${String(err)}`, 2);
    }
    let baseObj: any;
    try {
      baseObj = JSON.parse(baseRaw);
    } catch (err) {
      fail(`Failed to parse base JSON: ${String(err)}`, 2);
    }

    // Load preset
    const presetResolved = path.resolve(repoRoot, presetPath);
    if (!presetResolved.startsWith(repoRoot)) fail('Preset path must be inside repository', 2);
    let presetRaw: string;
    try {
      presetRaw = fs.readFileSync(presetResolved, 'utf8');
    } catch (err) {
      fail(`Failed to read preset: ${String(err)}`, 2);
    }
    let presetObj: any;
    try {
      presetObj = JSON.parse(presetRaw);
    } catch (err) {
      fail(`Failed to parse preset JSON: ${String(err)}`, 2);
    }

    // Merge
    const effectiveObj = mergeConfigs(baseObj, presetObj);

    // Validate against base schema
    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.base.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }
    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(effectiveObj);
    if (!valid) {
      console.error('Effective config validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Effective config is valid according to schema.base.json');
    process.exit(0);
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
        colorPolicy = argv[i + 1] as 'web' | 'print';
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
    cfg.seed = seed;
    // Map to CompositionConfig
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

    fs.mkdirSync(outputDir, { recursive: true });
    const svgPath = path.join(outputDir, `fabric-${seed}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`Generated SVG: ${svgPath}`);

    if (exportFormat) {
      const exportOptions: ExportOptions = {
        format: exportFormat as any,
        colorPolicy,
        dpi,
        enableSeparations,
        outputDir,
        seed
      };
      await exportComposition(svg, exportOptions);
      const ext = exportFormat === 'jpg' ? 'jpg' : exportFormat;
      console.log(`Exported to ${exportFormat}: ${path.join(outputDir, `fabric-${seed}.${ext}`)}`);
    }

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

  fail(`Unknown command: ${cmd}`);
}

run().catch((e) => fail(`Unhandled error: ${String(e)}`, 99));

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
