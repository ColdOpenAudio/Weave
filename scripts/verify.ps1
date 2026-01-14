Param()

Set-StrictMode -Version Latest

Write-Host "Starting verification script for Weave repository" -ForegroundColor Cyan

function Run-ExitOnFail($cmd, $desc) {
    Write-Host "-> $desc: $cmd"
    $proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-Command",$cmd -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Error "$desc failed with exit code $($proc.ExitCode)"
        exit $proc.ExitCode
    }
}

# Install dev dependencies
Write-Host "Installing dependencies (npm install)"
Run-ExitOnFail "npm install" "npm install"

# Typecheck
Run-ExitOnFail "npm run typecheck" "TypeScript typecheck"

# Build
Run-ExitOnFail "npm run build" "Build (tsc)"

# Lint (may be no-op if ESLint not configured fully)
Run-ExitOnFail "npm run lint" "ESLint lint"

# Format check
Run-ExitOnFail "npm run format:check" "Prettier format:check"

# Validate base config
Run-ExitOnFail "npm run validate:base -- configs/base.json" "Validate base config"

# Negative test: create a temporary invalid config and ensure validator exits non-zero
$tmpPath = "configs/_tmp_invalid.json"
$bad = @'
{
  "spec_version": "1.0",
  "naming": { "project_name": "bad", "version": "0", "pattern": "x" },
  "tile": { "tile_width": 10, "tile_height": 10, "repeat_x": 3 }
}
'@

Write-Host "Creating temporary invalid config at $tmpPath"
$bad | Out-File -FilePath $tmpPath -Encoding utf8

Write-Host "Running validator against invalid config (expected non-zero exit)"
$proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-Command","npm run build; node dist/index.js validate-base $tmpPath" -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -eq 0) {
    Write-Error "Validator unexpectedly accepted invalid config (exit code 0)"
    Remove-Item -Force $tmpPath
    exit 2
}

Write-Host "Validator rejected invalid config as expected (exit code $($proc.ExitCode))"
Remove-Item -Force $tmpPath

Write-Host "All verification steps completed successfully." -ForegroundColor Green
exit 0
