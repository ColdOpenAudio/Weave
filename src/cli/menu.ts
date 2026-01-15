import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { selectProjectFolder } from './dialogs.js';
import { generateFromConfig, packageFromConfig } from './run.js';
import type { GenerateRunOptions, GenerateResult } from './run.js';
import { startPreviewServer } from './preview.js';
import type { PaletteFormat } from '../packaging/palette.js';

export interface MenuOption {
  key: number;
  label: string;
}

interface MenuState {
  config: any;
  configPath: string | null;
  projectDir: string | null;
  dirty: boolean;
  presets: PresetRegistry;
  preview: PreviewSettings;
  previewServer: PreviewServerState | null;
  previewInFlight: boolean;
  previewQueuedConfig: any | null;
  previewOverrides: Record<string, PreviewOverride>;
}

interface PresetRegistry {
  paths: string[];
  defaultPath: string | null;
}

interface PreviewSettings {
  enabled: boolean;
  intervalMs: number;
  seed: number;
  outputDir: string;
  exportFormat?: string;
  colorPolicy: 'web' | 'print';
  dpi: number;
  enableSeparations: boolean;
}

interface PreviewServerState {
  url: string;
  notify: (filePath: string) => void;
}

interface PreviewOverride {
  step: number;
  intervalMs: number;
}

const MAIN_MENU_OPTIONS: MenuOption[] = [
  { key: 1, label: 'Project & Naming' },
  { key: 2, label: 'Tile & Repeat' },
  { key: 3, label: 'Generators' },
  { key: 4, label: 'Exports' },
  { key: 5, label: 'Packaging' },
  { key: 6, label: 'Constraints' },
  { key: 7, label: 'Preview & Run' },
  { key: 8, label: 'Save / Load' },
  { key: 9, label: 'Exit' }
];

export async function showMainMenu(options?: { projectDir?: string }): Promise<void> {
  const basePath = path.resolve(process.cwd(), 'configs', 'base.json');
  const presets = loadPresetRegistry(options?.projectDir ?? null);
  const preview: PreviewSettings = {
    enabled: true,
    intervalMs: 0,
    seed: 1,
    outputDir: options?.projectDir ?? './output',
    colorPolicy: 'web',
    dpi: 300,
    enableSeparations: false
  };
  const state: MenuState = {
    config: readJson(basePath),
    configPath: basePath,
    projectDir: options?.projectDir ?? null,
    dirty: false,
    presets,
    preview,
    previewServer: null,
    previewInFlight: false,
    previewQueuedConfig: null,
    previewOverrides: {}
  };

  while (true) {
    const header = buildHeader(state, 'Main Menu');
    const choice = await selectMenuOption(MAIN_MENU_OPTIONS, 3, header);

    switch (choice.key) {
      case 1:
        await editProjectNaming(state);
        break;
      case 2:
        await editTileRepeat(state);
        break;
      case 3:
        await editGenerators(state);
        break;
      case 4:
        await editExports(state);
        break;
      case 5:
        await editPackaging(state);
        break;
      case 6:
        await editConstraints(state);
        break;
      case 7:
        await previewAndRun(state);
        break;
      case 8:
        await saveLoadMenu(state);
        break;
      case 9:
        console.log('Goodbye.');
        return;
      default:
        break;
    }
  }
}

async function editProjectNaming(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Project name (${state.config.naming.project_name})` },
      { key: 2, label: `Version (${state.config.naming.version})` },
      { key: 3, label: `Colorway (${state.config.naming.colorway})` },
      { key: 4, label: `Pattern template (${state.config.naming.pattern})` },
      { key: 5, label: `Index padding (${state.config.naming.index_pad})` },
      { key: 6, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Project & Naming'));
    if (choice.key === 6) return;

    switch (choice.key) {
      case 1:
        state.config.naming.project_name = await promptString('Project name');
        state.dirty = true;
        break;
      case 2:
        state.config.naming.version = await promptString('Version');
        state.dirty = true;
        break;
      case 3:
        state.config.naming.colorway = await promptString('Colorway');
        state.dirty = true;
        break;
      case 4:
        state.config.naming.pattern = await promptString('Pattern template');
        state.dirty = true;
        break;
      case 5:
        await updateNumberField(state, 'Index padding', 0, () => state.config.naming.index_pad, (cfg, value) => {
          cfg.naming.index_pad = value;
        });
        break;
      default:
        break;
    }
  }
}

async function editTileRepeat(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Tile width (${state.config.tile.tile_width})` },
      { key: 2, label: `Tile height (${state.config.tile.tile_height})` },
      { key: 3, label: `Repeat X (${state.config.tile.repeat_x})` },
      { key: 4, label: `Repeat Y (${state.config.tile.repeat_y})` },
      { key: 5, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Tile & Repeat'));
    if (choice.key === 5) return;

    switch (choice.key) {
      case 1:
        await updateNumberField(state, 'Tile width', 1, () => state.config.tile.tile_width, (cfg, value) => {
          cfg.tile.tile_width = value;
        });
        break;
      case 2:
        await updateNumberField(state, 'Tile height', 1, () => state.config.tile.tile_height, (cfg, value) => {
          cfg.tile.tile_height = value;
        });
        break;
      case 3:
        await updateNumberField(state, 'Repeat X', 1, () => state.config.tile.repeat_x, (cfg, value) => {
          cfg.tile.repeat_x = value;
        });
        break;
      case 4:
        await updateNumberField(state, 'Repeat Y', 1, () => state.config.tile.repeat_y, (cfg, value) => {
          cfg.tile.repeat_y = value;
        });
        break;
      default:
        break;
    }
  }
}

async function editGenerators(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Corduroy enabled (${boolLabel(state.config.generators.corduroy.enabled)})` },
      { key: 2, label: `Weave enabled (${boolLabel(state.config.generators.weave.enabled)})` },
      { key: 3, label: `Palette enabled (${boolLabel(state.config.generators.palette.enabled)})` },
      { key: 4, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Generators'));
    if (choice.key === 4) return;

    switch (choice.key) {
      case 1:
        state.config.generators.corduroy.enabled = await promptBoolean('Corduroy enabled');
        state.dirty = true;
        break;
      case 2:
        state.config.generators.weave.enabled = await promptBoolean('Weave enabled');
        state.dirty = true;
        break;
      case 3:
        state.config.generators.palette.enabled = await promptBoolean('Palette enabled');
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function editExports(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Preset (${state.config.exports.preset})` },
      { key: 2, label: `Formats (${state.config.exports.formats.join(', ') || 'none'})` },
      { key: 3, label: `Include metadata (${boolLabel(state.config.exports.include_metadata)})` },
      {
        key: 4,
        label: `Include SVG (${boolLabel(state.config.exports.toggles.include_svg)})`
      },
      {
        key: 5,
        label: `Include PNG (${boolLabel(state.config.exports.toggles.include_png)})`
      },
      { key: 6, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Exports'));
    if (choice.key === 6) return;

    switch (choice.key) {
      case 1:
        state.config.exports.preset = await promptString('Preset');
        state.dirty = true;
        break;
      case 2:
        state.config.exports.formats = await promptList('Formats (comma-separated)');
        state.dirty = true;
        break;
      case 3:
        state.config.exports.include_metadata = await promptBoolean('Include metadata');
        state.dirty = true;
        break;
      case 4:
        state.config.exports.toggles.include_svg = await promptBoolean('Include SVG');
        state.dirty = true;
        break;
      case 5:
        state.config.exports.toggles.include_png = await promptBoolean('Include PNG');
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function editPackaging(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Mode (${state.config.packaging.mode})` },
      { key: 2, label: `Bundle name (${state.config.packaging.bundle_name})` },
      { key: 3, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Packaging'));
    if (choice.key === 3) return;

    switch (choice.key) {
      case 1:
        state.config.packaging.mode = await promptString('Mode');
        state.dirty = true;
        break;
      case 2:
        state.config.packaging.bundle_name = await promptString('Bundle name');
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function editConstraints(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: `Min feature (mm) (${state.config.constraints.min_feature_mm})` },
      { key: 2, label: `Max shapes per tile (${state.config.constraints.max_shapes_per_tile})` },
      { key: 3, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Constraints'));
    if (choice.key === 3) return;

    switch (choice.key) {
      case 1:
        await updateNumberField(
          state,
          'Min feature (mm)',
          0,
          () => state.config.constraints.min_feature_mm,
          (cfg, value) => {
            cfg.constraints.min_feature_mm = value;
          }
        );
        break;
      case 2:
        await updateNumberField(
          state,
          'Max shapes per tile',
          1,
          () => state.config.constraints.max_shapes_per_tile,
          (cfg, value) => {
            cfg.constraints.max_shapes_per_tile = value;
          }
        );
        break;
      default:
        break;
    }
  }
}

async function previewAndRun(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: 'Generate' },
      { key: 2, label: 'Package' },
      { key: 3, label: `Live preview (${boolLabel(state.preview.enabled)})` },
      { key: 4, label: `Preview interval ms (${state.preview.intervalMs})` },
      { key: 5, label: `Preview seed (${state.preview.seed})` },
      { key: 6, label: `Preview output dir (${state.preview.outputDir})` },
      {
        key: 7,
        label: `Preview format (${state.preview.exportFormat ?? 'none'})`
      },
      { key: 8, label: `Preview color policy (${state.preview.colorPolicy})` },
      { key: 9, label: `Preview DPI (${state.preview.dpi})` },
      {
        key: 10,
        label: `Preview separations (${boolLabel(state.preview.enableSeparations)})`
      },
      { key: 11, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Preview & Run'));
    if (choice.key === 11) return;

    switch (choice.key) {
      case 1:
        await runGenerate(state);
        break;
      case 2:
        await runPackage(state);
        break;
      case 3:
        state.preview.enabled = await promptBoolean('Live preview enabled');
        break;
      case 4:
        state.preview.intervalMs = await promptNumber('Preview interval ms', 0, state.preview.intervalMs);
        break;
      case 5:
        state.preview.seed = await promptNumber('Preview seed', 1, state.preview.seed);
        break;
      case 6:
        state.preview.outputDir = await promptString('Preview output dir', state.preview.outputDir);
        break;
      case 7: {
        const format = await promptString('Preview format (optional)', state.preview.exportFormat ?? '');
        state.preview.exportFormat = format || undefined;
        break;
      }
      case 8:
        state.preview.colorPolicy = (await promptString('Preview color policy (web/print)', state.preview.colorPolicy)) as
          | 'web'
          | 'print';
        break;
      case 9:
        state.preview.dpi = await promptNumber('Preview DPI', 1, state.preview.dpi);
        break;
      case 10:
        state.preview.enableSeparations = await promptBoolean('Preview separations');
        break;
      default:
        break;
    }
  }
}

async function saveLoadMenu(state: MenuState): Promise<void> {
  while (true) {
    const options: MenuOption[] = [
      { key: 1, label: 'Save config' },
      { key: 2, label: 'Save preset' },
      { key: 3, label: 'Load config' },
      { key: 4, label: 'Add preset file' },
      { key: 5, label: 'Load preset from list' },
      { key: 6, label: 'Set default preset' },
      { key: 7, label: 'Remove preset from list' },
      { key: 8, label: `Set project folder (${state.projectDir ?? 'unset'})` },
      { key: 9, label: 'Back' }
    ];
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Save / Load'));
    if (choice.key === 9) return;

    switch (choice.key) {
      case 1:
        await saveConfig(state);
        break;
      case 2:
        await savePreset(state);
        break;
      case 3:
        await loadConfig(state);
        break;
      case 4:
        await addPresetPath(state);
        break;
      case 5:
        await loadPresetFromList(state);
        break;
      case 6:
        await setDefaultPreset(state);
        break;
      case 7:
        await removePresetFromList(state);
        break;
      case 8:
        await chooseProjectDir(state);
        break;
      default:
        break;
    }
  }
}

async function runGenerate(state: MenuState): Promise<void> {
  const seed = await promptNumber('Seed', 1, state.preview.seed);
  const outputDir = await promptString('Output dir', state.preview.outputDir);
  const exportFormat = await promptString('Export format (optional)', '');
  const colorPolicy = (await promptString('Color policy (web/print)', state.preview.colorPolicy)) as 'web' | 'print';
  const dpi = await promptNumber('DPI', 1, state.preview.dpi);
  const enableSeparations = await promptBoolean('Enable separations');

  const result = await generateFromConfig(state.config, {
    seed,
    outputDir,
    exportFormat: exportFormat || undefined,
    colorPolicy,
    dpi,
    enableSeparations
  });

  state.preview.seed = seed;
  state.preview.outputDir = outputDir;
  state.preview.exportFormat = exportFormat || undefined;
  state.preview.colorPolicy = colorPolicy;
  state.preview.dpi = dpi;
  state.preview.enableSeparations = enableSeparations;

  if (state.preview.enabled) {
    await notifyPreview(state, result.svgPath);
  }
}

async function runPackage(state: MenuState): Promise<void> {
  const seed = await promptNumber('Seed', 1);
  const outputDir = await promptString('Output dir', state.projectDir ?? './output');
  const outputZipPath = await promptString('Output zip path', path.join(outputDir, `fabric-package-${seed}.zip`));
  const includePrintSpec = await promptBoolean('Include print spec');
  const deterministic = await promptBoolean('Deterministic');
  const cleanup = await promptBoolean('Cleanup temp folders');
  const palettePath = await promptString('Palette JSON path (optional)', '');
  const paletteFormats = parsePaletteFormats(
    await promptList('Palette formats (ase,gpl,json)', ['ase', 'gpl', 'json'])
  );

  await packageFromConfig(state.config, {
    seed,
    outputDir,
    outputZipPath,
    includePrintSpec,
    deterministic,
    cleanup,
    palettePath: palettePath || undefined,
    paletteFormats
  });
}

async function saveConfig(state: MenuState): Promise<void> {
  const savePath = await promptString('Save config path', state.configPath ?? './config.json');
  fs.writeFileSync(savePath, JSON.stringify(state.config, null, 2));
  state.configPath = savePath;
  state.dirty = false;
  console.log(`Saved config: ${savePath}\n`);
}

async function savePreset(state: MenuState): Promise<void> {
  const savePath = await promptString('Save preset path', './preset.json');
  const preset = JSON.parse(JSON.stringify(state.config));
  delete preset.spec_version;
  fs.writeFileSync(savePath, JSON.stringify(preset, null, 2));
  console.log(`Saved preset: ${savePath}\n`);
}

async function loadConfig(state: MenuState): Promise<void> {
  const loadPath = await promptString('Load config path', state.configPath ?? './config.json');
  state.config = readJson(loadPath);
  state.configPath = loadPath;
  state.dirty = false;
  console.log(`Loaded config: ${loadPath}\n`);
}

async function chooseProjectDir(state: MenuState): Promise<void> {
  const selected = selectProjectFolder('Select or create a project folder for exports');
  state.projectDir = path.resolve(selected);
  state.preview.outputDir = state.projectDir;
  state.presets = loadPresetRegistry(state.projectDir);
  console.log(`Project folder set: ${state.projectDir}\n`);
}

async function selectMenuOption(options: MenuOption[], columns: number, header?: string): Promise<MenuOption> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  readline.emitKeypressEvents(process.stdin, rl);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const rows = Math.ceil(options.length / columns);
  let selectedIndex = 0;

  const cleanup = () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    rl.close();
  };

  const render = () => {
    process.stdout.write('\x1b[2J\x1b[0f');
    if (header) {
      process.stdout.write(`${header}\n`);
    }
    process.stdout.write(renderMenu(options, columns, selectedIndex));
    process.stdout.write('Use arrows or numbers, Enter to select.\n');
  };

  return new Promise((resolve) => {
    const onKeypress = (_: string, key: readline.Key) => {
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
      }
      if (key && key.name === 'up') {
        selectedIndex = moveIndex(selectedIndex, options.length, columns, -1, 0);
        render();
        return;
      }
      if (key && key.name === 'down') {
        selectedIndex = moveIndex(selectedIndex, options.length, columns, 1, 0);
        render();
        return;
      }
      if (key && key.name === 'left') {
        selectedIndex = moveIndex(selectedIndex, options.length, columns, 0, -1);
        render();
        return;
      }
      if (key && key.name === 'right') {
        selectedIndex = moveIndex(selectedIndex, options.length, columns, 0, 1);
        render();
        return;
      }
      if (key && key.name === 'return') {
        process.stdin.off('keypress', onKeypress);
        cleanup();
        resolve(options[selectedIndex]);
        return;
      }

      if (key && key.name === 'space') {
        process.stdin.off('keypress', onKeypress);
        cleanup();
        resolve(options[selectedIndex]);
        return;
      }

      if (key && key.sequence && /^[0-9]$/.test(key.sequence)) {
        const numeric = Number.parseInt(key.sequence, 10);
        const option = options.find((item) => item.key === numeric);
        if (option) {
          process.stdin.off('keypress', onKeypress);
          cleanup();
          resolve(option);
        }
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

function moveIndex(index: number, length: number, columns: number, rowDelta: number, colDelta: number): number {
  const rows = Math.ceil(length / columns);
  const position = indexToPosition(index, rows);
  const nextRow = clamp(position.row + rowDelta, 0, rows - 1);
  const nextCol = clamp(position.col + colDelta, 0, columns - 1);
  const nextIndex = positionToIndex(nextRow, nextCol, rows);

  if (nextIndex >= length) {
    return index;
  }
  return nextIndex;
}

function indexToPosition(index: number, rows: number): { row: number; col: number } {
  return { row: index % rows, col: Math.floor(index / rows) };
}

function positionToIndex(row: number, col: number, rows: number): number {
  return row + col * rows;
}

function renderMenu(options: MenuOption[], columns: number, selectedIndex: number): string {
  const rows = Math.ceil(options.length / columns);
  const columnWidths: number[] = [];

  for (let col = 0; col < columns; col++) {
    let maxWidth = 0;
    for (let row = 0; row < rows; row++) {
      const index = row + col * rows;
      const option = options[index];
      if (!option) continue;
      const label = formatOption(option);
      maxWidth = Math.max(maxWidth, label.length);
    }
    columnWidths[col] = maxWidth;
  }

  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    const cells: string[] = [];
    for (let col = 0; col < columns; col++) {
      const index = row + col * rows;
      const option = options[index];
      if (!option) {
        cells.push(''.padEnd(columnWidths[col]));
        continue;
      }
      const rawLabel = formatOption(option);
      const padded = rawLabel.padEnd(columnWidths[col]);
      const label = index === selectedIndex ? `\x1b[7m${padded}\x1b[0m` : padded;
      cells.push(label);
    }
    lines.push(cells.join('   ').trimEnd());
  }

  return `${lines.join('\n')}\n`;
}

function formatOption(option: MenuOption): string {
  return `${option.key}) ${option.label}`;
}

function promptString(label: string, fallback?: string): Promise<string> {
  return promptLine(`${label}${fallback ? ` [${fallback}]` : ''}: `).then((value) => value || fallback || '');
}

async function promptNumber(label: string, min: number, fallback?: number): Promise<number> {
  while (true) {
    const raw = await promptLine(`${label}${fallback !== undefined ? ` [${fallback}]` : ''}: `);
    const parsed = raw ? Number.parseFloat(raw) : fallback;
    if (parsed !== undefined && !Number.isNaN(parsed) && parsed >= min) {
      return parsed;
    }
    console.log(`Invalid number. Must be >= ${min}.\n`);
  }
}

async function promptBoolean(label: string): Promise<boolean> {
  const raw = await promptLine(`${label} (y/n): `);
  if (!raw) return false;
  return raw.toLowerCase().startsWith('y');
}

async function promptList(label: string, fallback?: string[]): Promise<string[]> {
  const raw = await promptLine(`${label}${fallback ? ` [${fallback.join(', ')}]` : ''}: `);
  const text = raw.trim();
  if (!text) return fallback ?? [];
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function promptLine(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function updateNumberField(
  state: MenuState,
  label: string,
  min: number,
  getValue: () => number,
  setValue: (config: any, value: number) => void
): Promise<void> {
  const current = getValue();
  const result = await promptNumberLive(label, min, current, state, async (draft) => {
    if (!state.preview.enabled) {
      return;
    }
    const draftConfig = cloneConfig(state.config);
    setValue(draftConfig, draft);
    await queuePreview(state, draftConfig);
  });
  setValue(state.config, result);
  state.dirty = true;
  if (state.preview.enabled) {
    await queuePreview(state, state.config);
  }
}

async function promptNumberLive(
  label: string,
  min: number,
  fallback: number,
  state: MenuState,
  onPreview: (draft: number) => Promise<void>
): Promise<number> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    readline.emitKeypressEvents(process.stdin, rl);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    let buffer = String(fallback);
    let timer: NodeJS.Timeout | null = null;
    let step = getPreviewStep(state, label);
    let intervalMs = getPreviewInterval(state, label);
    let inOverridePrompt = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.off('keypress', onKeypress);
      rl.close();
    };

    const render = () => {
      process.stdout.write('\x1b[2J\x1b[0f');
      process.stdout.write(
        `${label}\nValue: ${buffer}\nSpace = preview, Enter = save, Esc = cancel, Up/Down = nudge\n`
      );
      if (state.preview.enabled) {
        process.stdout.write(`Step: ${step} | Interval: ${intervalMs} ms | Press s/i to adjust\n`);
      } else {
        process.stdout.write('Preview disabled\n');
      }
    };

    const schedulePreview = (draft: number) => {
      if (!state.preview.enabled || intervalMs <= 0) {
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onPreview(draft).catch(() => undefined);
      }, intervalMs);
    };

    const commit = () => {
      const parsed = Number.parseFloat(buffer);
      if (!Number.isNaN(parsed) && parsed >= min) {
        cleanup();
        resolve(parsed);
      } else {
        process.stdout.write(`\nInvalid number. Must be >= ${min}.\n`);
        setTimeout(render, 500);
      }
    };

    const cancel = () => {
      cleanup();
      resolve(fallback);
    };

    const onKeypress = async (_: string, key: readline.Key) => {
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
      }

      if (inOverridePrompt) {
        return;
      }

      if (key && key.name === 'return') {
        commit();
        return;
      }
      if (key && key.name === 'escape') {
        cancel();
        return;
      }
      if (key && key.name === 'space') {
        const parsed = Number.parseFloat(buffer);
        if (!Number.isNaN(parsed) && parsed >= min) {
          onPreview(parsed).catch(() => undefined);
        }
        return;
      }
      if (key && key.name === 'up') {
        const parsed = Number.parseFloat(buffer) || 0;
        buffer = String(parsed + step);
        render();
        schedulePreview(parsed + step);
        return;
      }
      if (key && key.name === 'down') {
        const parsed = Number.parseFloat(buffer) || 0;
        const next = Math.max(min, parsed - step);
        buffer = String(next);
        render();
        schedulePreview(next);
        return;
      }
      if (key && key.name === 'backspace') {
        buffer = buffer.slice(0, -1) || '0';
        render();
        const parsed = Number.parseFloat(buffer);
        if (!Number.isNaN(parsed)) {
          schedulePreview(parsed);
        }
        return;
      }

      if (key && key.sequence && /^[0-9.]$/.test(key.sequence)) {
        buffer = buffer === '0' ? key.sequence : `${buffer}${key.sequence}`;
        render();
        const parsed = Number.parseFloat(buffer);
        if (!Number.isNaN(parsed)) {
          schedulePreview(parsed);
        }
      }

      if (key && key.name === 's') {
        inOverridePrompt = true;
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        const nextStep = await promptLine(`Step size (current ${step}, empty to reset): `);
        if (!nextStep) {
          clearPreviewOverride(state, label);
        } else {
          const parsed = Number.parseFloat(nextStep);
          if (!Number.isNaN(parsed) && parsed > 0) {
            setPreviewOverride(state, label, { step: parsed, intervalMs });
          }
        }
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        step = getPreviewStep(state, label);
        intervalMs = getPreviewInterval(state, label);
        inOverridePrompt = false;
        render();
        return;
      }

      if (key && key.name === 'i') {
        inOverridePrompt = true;
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        const nextInterval = await promptLine(`Interval ms (current ${intervalMs}, empty to reset): `);
        if (!nextInterval) {
          clearPreviewOverride(state, label);
        } else {
          const parsed = Number.parseFloat(nextInterval);
          if (!Number.isNaN(parsed) && parsed >= 0) {
            setPreviewOverride(state, label, { step, intervalMs: parsed });
          }
        }
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        step = getPreviewStep(state, label);
        intervalMs = getPreviewInterval(state, label);
        inOverridePrompt = false;
        render();
        return;
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

function cloneConfig(config: any): any {
  return JSON.parse(JSON.stringify(config));
}

async function queuePreview(state: MenuState, configOverride: any): Promise<void> {
  if (state.previewInFlight) {
    state.previewQueuedConfig = configOverride;
    return;
  }
  state.previewInFlight = true;
  try {
    const result = await runPreview(state, configOverride);
    if (result?.svgPath) {
      await notifyPreview(state, result.svgPath);
    }
  } finally {
    state.previewInFlight = false;
    if (state.previewQueuedConfig) {
      const queued = state.previewQueuedConfig;
      state.previewQueuedConfig = null;
      await queuePreview(state, queued);
    }
  }
}

async function runPreview(state: MenuState, configOverride: any): Promise<GenerateResult | null> {
  if (!state.preview.enabled) {
    return null;
  }
  const options: GenerateRunOptions = {
    seed: state.preview.seed,
    outputDir: state.preview.outputDir,
    exportFormat: state.preview.exportFormat,
    colorPolicy: state.preview.colorPolicy,
    dpi: state.preview.dpi,
    enableSeparations: state.preview.enableSeparations
  };
  return generateFromConfig(configOverride, options);
}

async function notifyPreview(state: MenuState, svgPath: string): Promise<void> {
  if (!state.preview.enabled) {
    return;
  }
  if (!state.previewServer) {
    const server = await startPreviewServer({ initialFile: svgPath, openBrowser: true });
    state.previewServer = { url: server.url, notify: server.notify };
    console.log(`Preview server: ${server.url}`);
  }
  state.previewServer.notify(svgPath);
}

function readJson(filePath: string): any {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function boolLabel(value: boolean): string {
  return value ? 'on' : 'off';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildHeader(state: MenuState, title: string): string {
  const configLabel = state.configPath ?? 'unsaved';
  const projectLabel = state.projectDir ?? 'unset';
  const dirty = state.dirty ? '*' : '';
  const defaultPreset = state.presets.defaultPath ? path.basename(state.presets.defaultPath) : 'none';
  return `${title}\nConfig: ${configLabel}${dirty}\nProject Dir: ${projectLabel}\nDefault Preset: ${defaultPreset}\n`;
}

function getPreviewStep(state: MenuState, label: string): number {
  const override = state.previewOverrides[label];
  return override?.step ?? 1;
}

function getPreviewInterval(state: MenuState, label: string): number {
  const override = state.previewOverrides[label];
  return override?.intervalMs ?? state.preview.intervalMs;
}

function setPreviewOverride(state: MenuState, label: string, override: PreviewOverride): void {
  state.previewOverrides[label] = override;
}

function clearPreviewOverride(state: MenuState, label: string): void {
  delete state.previewOverrides[label];
}

function parsePaletteFormats(formats: string[]): PaletteFormat[] {
  const allowed: PaletteFormat[] = ['ase', 'gpl', 'json'];
  return formats.filter((format): format is PaletteFormat => allowed.includes(format as PaletteFormat));
}

async function addPresetPath(state: MenuState): Promise<void> {
  if (!ensureProjectDir(state)) return;
  const loadPath = await promptString('Preset file path', './preset.json');
  const resolved = path.resolve(loadPath);
  if (!fs.existsSync(resolved)) {
    console.log(`Preset not found: ${resolved}\n`);
    return;
  }
  if (!state.presets.paths.includes(resolved)) {
    state.presets.paths.push(resolved);
  }
  savePresetRegistry(state);
  console.log(`Added preset: ${resolved}\n`);
}

async function loadPresetFromList(state: MenuState): Promise<void> {
  if (!ensureProjectDir(state)) return;
  if (state.presets.paths.length === 0) {
    console.log('No presets registered.\n');
    return;
  }
  const options = state.presets.paths.map((presetPath, index) => ({
    key: index + 1,
    label: `${path.basename(presetPath)}${presetPath === state.presets.defaultPath ? ' (default)' : ''}`
  }));
  const choice = await selectMenuOption(options, 1, buildHeader(state, 'Load Preset'));
  const selectedPath = state.presets.paths[choice.key - 1];
  if (selectedPath) {
    loadPresetIntoConfig(state, selectedPath);
  }
}

async function setDefaultPreset(state: MenuState): Promise<void> {
  if (!ensureProjectDir(state)) return;
  if (state.presets.paths.length === 0) {
    console.log('No presets registered.\n');
    return;
  }
  const options = state.presets.paths.map((presetPath, index) => ({
    key: index + 1,
    label: path.basename(presetPath)
  }));
  const choice = await selectMenuOption(options, 1, buildHeader(state, 'Set Default Preset'));
  const selectedPath = state.presets.paths[choice.key - 1];
  if (selectedPath) {
    state.presets.defaultPath = selectedPath;
    savePresetRegistry(state);
    console.log(`Default preset set: ${selectedPath}\n`);
  }
}

async function removePresetFromList(state: MenuState): Promise<void> {
  if (!ensureProjectDir(state)) return;
  if (state.presets.paths.length === 0) {
    console.log('No presets registered.\n');
    return;
  }
  const options = state.presets.paths.map((presetPath, index) => ({
    key: index + 1,
    label: path.basename(presetPath)
  }));
  const choice = await selectMenuOption(options, 1, buildHeader(state, 'Remove Preset'));
  const removed = state.presets.paths.splice(choice.key - 1, 1)[0];
  if (removed && state.presets.defaultPath === removed) {
    state.presets.defaultPath = null;
  }
  savePresetRegistry(state);
  console.log(`Removed preset: ${removed}\n`);
}

function loadPresetIntoConfig(state: MenuState, presetPath: string): void {
  const preset = readJson(presetPath);
  state.config = { ...state.config, ...preset };
  state.dirty = true;
  console.log(`Loaded preset: ${presetPath}\n`);
}

function ensureProjectDir(state: MenuState): boolean {
  if (!state.projectDir) {
    console.log('Project directory is not set. Use "Set project folder" first.\n');
    return false;
  }
  return true;
}

function loadPresetRegistry(projectDir: string | null): PresetRegistry {
  if (!projectDir) {
    return { paths: [], defaultPath: null };
  }
  const registryPath = presetRegistryPath(projectDir);
  if (!fs.existsSync(registryPath)) {
    return { paths: [], defaultPath: null };
  }
  try {
    const data = readJson(registryPath);
    const paths = Array.isArray(data.presets) ? data.presets.map((entry: string) => path.resolve(entry)) : [];
    const defaultPath = typeof data.default === 'string' ? path.resolve(data.default) : null;
    return { paths, defaultPath };
  } catch {
    return { paths: [], defaultPath: null };
  }
}

function savePresetRegistry(state: MenuState): void {
  if (!state.projectDir) {
    return;
  }
  const registryPath = presetRegistryPath(state.projectDir);
  const payload = {
    presets: state.presets.paths,
    default: state.presets.defaultPath
  };
  fs.writeFileSync(registryPath, JSON.stringify(payload, null, 2));
}

function presetRegistryPath(projectDir: string): string {
  return path.join(projectDir, '.weave-presets.json');
}
