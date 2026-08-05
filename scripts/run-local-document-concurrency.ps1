param(
  [ValidateSet("all", "document-concurrency", "documents", "roles", "location", "media", "social", "sync", "avatar", "chunk-retry")]
  [string]$Suite = "document-concurrency"
)

$ErrorActionPreference = "Stop"
$runId = [guid]::NewGuid().ToString("N")
$persistRoot = Join-Path ([IO.Path]::GetTempPath()) "india-document-concurrency-$runId"
$port = Get-Random -Minimum 4200 -Maximum 4800
$server = $null

function New-QaToken { ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")) }
function Get-TokenHash([string]$Token) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Token)) | ForEach-Object { $_.ToString("x2") }) }
  finally { $sha.Dispose() }
}

$ownerId = "local-owner-$runId"
$otherId = "local-other-$runId"
$coordinatorId = "local-coordinator-$runId"
$unclaimedId = "local-unclaimed-$runId"
$ownerToken = New-QaToken
$otherToken = New-QaToken
$coordinatorToken = New-QaToken
$coordinatorSecondaryToken = New-QaToken
$coordinatorSecondaryDeviceId = "local-coordinator-secondary-device"
$created = [DateTime]::UtcNow.ToString("o")
$expires = [DateTime]::UtcNow.AddHours(1).ToString("o")

try {
  New-Item -ItemType Directory -Path $persistRoot | Out-Null
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\schema.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Schema D1 locale non riuscito" }
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\migrations\0014_realtime_sync_triggers.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Trigger sincronizzazione D1 locali non riusciti" }

  $sql = @"
INSERT INTO profiles(id,name,surname,role,created_at) VALUES
('$ownerId','Proprietario','Locale','traveler','$created'),
('$otherId','Secondo','Locale','traveler','$created'),
('$coordinatorId','Coordinatore','Locale','coordinator','$created'),
('$unclaimedId','Invitato','Locale','traveler','$created');
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES
('$(Get-TokenHash $ownerToken)','$ownerId','local-owner-device','Telefono proprietario locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $otherToken)','$otherId','local-other-device','Secondo telefono locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorToken)','$coordinatorId','local-coordinator-device','Telefono coordinatore locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorSecondaryToken)','$coordinatorId','$coordinatorSecondaryDeviceId','Secondo telefono coordinatore locale','$created','$created','$expires',NULL);
"@
  $setupFile = Join-Path $persistRoot "setup.sql"
  [IO.File]::WriteAllText($setupFile, $sql, [Text.UTF8Encoding]::new($false))
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file $setupFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Preparazione D1 locale non riuscita" }

  $npx = (Get-Command npx.cmd).Source
  $serverOut = Join-Path $persistRoot "pages-dev.out.log"
  $serverErr = Join-Path $persistRoot "pages-dev.err.log"
  $server = Start-Process -FilePath $npx -ArgumentList @(
    "--yes", "wrangler@4.118.0", "pages", "dev", "dist",
    "--port", "$port", "--persist-to", $persistRoot,
    "--d1", "DB=26221574-b9b8-4b16-a117-05d024613f73", "--kv", "MEDIA",
    "--binding", "GROUP_CODE=qa-local-only"
  ) -WorkingDirectory (Resolve-Path ".").Path -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/health" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) {
    $details = if (Test-Path -LiteralPath $serverErr) { Get-Content -LiteralPath $serverErr -Raw } else { "" }
    throw "Server Pages locale non avviato. $details"
  }

  $env:TEST_BASE_URL = "http://127.0.0.1:$port"
  $env:QA_PROFILE_ID = $ownerId
  $env:QA_SESSION_TOKEN = $ownerToken
  $env:QA_SECOND_PROFILE_ID = $otherId
  $env:QA_SECOND_SESSION_TOKEN = $otherToken
  $env:QA_COORDINATOR_TOKEN = $coordinatorToken
  $env:QA_COORDINATOR_PROFILE_ID = $coordinatorId
  $env:QA_COORDINATOR_SECOND_TOKEN = $coordinatorSecondaryToken
  $env:QA_COORDINATOR_SECOND_DEVICE_ID = $coordinatorSecondaryDeviceId
  $env:QA_UNCLAIMED_PROFILE_ID = $unclaimedId
  $suiteFiles = @{
    "document-concurrency" = "tests\extended-p0-document-concurrency.mjs"
    "documents" = "tests\extended-p0-documents.mjs"
    "roles" = "tests\extended-p0-roles.mjs"
    "location" = "tests\extended-p0-location.mjs"
    "media" = "tests\extended-p0-media-delete.mjs"
    "social" = "tests\extended-p0-social.mjs"
    "sync" = "tests\extended-p0-sync-delete.mjs"
    "avatar" = "tests\extended-p0-avatar-replacement.mjs"
    "chunk-retry" = "tests\extended-p0-chunk-retry.mjs"
  }
  $selectedSuites = if ($Suite -eq "all") {
    @("document-concurrency", "documents", "location", "media", "social", "sync", "avatar", "chunk-retry", "roles")
  } else { @($Suite) }
  foreach ($selectedSuite in $selectedSuites) {
    Write-Host "P0_SUITE_START=$selectedSuite"
    $suiteOutput = & node $suiteFiles[$selectedSuite] 2>&1
    $suiteExit = $LASTEXITCODE
    $suiteOutput | ForEach-Object { Write-Host $_ }
    if ($suiteExit -ne 0) { throw "Test P0 locale non riuscito: $selectedSuite" }
    Write-Host "P0_SUITE_PASS=$selectedSuite"
  }
}
finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
  $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  $resolvedPersist = [IO.Path]::GetFullPath($persistRoot)
  if ($resolvedPersist.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedPersist)) {
    for ($cleanupAttempt = 0; $cleanupAttempt -lt 5; $cleanupAttempt += 1) {
      try { Remove-Item -LiteralPath $resolvedPersist -Recurse -Force; break }
      catch { Start-Sleep -Milliseconds 500 }
    }
  }
}
