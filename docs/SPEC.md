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

**Fail-closed security rules:**
- Unknown keys at any level are errors (base or preset).
- Presets may only override keys that exist in the base config.
- `spec_version` must match the base value; mismatches are errors.
- The effective config must include all required blocks (`spec_version`, `naming`, `tile`, `generators`, `exports`, `packaging`) before use.

**Config files:**
- `configs/base.json` defines the required blocks and defaults.
- `configs/presets/*.json` supply minimal overrides plus a human-readable `description`.

## Data Flow

## Tile + Repeat Logic

### Canonical Tile Coordinates

- Define a single canonical tile in a 2D coordinate system with origin at the tile’s upper-left corner.
- Canonical tile width is `W` and canonical tile height is `H`.
- Pixel/point coordinates inside the canonical tile are in half-open ranges:
  - `x` in `[0, W)`
  - `y` in `[0, H)`
- A point on the left seam is any point with `x = 0`. A point on the right seam is any point with `x = W`.
- A point on the top seam is any point with `y = 0`. A point on the bottom seam is any point with `y = H`.

### X Seam Wrap Duplication Rule (Mandatory)

To guarantee seamless tiling across X:

- Duplicate all geometry that intersects the left seam (`x = 0`) to the right seam by adding `W` to its X coordinate.
- Duplicate all geometry that intersects the right seam (`x = W`) to the left seam by subtracting `W` from its X coordinate.
- “Intersects the seam” means any portion of the geometry lies on or crosses the seam line. If any part touches the seam, it must be duplicated.
- Duplication is exact: all attributes are copied; only X is offset by `±W`.
- After duplication, both seam lines render identical geometry, ensuring a seamless wrap.

### Optional Y Wrap Rule (Hoodie Panel Rationale)

The Y wrap is optional and enabled only when the target surface requires vertical tiling (e.g., a continuous fabric panel).

- If Y wrap is enabled, duplicate geometry intersecting the top seam (`y = 0`) to the bottom seam by adding `H` to Y.
- If Y wrap is enabled, duplicate geometry intersecting the bottom seam (`y = H`) to the top seam by subtracting `H` from Y.
- If Y wrap is disabled, no duplication occurs in Y; top and bottom seams may remain open.

Rationale for hoodie panels:

- Hoodie front/back panels typically have bounded top and bottom edges (neckline and hem). These edges should not wrap to each other, so Y wrap remains off by default.
- Sleeve or all-over print panels may require continuous vertical repetition; Y wrap can be enabled for those cases.

### 4-Wide Repeat Composition

Compose a 4-wide repeat by placing four tiles side-by-side along X using the canonical tile as the base unit.

- Tile indices are `i = 0, 1, 2, 3`.
- The i-th tile’s origin is offset by `(i * W, 0)` from the canonical origin.
- Any point `(x, y)` in canonical coordinates appears in the 4-wide composite at:
  - `(x + i * W, y)` for each `i` in `{0, 1, 2, 3}`.
- The composite’s total width is `4 * W` and total height is `H` (or `H` with Y wrap disabled; with Y wrap enabled, the vertical seam logic still uses `H`).

### Complexity Controls Applicability

Any complexity controls (e.g., limits on feature count, density, or detail) are enforced on the canonical tile prior to duplication and repetition.

- Seam duplications do not count as additional complexity; they are deterministic copies required for continuity.
- The 4-wide repeat is a pure replication; no additional complexity is introduced beyond the canonical tile.

## Interfaces

## Security Considerations

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
