param(
  [ValidateSet("qa", "production", "both")]
  [string]$Target = "both",
  [Parameter(Mandatory = $true)]
  [string]$TokenFile,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$clientId = "54d11594-84e4-41aa-b438-e81b8fa78ee7"

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

if ($Target -in @("qa", "both")) {
  npx --yes wrangler@4.118.0 pages deploy dist `
    --project-name viaggio-in-india-2026-qa `
    --branch main `
    --commit-dirty=true
}

if ($Target -in @("production", "both")) {
  npx --yes wrangler@4.118.0 pages deploy dist `
    --project-name viaggio-in-india-2026 `
    --branch main `
    --commit-dirty=true
}
