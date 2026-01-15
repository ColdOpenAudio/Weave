# Weave

Universal Fabric and Weave pattern design interface.

Status: interactive CLI with live preview, packaging, and export workflows in progress.

## Scripts

- `npm run typecheck`: Run the TypeScript type checker without emitting output.
- `npm run build`: Compile the TypeScript source to `dist/`.
- `npm run start`: Run the compiled CLI from `dist/index.js`.

## Quick Start

1) Build the CLI:
```bash
npm run build
```

2) Initialize a project folder (native folder picker):
```bash
node dist/index.js init
```

3) Open the interactive menu directly:
```bash
node dist/index.js menu
```

## CLI Commands

- `node dist/index.js generate --config configs/base.json --seed 123 --output-dir ./output`
- `node dist/index.js batch --config configs/base.json --seeds 1,2,3 --output-dir ./output --manifest ./output/batch-manifest.csv`
- `node dist/index.js validate --base configs/base.json`
- `node dist/index.js validate --preset configs/presets/hoodie-panel.json`
- `node dist/index.js validate --effective --base configs/base.json --preset configs/presets/hoodie-panel.json`
- `node dist/index.js package --config configs/base.json --seed 123 --output-dir ./output --include-print-spec --deterministic`

The interactive menu supports live preview; numeric fields use spacebar to preview updates and Enter to commit.
