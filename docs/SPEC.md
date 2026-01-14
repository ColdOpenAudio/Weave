# Specification

## Overview

## Goals

## Non-Goals

## Architecture

### Configuration Architecture and Security Rules

Configs are layered as a **base** document with optional **preset** overrides. The base file defines the complete contract; presets only override existing keys and never introduce new top-level sections.

**Merge rules (explicit):**
- Objects merge recursively by key.
- Scalars replace the base value at the same key.
- Arrays replace the base array entirely (no element-wise merging).
- Keys set to `null` in a preset are rejected (no deletion in presets).

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
- `exports.formats` : string[]
- `exports.include_metadata` : boolean
- `exports.toggles` : object with export toggles (e.g., `include_svg`, `include_png`)

### Packaging

- `packaging.mode` : string
- `packaging.bundle_name` : string

### Constraints

- `constraints.min_feature_mm` : number
- `constraints.max_shapes_per_tile` : integer

The above parameter list is kept intentionally minimal and reflects the keys used in `configs/base.json` in this repository. Unknown keys are rejected by schema validation (see `configs/schema.base.json`).

### Tile

- _No parameters defined._

### Corduroy

- _No parameters defined._

### Nap/Drift

- _No parameters defined._

### Weave

- _No parameters defined._

### Palette

- _No parameters defined._

### Exports

- _No parameters defined._

### Packaging

- _No parameters defined._

### Constraints

- _No parameters defined._

## Open Questions

## Parameter Schema

> Source of truth: No `configs/base.json` or preset files are present in the repository at this time; therefore, there are no configuration keys to enumerate. This section is intentionally empty until configuration files are added.

### Global
None.

### Naming
None.

### Tile
None.

### Corduroy
None.

### Nap/Drift
None.

### Weave
None.

### Palette
None.

### Exports
None.

### Packaging
None.

### Constraints
None.
