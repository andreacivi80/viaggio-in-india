param(
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deployRoot = Join-Path ([IO.Path]::GetTempPath()) ("india-qa-deploy-" + [guid]::NewGuid().ToString("N"))

try {
  New-Item -ItemType Directory -Path $deployRoot | Out-Null
  Copy-Item -LiteralPath (Join-Path $root "dist") -Destination (Join-Path $deployRoot "dist") -Recurse
  Copy-Item -LiteralPath (Join-Path $root "functions") -Destination (Join-Path $deployRoot "functions") -Recurse
  Copy-Item -LiteralPath (Join-Path $root "package.json") -Destination (Join-Path $deployRoot "package.json")
  Copy-Item -LiteralPath (Join-Path $root "wrangler.qa.jsonc") -Destination (Join-Path $deployRoot "wrangler.jsonc")
  New-Item -ItemType Junction -Path (Join-Path $deployRoot "node_modules") -Target (Join-Path $root "node_modules") | Out-Null

  $config = Get-Content -LiteralPath (Join-Path $deployRoot "wrangler.jsonc") -Raw
  if ($config -notmatch '"database_name"\s*:\s*"viaggio-in-india-qa-db"') {
    throw "Protezione dati: il pacchetto QA non usa il database QA"
  }
  if ($config -match '"database_name"\s*:\s*"viaggio-in-india-db"') {
    throw "Protezione dati: rilevato un binding di produzione nel pacchetto QA"
  }

  $output = & npx --yes wrangler@4.118.0 pages deploy dist `
    --cwd $deployRoot `
    --project-name viaggio-in-india-2026-qa `
    --branch $Branch `
    --commit-dirty=true 2>&1
  $output | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0) { throw "Pubblicazione QA non riuscita" }
  $deploymentUrl = [regex]::Match(($output | Out-String), 'https://[a-z0-9-]+\.viaggio-in-india-2026-qa\.pages\.dev').Value
  if (-not $deploymentUrl) { throw "URL QA non rilevato" }
  Write-Output "DEPLOYMENT_URL=$deploymentUrl"
}
finally {
  if (Test-Path -LiteralPath $deployRoot) {
    Remove-Item -LiteralPath $deployRoot -Recurse -Force
  }
}
