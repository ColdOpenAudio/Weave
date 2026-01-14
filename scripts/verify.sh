#!/usr/bin/env sh
set -eu

echo "Starting verification script for Weave repository"

run_cmd() {
  echo "> $1"
  sh -c "$1"
}

echo "Installing dependencies"
run_cmd "npm install"

echo "Typecheck"
run_cmd "npm run typecheck"

echo "Build"
run_cmd "npm run build"

echo "Lint"
run_cmd "npm run lint || true"

echo "Format check"
run_cmd "npm run format:check"

echo "Validate base config"
run_cmd "npm run validate:base -- configs/base.json"

echo "Negative test: create temporary invalid config"
cat > configs/_tmp_invalid.json <<'JSON'
{
  "spec_version": "1.0",
  "naming": { "project_name": "bad", "version": "0", "pattern": "x" },
  "tile": { "tile_width": 10, "tile_height": 10, "repeat_x": 3 }
}
JSON

echo "Running validator against invalid config (expect non-zero exit)"
set +e
npm run build
node dist/index.js validate-base configs/_tmp_invalid.json
rc=$?
set -e
if [ "$rc" -eq 0 ]; then
  echo "ERROR: validator accepted invalid config" >&2
  rm -f configs/_tmp_invalid.json
  exit 2
fi

echo "Validator rejected invalid config as expected (exit code $rc)"
rm -f configs/_tmp_invalid.json

echo "All verification steps completed successfully."
exit 0
