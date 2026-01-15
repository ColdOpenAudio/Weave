# Specification

## Overview

## Goals

## Non-Goals

## Architecture

### Configuration Architecture and Security Rules

Configs are layered as a **base** document with optional **preset** overrides. The base file defines the complete contract; presets only override existing keys and never introduce new top-level sections.

**Merge rules (explicit):**

- **Precedence**: Preset values override base values at the same key path. If a key is not present in the preset, the base value is used.
- **Objects**: Merge recursively by key. Nested objects are merged deeply.
- **Scalars**: Replace the base value entirely.
- **Arrays**: Replace the base array entirely (no element-wise merging).
- **Allowed override paths**: All keys defined in the base config except `spec_version` (which must remain unchanged).
- **Forbidden fields**: `spec_version` cannot be overridden. New top-level keys cannot be added. Keys set to `null` in a preset are rejected (no deletion).
- **Array policy**: Arrays are replaced wholesale; presets cannot append or modify individual array elements.

**Minimal example: base + preset → effective config**

Base config:
```json
{
  "spec_version": "1.0",
  "naming": { "project_name": "weave", "version": "1.0" },
  "exports": { "formats": ["svg"] }
}
```

Preset:
```json
{
  "naming": { "version": "2.0" },
  "exports": { "formats": ["png"] }
}
```

Effective config (after merge):
```json
{
  "spec_version": "1.0",
  "naming": { "project_name": "weave", "version": "2.0" },
  "exports": { "formats": ["png"] }
}
```

### Parameter Schema

This section enumerates the configuration parameters present in `configs/base.json` and used by presets. The base configuration defines the contract; presets may only override existing keys.

### Global

- `spec_version` : string

### Naming

- `naming.project_name` : string
- `naming.version` : string
- `naming.colorway` : string (optional)
- `naming.pattern` : string
- `naming.index_pad` : integer (optional)

### Tile

- `tile.tile_width` : number (units: mm or as documented)
- `tile.tile_height` : number
- `tile.repeat_x` : integer (const 4)
- `tile.repeat_y` : integer (optional)

### Generators

- `generators.corduroy` / `generators.weave` / `generators.palette`: objects with `type` (string) and `enabled` (boolean)

### Exports

- `exports.preset` : string (preset selector)
- `exports.formats` : string[] (allowed: `svg`, `pdf`, `eps`, `tiff`, `png`, `jpg`, `webp`)
- `exports.include_metadata` : boolean
- `exports.toggles` : object with export toggles (e.g., `include_svg`, `include_png`)

### Packaging

- `packaging.mode` : string
- `packaging.bundle_name` : string

### Constraints

- `constraints.min_feature_mm` : number
- `constraints.max_shapes_per_tile` : integer

The above parameter list is kept intentionally minimal and reflects the keys used in `configs/base.json` in this repository. Unknown keys are rejected by schema validation (see `configs/schema.base.json`).

## Production Guidance

- **Bleed**: Include 3-5 mm bleed beyond the final cut edge for printed outputs.
- **Safe zone**: Keep critical details at least 5 mm inside trim lines.
- **Resolution**: Target 300 DPI for print exports; use higher for fine detail if needed.
- **Color policy**: Use `web` for screen proofs and `print` for production exports with ICC workflow.
- **Production exports**: Target `pdf`, `eps`, and `tiff` for print-ready delivery. EPS requires Ghostscript (`gs`) on PATH.

## Preset Examples

### Hoodie Panel (repeat across width only)

```json
{
  "tile": { "repeat_x": 4, "repeat_y": 1 },
  "exports": { "preset": "hoodie-panel", "formats": ["svg", "pdf"] }
}
```

### All-Over Print (full repeat)

```json
{
  "tile": { "repeat_x": 4, "repeat_y": 4 },
  "exports": { "preset": "all-over-print", "formats": ["svg", "tiff", "png"] }
}
```
