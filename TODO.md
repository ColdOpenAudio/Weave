# TODO — Generative Fabric Tool (Corduroy + Weave) — TypeScript CLI

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

- [ ] Ensure docs/SPEC.md includes all required sections and remains consistent with configs and schemas
- [ ] Add a “Spec locked” section in TODO with explicit sign-off criteria (keys finalized, constraints documented, schema validates base, validate-base works)

---

## Step 10–12 (Next Planned)

### Step 10 — Preset schema + validate-preset
- [ ] Create `configs/schema.preset.json` (override-only, strict allowlist, disallow seed/spec_version)
- [ ] Add CLI command `validate-preset <presetPath>`
- [ ] Add npm script `validate:preset`
- [ ] Ensure preset validation rejects unknown keys and forbidden overrides

### Step 11 — SPEC: merge rules only
- [ ] Document base + preset merge precedence, allowed override paths, forbidden fields
- [ ] Define array policy (replace vs merge) explicitly
- [ ] Provide a minimal example: base + preset → effective config

### Step 12 — validate-effective (merge + validate)
- [ ] Implement secure merge routine (whitelist deep-merge targets, arrays replaced)
- [ ] Add CLI `validate-effective --base <path> --preset <path>`
- [ ] Validate effective config against base schema
- [ ] Fail closed on ambiguity, missing keys, forbidden overrides

---

## Generator Implementation (Deferred Until After Step 12)

### Core tile engine (corduroy + realism)
- [ ] Implement single-wale rib field (shadow/mid/highlight rib profile)
- [ ] Implement nap micro-streak layer (subtle, controlled)
- [ ] Implement drift bands (macro tonal variation)

### Weave overlay system
- [ ] Implement event types (weft pops, stitch interrupts, basket patches)
- [ ] Implement fray/notch details (min-feature constraints enforced)
- [ ] Implement deterministic event placement (seed-driven)

### Seam logic
- [ ] Implement X wrap duplication for events crossing tile edges
- [ ] Optional Y wrap mode toggle (off by default for hoodie panels)

### Composition outputs
- [ ] Emit master tile SVG
- [ ] Emit 4-wide composite SVG (no new randomness in composition)
- [ ] Emit flattened SVG variant (no `<pattern>`)

---

## Export Matrix (Deferred)

- [ ] Vector exports: SVG variants, PDF/X-1a, PDF/X-4, EPS
- [ ] Raster exports: TIFF 300, PNG 300, JPG previews, repeat swatches
- [ ] Optional separations: spot sets + combined proof
- [ ] Color policies documented and enforced (working vs web conversion)

---

## Production ZIP Packaging (Deferred)

- [ ] Define deterministic folder structure and naming scheme
- [ ] Generate `manifest.json` (seed, spec_version, effective config snapshot, file list)
- [ ] Generate `checksums.sha256`
- [ ] Generate palette exports (ASE/GPL/JSON)
- [ ] Include print spec / README handoff docs

---

## Quality & Verification (Deferred)

- [ ] Seam verification swatch generation (2×2 or 4×2)
- [ ] Deterministic snapshot testing for known seeds
- [ ] Complexity guards: max shapes per tile, max nodes per path, min feature size checks
- [ ] Robust error taxonomy and fail-closed behavior across all commands

---

## CLI UX (Deferred)

- [ ] `generate` command (config path, seed override, output dir)
- [ ] `batch` command (seed list generation, manifest CSV)
- [ ] `validate` umbrella command (base/preset/effective)

---

## Documentation (Deferred)

- [ ] Finalize docs/SPEC.md as the authoritative contract
- [ ] Add production guidance: bleed, safe zones, print method considerations
- [ ] Add examples for hoodie panel vs all-over-print presets

---

## Milestones

## Backlog

## Risks

## Dependencies
