# TODO

# Generative Fabric Tool (Corduroy + Weave) — TypeScript CLI

## Build Sequence Checklist (Granular Steps)

- [x] **Step 1** — Minimal scaffold (TS Node CLI compiles and runs placeholder)
- [x] **Step 2** — Add lint/format (ESLint + Prettier, strict, minimal deps)
- [x] **Step 3** — Final folder structure (placeholders only, no implementation)
- [x] **Step 4** — Config architecture + security rules (base + preset, unknown-key rejection policy documented; minimal configs created)
- [x] **Step 5** — SPEC: Tile + 4-wide repeat logic only (wrap duplication rules, optional Y wrap)
- [x] **Step 6** — SPEC: Parameter schema list only (names, types, defaults, constraints)
- [x] **Step 7** — JSON Schema: base config only (strict, `repeat_x` constrained to 4, unknown keys rejected)
- [x] **Step 8** — TypeScript types: base config only (matches schema)
- [x] **Step 9** — CLI validate-base command (security-first, fail-closed, non-zero on invalid)

---

## Spec Lock Deliverables

- [x] Ensure docs/SPEC.md includes all required sections and remains consistent with configs and schemas
- [x] Add a “Spec locked” section in TODO with explicit sign-off criteria (keys finalized, constraints documented, schema validates base, validate-base works)

---

## Spec Locked

- [x] Keys finalized: All configuration keys are defined in `configs/base.json` and enforced by `configs/schema.base.json`.
- [x] Constraints documented: All constraints (e.g., `tile.repeat_x = 4`, `additionalProperties: false`) are documented in `docs/SPEC.md` and enforced in the schema.
- [x] Schema validates base: `npm run validate:base -- configs/base.json` exits 0 and confirms validity.
- [x] validate-base works: CLI command properly rejects invalid configs (e.g., `repeat_x != 4`) with non-zero exit code.

---

## Step 10–12 (Next Planned)

### Step 10 — Preset schema + validate-preset
- [x] Create `configs/schema.preset.json` (override-only, strict allowlist, disallow seed/spec_version)
- [x] Add CLI command `validate-preset <presetPath>`
- [x] Add npm script `validate:preset`
- [x] Ensure preset validation rejects unknown keys and forbidden overrides

### Step 11 — SPEC: merge rules only
- [x] Document base + preset merge precedence, allowed override paths, forbidden fields
- [x] Define array policy (replace vs merge) explicitly
- [x] Provide a minimal example: base + preset → effective config

### Step 12 — validate-effective (merge + validate)
- [x] Implement secure merge routine (whitelist deep-merge targets, arrays replaced)
- [x] Add CLI `validate-effective --base <path> --preset <path>`
- [x] Validate effective config against base schema
- [x] Fail closed on ambiguity, missing keys, forbidden overrides

---

## Generator Implementation (Deferred Until After Step 12)

### Core tile engine (corduroy + realism)
- [x] Implement single-wale rib field (shadow/mid/highlight rib profile)
- [x] Implement nap micro-streak layer (subtle, controlled)
- [x] Implement drift bands (macro tonal variation)

### Weave overlay system
- [x] Implement event types (weft pops, stitch interrupts, basket patches)
- [x] Implement fray/notch details (min-feature constraints enforced)
- [x] Implement deterministic event placement (seed-driven)

### Seam logic
- [x] Implement X wrap duplication for events crossing tile edges
- [x] Optional Y wrap mode toggle (off by default for hoodie panels)

### Composition outputs
- [x] Emit master tile SVG
- [x] Emit 4-wide composite SVG (no new randomness in composition)
- [x] Emit flattened SVG variant (no `<pattern>`)

---

## Run Readiness (Remaining)

- [ ] Finalize production export targets (PDF/TIFF/EPS) needed for print-ready runs
- [ ] Add verification/guards for safe generation (seams, snapshot checks, complexity limits)
- [ ] Document end-to-end run commands (init/menu/preview/generate/package) in README/docs
- [ ] Package installers for macOS/Windows/Linux (DMG/MSI/DEB/RPM or equivalent)

---

## Export Matrix (Deferred)

- [ ] Vector exports: SVG variants, PDF/X-1a, PDF/X-4, EPS
- [ ] Raster exports: TIFF 300, PNG 300, JPG previews, repeat swatches
- [ ] Optional separations: spot sets + combined proof
- [ ] Color policies documented and enforced (working vs web conversion)

---

## Production ZIP Packaging (Deferred)

- [x] Define deterministic folder structure and naming scheme
- [x] Generate `manifest.json` (seed, spec_version, effective config snapshot, file list)
- [x] Generate `checksums.sha256`
- [x] Generate palette exports (ASE/GPL/JSON)
- [x] Include print spec / README handoff docs

---

## Quality & Verification (Deferred)

- [ ] Seam verification swatch generation (2×2 or 4×2)
- [ ] Deterministic snapshot testing for known seeds
- [ ] Complexity guards: max shapes per tile, max nodes per path, min feature size checks
- [ ] Robust error taxonomy and fail-closed behavior across all commands

---

## CLI UX (Deferred)

- [x] `generate` command (config path, seed override, output dir)
- [ ] `batch` command (seed list generation, manifest CSV)
- [ ] `validate` umbrella command (base/preset/effective)
- [x] `package` command (output zip, palette options, deterministic flag)
- [x] `init` command (native folder dialog for project folder)
- [x] Interactive menu (multi-column, arrow + numeric input)
- [x] Live preview server (auto-open browser, auto-reload on updates)
- [x] Multi-preset registry (add/load/remove/default preset)
- [ ] Per-field preview increments/step sizes for fine-tuning

---

## Documentation (Deferred)

- [ ] Finalize docs/SPEC.md as the authoritative contract
- [ ] Add production guidance: bleed, safe zones, print method considerations
- [ ] Add examples for hoodie panel vs all-over-print presets

---

# Milestones

- **Milestone 1: Spec Lock (Completed)** - Steps 1-9 implemented and validated. Base config schema, types, and validation are secure and fail-closed. Repository structure and tooling (lint, format, build) are established.
- **Milestone 2: Preset and Effective Validation (Completed)** - Steps 10-12: Implement preset schema, merge rules, and effective config validation. Ensure secure override-only presets with strict allowlists.
- **Milestone 3: Core Generator Implementation (Completed)** - Implement corduroy and weave generators with tile engine, event placement, and seam logic. Achieve deterministic, seed-driven outputs.
- **Milestone 4: Export Matrix** - Add vector and raster export capabilities, including SVG, PDF, TIFF, PNG variants. Implement color policies and optional separations.
- **Milestone 5: Production Packaging** - Implement ZIP packaging with manifest, checksums, and palette exports. Ensure deterministic folder structures.
- **Milestone 6: Quality Assurance** - Add seam verification, snapshot testing, complexity guards, and robust error handling.
- **Milestone 7: CLI UX and Documentation** - Complete CLI commands (generate, batch, validate), finalize docs/SPEC.md, and add production guidance.
- **Milestone 8: Installer Packaging** - Deliver macOS/Windows/Linux installers with update/uninstall flow.

# Backlog

- Add snapshot testing for SVG outputs to automate visual validation.
- Implement caching for seeded random generation to improve performance.
- Investigate alternative JSON schema validators if AJV performance becomes an issue.
- Add internationalization support for CLI messages.
- Research integration with design software (e.g., Adobe plugins).
- Add wave function collapse algorithm to src/algorithms/ (placeholder exists)
- Add complexity guards: max shapes per tile, max nodes per path, min feature size checks
- Add seam verification swatch generation (2×2 or 4×2)
- Add deterministic snapshot testing for known seeds
- Add robust error taxonomy and fail-closed behavior across all commands
- Add `batch` command (seed list generation, manifest CSV)
- Add `validate` umbrella command (base/preset/effective)
- Add per-field preview increments/step sizes in the CLI menu
- Plan and implement installer packaging (macOS/Windows/Linux)
- Finalize docs/SPEC.md as the authoritative contract
- Add production guidance: bleed, safe zones, print method considerations
- Add examples for hoodie panel vs all-over-print presets
- Vector exports: SVG variants, PDF/X-1a, PDF/X-4, EPS
- Raster exports: TIFF 300, PNG 300, JPG previews, repeat swatches
- Optional separations: spot sets + combined proof
- Color policies documented and enforced (working vs web conversion)

# Risks

- **Schema Validation Reliability**: AJV library updates could introduce breaking changes; pin version and monitor for updates.
- **Merge Logic Complexity**: Deep-merge implementation for presets tested and secure; monitor for edge cases.
- **Performance Scaling**: Large tile generations or complex patterns may hit memory/CPU limits; implement guards and profiling.
- **Deterministic Seed Behavior**: Ensure seed-driven randomness is truly reproducible across environments and Node.js versions.
- **External Dependencies**: Reliance on npm packages (AJV, TypeScript) could be affected by supply chain issues; consider vendoring critical code.
- **Print Production Accuracy**: Exported files must meet print standards (PDF/X, color profiles); validate with professional printers.

# Dependencies

- **Runtime**: Node.js >= 18.0.0 (for ES modules and modern features)
- **Build Tools**: TypeScript >= 5.5.4, TSC compiler
- **Validation**: AJV >= 8.12.0 for JSON schema validation
- **Code Quality**: ESLint >= 8.0.0 with @typescript-eslint plugins, Prettier >= 2.0.0
- **Version Control**: Git, GitHub for repository and CI/CD
- **Testing**: Manual verification scripts (verify.sh, verify.ps1); custom test scripts for SVG generation and validation
- **Documentation**: Markdown for specs, potential future use of Docusaurus or similar for docs site
