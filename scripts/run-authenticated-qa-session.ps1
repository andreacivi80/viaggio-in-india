param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string]$ExpectedVersion,
  [Parameter(Mandatory = $true)][string]$TokenFile,
  [ValidateSet("default", "documents", "document-concurrency", "sync", "media", "location", "roles", "social", "backup-comments", "avatar", "chunk-retry")]
  [string]$Suite = "default"
)

$ErrorActionPreference = "Stop"
$clientId = "54d11594-84e4-41aa-b438-e81b8fa78ee7"
$saved = Get-Content -LiteralPath $TokenFile -Raw | ConvertFrom-Json
if (-not $saved.refresh_token) { throw "Sessione Cloudflare priva di refresh token" }

$fresh = Invoke-RestMethod -Method Post -Uri "https://dash.cloudflare.com/oauth2/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{ grant_type = "refresh_token"; refresh_token = $saved.refresh_token; client_id = $clientId }
$nextTokenFile = "$TokenFile.next"
$fresh | ConvertTo-Json -Compress | Set-Content -LiteralPath $nextTokenFile -NoNewline
Move-Item -LiteralPath $nextTokenFile -Destination $TokenFile -Force
$env:CLOUDFLARE_API_TOKEN = $fresh.access_token

$runnerParameters = @{ BaseUrl = $BaseUrl; ExpectedVersion = $ExpectedVersion }
$suiteSwitch = @{
  "documents" = "-ExtendedDocuments"
  "document-concurrency" = "-ExtendedDocumentConcurrency"
  "sync" = "-ExtendedSync"
  "media" = "-ExtendedMedia"
  "location" = "-ExtendedLocation"
  "roles" = "-ExtendedRoles"
  "social" = "-ExtendedSocial"
  "backup-comments" = "-ExtendedBackupComments"
  "avatar" = "-ExtendedAvatar"
  "chunk-retry" = "-ExtendedChunkRetry"
}
if ($suiteSwitch.ContainsKey($Suite)) {
  $runnerParameters[$suiteSwitch[$Suite].TrimStart("-")] = $true
}
& "$PSScriptRoot\run-authenticated-qa.ps1" @runnerParameters
exit $LASTEXITCODE
