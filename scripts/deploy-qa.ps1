$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$deployRoot = Join-Path $tempBase ("india-qa-deploy-" + [guid]::NewGuid().ToString("N"))

try {
  New-Item -ItemType Directory -Path $deployRoot | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot "dist") -Destination (Join-Path $deployRoot "dist") -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "functions") -Destination (Join-Path $deployRoot "functions") -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "wrangler.qa.jsonc") -Destination (Join-Path $deployRoot "wrangler.jsonc")
  New-Item -ItemType Junction -Path (Join-Path $deployRoot "node_modules") -Target (Join-Path $projectRoot "node_modules") | Out-Null

  $isolatedConfig = Get-Content -LiteralPath (Join-Path $deployRoot "wrangler.jsonc") -Raw
  if ($isolatedConfig -notmatch '"name"\s*:\s*"viaggio-in-india-2026-qa"' -or
      $isolatedConfig -notmatch '"database_name"\s*:\s*"viaggio-in-india-qa-db"') {
    throw "Configurazione QA non valida: deploy interrotto"
  }

  $deployOutput = & npx wrangler pages deploy dist --branch main --cwd $deployRoot --commit-dirty=true 2>&1
  $deployOutput | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0) { throw "Deploy QA non riuscito" }
  $deploymentUrl = [regex]::Match(($deployOutput | Out-String), 'https://[a-z0-9-]+\.viaggio-in-india-2026-qa\.pages\.dev').Value
  if (-not $deploymentUrl) { throw "URL del deployment QA non rilevato" }
  Write-Output "DEPLOYMENT_URL=$deploymentUrl"
}
finally {
  $resolvedDeploy = [IO.Path]::GetFullPath($deployRoot)
  if ($resolvedDeploy.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -and
      [IO.Path]::GetFileName($resolvedDeploy).StartsWith("india-qa-deploy-")) {
    Remove-Item -LiteralPath $resolvedDeploy -Recurse -Force -ErrorAction SilentlyContinue
  }
}
