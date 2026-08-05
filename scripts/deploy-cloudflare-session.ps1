param(
  [ValidateSet("qa", "production", "both")]
  [string]$Target = "qa",
  [Parameter(Mandatory = $true)]
  [string]$TokenFile,
  [switch]$ConfirmProduction,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$clientId = "54d11594-84e4-41aa-b438-e81b8fa78ee7"

if ($Target -in @("production", "both") -and -not $ConfirmProduction) {
  throw "Pubblicazione ufficiale bloccata: specificare esplicitamente -ConfirmProduction."
}

if (-not (Test-Path -LiteralPath $TokenFile)) {
  throw "Sessione Cloudflare assente: $TokenFile"
}

$saved = Get-Content -LiteralPath $TokenFile -Raw | ConvertFrom-Json
if (-not $saved.refresh_token) {
  throw "La sessione Cloudflare non contiene un refresh token."
}

# Cloudflare ruota il refresh token a ogni rinnovo: il nuovo valore va salvato
# prima del deploy, altrimenti la pubblicazione successiva richiede nuovamente l'accesso.
$fresh = Invoke-RestMethod `
  -Method Post `
  -Uri "https://dash.cloudflare.com/oauth2/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{
    grant_type = "refresh_token"
    refresh_token = $saved.refresh_token
    client_id = $clientId
  }

$nextTokenFile = "$TokenFile.next"
$fresh | ConvertTo-Json -Compress | Set-Content -LiteralPath $nextTokenFile -NoNewline
Move-Item -LiteralPath $nextTokenFile -Destination $TokenFile -Force
$env:CLOUDFLARE_API_TOKEN = $fresh.access_token

if (-not $SkipBuild) {
  npm run build
}
$expectedVersion = (Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\package.json") -Raw | ConvertFrom-Json).version
$readyScript = Join-Path $PSScriptRoot "wait-deployment-ready.ps1"

if ($Target -in @("qa", "both")) {
  $qaOutput = & powershell -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass `
    -File (Join-Path $PSScriptRoot "deploy-qa.ps1")
  $qaOutput | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0) { throw "Deploy QA isolato non riuscito" }
  $qaUrl = [regex]::Match(($qaOutput | Out-String), 'DEPLOYMENT_URL=(https://[^\s]+)').Groups[1].Value
  if (-not $qaUrl) { throw "URL QA non disponibile per la verifica" }
  & $readyScript -BaseUrl $qaUrl -ExpectedVersion $expectedVersion
  & $readyScript -BaseUrl "https://viaggio-in-india-2026-qa.pages.dev" -ExpectedVersion $expectedVersion
}

if ($Target -in @("production", "both")) {
  $productionOutput = & npx --yes wrangler@4.118.0 pages deploy dist `
    --project-name viaggio-in-india-2026 `
    --branch main `
    --commit-dirty=true 2>&1
  $productionOutput | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0) { throw "Deploy produzione non riuscito" }
  $productionUrl = [regex]::Match(($productionOutput | Out-String), 'https://[a-z0-9-]+\.viaggio-in-india-2026\.pages\.dev').Value
  if (-not $productionUrl) { throw "URL del deployment produzione non rilevato" }
  & $readyScript -BaseUrl $productionUrl -ExpectedVersion $expectedVersion
  & $readyScript -BaseUrl "https://viaggio-in-india-2026.pages.dev" -ExpectedVersion $expectedVersion
}
