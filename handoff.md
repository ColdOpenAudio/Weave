# Handoff: Continue Step 9 (validate-base)

Context
- Repo: ColdOpenAudio/Weave (branch: main). Work completed up to Step 9 (validate-base).
- Changed files and current state:
  - `configs/base.json.bak` (backup of original `configs/base.json`)
  - `configs/base.json` (patched: added naming.project_name/version/colorway, tile.tile_width/height, generator placeholders `corduroy`/`weave`/`palette`, `exports.preset` + `toggles`, `constraints`)
  - `configs/schema.base.json` (replaced to match `base.json`, enforces `additionalProperties: false` and `tile.repeat_x = 4`)
  - `src/types/config.base.ts` (added TypeScript types matching schema)
  - `src/index.ts` (CLI implemented; includes `validate-base <configPath>` using local schema + AJV; fail-closed)
  - `package.json` (added scripts: `lint`, `format`, `format:check`, `validate:base`; added devDeps: `ajv`, `eslint`, `prettier`)
  - `docs/SPEC.md` (Parameter Schema updated to match `configs/base.json`)
  - `scripts/verify.ps1` and `scripts/verify.sh` (platform verification scripts)

Non-destructive constraints (must follow)
- Never delete files. Never overwrite `configs/base.json` without first creating `configs/base.json.bak` (already present).
- Prefer minimal patches; do not introduce generator or export pipelines beyond Step 9.
- Do not rewrite `docs/SPEC.md` wholesale—patch only as necessary.
- Fail-closed policy: unknown keys must be rejected by schema; validation must exit non-zero on invalid configs.
- Schema and runtime must use local files only (no network fetching).

Tasks (execute in order)
1. Inspect repository and confirm the changed files listed in Context.
2. From repo root run the verification steps:
   - `npm install`
   - `npm run typecheck`
   - `npm run build`
   - `npm run lint` (it's acceptable if lint needs extra config; report findings)
   - `npm run format:check`
   - `npm run validate:base -- configs/base.json` or `node dist/index.js validate-base configs/base.json`
   - Run full verifier (includes negative test):
     - Windows: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\scripts\verify.ps1`
     - POSIX: `sh scripts/verify.sh`
3. Confirm validator rejects an invalid config:
   - Create `configs/_tmp_invalid.json` with `tile.repeat_x` set to `3`.
   - Run `npm run build` then `node dist/index.js validate-base configs/_tmp_invalid.json` and expect non-zero exit.
   - Delete `configs/_tmp_invalid.json` after verification.
4. If any step fails, fix with minimal non-destructive edits:
   - If `ajv` missing or incompatible, add appropriate version to `devDependencies` and `npm install`.
   - If runtime errors in `src/index.ts`, patch only failing lines while preserving fail-closed behavior and local schema usage.
   - If schema does not validate `configs/base.json`, first copy `configs/base.json` to `configs/base.json.bak` (if not present), then minimally patch schema or base.json so validation succeeds.
5. Re-run verification until all checks pass.
6. Create a feature branch `step9/validate-base-fixes`, commit minimal patches with clear messages, push and open a PR containing:
   - Summary of changes.
   - Verification output (stdout/stderr) from the checks.
   - Any open questions documented and recommended next steps.

Acceptance criteria
- `package.json` contains scripts: `typecheck`, `build`, `start`, `lint`, `format`, `format:check`, `validate:base`.
- `npm run typecheck`, `npm run build`, `npm run lint` (or lint tolerated failures documented), `npm run format:check` succeed locally.
- `npm run validate:base -- configs/base.json` exits 0.
- Validator exits non-zero for `configs/_tmp_invalid.json`.
- `configs/schema.base.json` uses `additionalProperties: false` and enforces `tile.repeat_x` to `4`.
- `src/types/config.base.ts` aligns with the schema.
- All changes are non-destructive and `configs/base.json.bak` is present.

Commands to run (copy/paste)
- POSIX:
```bash
npm install
npm run typecheck
npm run build
npm run lint || true
npm run format:check
npm run validate:base -- configs/base.json
sh scripts/verify.sh
```
- Windows (PowerShell):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
npm run typecheck
npm run build
npm run lint
npm run format:check
npm run validate:base -- configs/base.json
.\scripts\verify.ps1
```

Deliverables
- Commit(s) on `step9/validate-base-fixes` containing only minimal patches and tests.
- A PR against `main` with verification logs and summary.

Notes / Caveats
- Validator uses AJV and local schema only; keep it that way. No network schema fetching.
- Preserve the `fail-closed` policy: unknown keys must be rejected.
- Prefer updating schema to reflect intended config contract; only augment `configs/base.json` if it's clearly missing required fields — always back it up first.

Start at Step 1: inspect files and run the verification, then attach logs and any minimal fixes.
