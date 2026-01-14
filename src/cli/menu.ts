import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { selectProjectFolder } from './dialogs.js';
import { generateFromConfig, packageFromConfig } from './run.js';

export interface MenuOption {
  key: number;
  label: string;
}

interface MenuState {
  config: any;
  configPath: string | null;
  projectDir: string | null;
  dirty: boolean;
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
  const state: MenuState = {
    config: readJson(basePath),
    configPath: basePath,
    projectDir: options?.projectDir ?? null,
    dirty: false
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
  const options: MenuOption[] = [
    { key: 1, label: `Project name (${state.config.naming.project_name})` },
    { key: 2, label: `Version (${state.config.naming.version})` },
    { key: 3, label: `Colorway (${state.config.naming.colorway})` },
    { key: 4, label: `Pattern template (${state.config.naming.pattern})` },
    { key: 5, label: `Index padding (${state.config.naming.index_pad})` },
    { key: 6, label: 'Back' }
  ];

  while (true) {
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
        state.config.naming.index_pad = await promptNumber('Index padding', 0);
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function editTileRepeat(state: MenuState): Promise<void> {
  const options: MenuOption[] = [
    { key: 1, label: `Tile width (${state.config.tile.tile_width})` },
    { key: 2, label: `Tile height (${state.config.tile.tile_height})` },
    { key: 3, label: `Repeat X (${state.config.tile.repeat_x})` },
    { key: 4, label: `Repeat Y (${state.config.tile.repeat_y})` },
    { key: 5, label: 'Back' }
  ];

  while (true) {
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Tile & Repeat'));
    if (choice.key === 5) return;

    switch (choice.key) {
      case 1:
        state.config.tile.tile_width = await promptNumber('Tile width', 1);
        state.dirty = true;
        break;
      case 2:
        state.config.tile.tile_height = await promptNumber('Tile height', 1);
        state.dirty = true;
        break;
      case 3:
        state.config.tile.repeat_x = await promptNumber('Repeat X', 1);
        state.dirty = true;
        break;
      case 4:
        state.config.tile.repeat_y = await promptNumber('Repeat Y', 1);
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function editGenerators(state: MenuState): Promise<void> {
  const options: MenuOption[] = [
    { key: 1, label: `Corduroy enabled (${boolLabel(state.config.generators.corduroy.enabled)})` },
    { key: 2, label: `Weave enabled (${boolLabel(state.config.generators.weave.enabled)})` },
    { key: 3, label: `Palette enabled (${boolLabel(state.config.generators.palette.enabled)})` },
    { key: 4, label: 'Back' }
  ];

  while (true) {
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

  while (true) {
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
  const options: MenuOption[] = [
    { key: 1, label: `Mode (${state.config.packaging.mode})` },
    { key: 2, label: `Bundle name (${state.config.packaging.bundle_name})` },
    { key: 3, label: 'Back' }
  ];

  while (true) {
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
  const options: MenuOption[] = [
    { key: 1, label: `Min feature (mm) (${state.config.constraints.min_feature_mm})` },
    { key: 2, label: `Max shapes per tile (${state.config.constraints.max_shapes_per_tile})` },
    { key: 3, label: 'Back' }
  ];

  while (true) {
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Constraints'));
    if (choice.key === 3) return;

    switch (choice.key) {
      case 1:
        state.config.constraints.min_feature_mm = await promptNumber('Min feature (mm)', 0);
        state.dirty = true;
        break;
      case 2:
        state.config.constraints.max_shapes_per_tile = await promptNumber('Max shapes per tile', 1);
        state.dirty = true;
        break;
      default:
        break;
    }
  }
}

async function previewAndRun(state: MenuState): Promise<void> {
  const options: MenuOption[] = [
    { key: 1, label: 'Generate' },
    { key: 2, label: 'Package' },
    { key: 3, label: 'Back' }
  ];

  while (true) {
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Preview & Run'));
    if (choice.key === 3) return;

    switch (choice.key) {
      case 1:
        await runGenerate(state);
        break;
      case 2:
        await runPackage(state);
        break;
      default:
        break;
    }
  }
}

async function saveLoadMenu(state: MenuState): Promise<void> {
  const options: MenuOption[] = [
    { key: 1, label: 'Save config' },
    { key: 2, label: 'Save preset' },
    { key: 3, label: 'Load config' },
    { key: 4, label: 'Load preset' },
    { key: 5, label: `Set project folder (${state.projectDir ?? 'unset'})` },
    { key: 6, label: 'Back' }
  ];

  while (true) {
    const choice = await selectMenuOption(options, 1, buildHeader(state, 'Save / Load'));
    if (choice.key === 6) return;

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
        await loadPreset(state);
        break;
      case 5:
        await chooseProjectDir(state);
        break;
      default:
        break;
    }
  }
}

async function runGenerate(state: MenuState): Promise<void> {
  const seed = await promptNumber('Seed', 1);
  const outputDir = await promptString('Output dir', state.projectDir ?? './output');
  const exportFormat = await promptString('Export format (optional)', '');
  const colorPolicy = (await promptString('Color policy (web/print)', 'web')) as 'web' | 'print';
  const dpi = await promptNumber('DPI', 1, 300);
  const enableSeparations = await promptBoolean('Enable separations');

  await generateFromConfig(state.config, {
    seed,
    outputDir,
    exportFormat: exportFormat || undefined,
    colorPolicy,
    dpi,
    enableSeparations
  });
}

async function runPackage(state: MenuState): Promise<void> {
  const seed = await promptNumber('Seed', 1);
  const outputDir = await promptString('Output dir', state.projectDir ?? './output');
  const outputZipPath = await promptString('Output zip path', path.join(outputDir, `fabric-package-${seed}.zip`));
  const includePrintSpec = await promptBoolean('Include print spec');
  const deterministic = await promptBoolean('Deterministic');
  const cleanup = await promptBoolean('Cleanup temp folders');
  const palettePath = await promptString('Palette JSON path (optional)', '');
  const paletteFormats = await promptList('Palette formats (ase,gpl,json)', ['ase', 'gpl', 'json']);

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

async function loadPreset(state: MenuState): Promise<void> {
  const loadPath = await promptString('Load preset path', './preset.json');
  const preset = readJson(loadPath);
  state.config = { ...state.config, ...preset };
  state.dirty = true;
  console.log(`Loaded preset: ${loadPath}\n`);
}

async function chooseProjectDir(state: MenuState): Promise<void> {
  const selected = selectProjectFolder('Select or create a project folder for exports');
  state.projectDir = path.resolve(selected);
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

      if (key && /^[0-9]$/.test(key.sequence)) {
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
  return `${title}\nConfig: ${configLabel}${dirty}\nProject Dir: ${projectLabel}\n`;
}
