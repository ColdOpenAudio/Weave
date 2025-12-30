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

## Interfaces

## Security Considerations

## Open Questions
