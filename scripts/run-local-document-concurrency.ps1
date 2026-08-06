param(
  [ValidateSet("all", "authorization-matrix", "resource-enumeration", "auth-lifecycle", "access-session-boundaries", "ui-session-history", "ui-location-permissions", "ui-microphone-permissions", "ui-password-access", "ui-stale-password-session", "ui-coordinator-grid", "ui-invite-misdelivery", "ui-private-browser-session", "ui-multi-invite-copy", "ui-people", "ui-protected-pdf", "profile-deletion", "document-concurrency", "documents", "roles", "location", "media", "social", "sync", "avatar", "chunk-retry")]
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

function Stop-ProcessTree([int]$ProcessId) {
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) { Stop-ProcessTree ([int]$child.ProcessId) }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

$ownerId = "local-owner-$runId"
$otherId = "local-other-$runId"
$coordinatorId = "local-coordinator-$runId"
$unclaimedId = "local-unclaimed-$runId"
$deleteProfileId = "local-delete-$runId"
$ownerToken = New-QaToken
$otherToken = New-QaToken
$coordinatorToken = New-QaToken
$coordinatorSecondaryToken = New-QaToken
$deleteProfileToken = New-QaToken
$coordinatorSecondaryDeviceId = "local-coordinator-secondary-device"
$uiTravelerId = "local-ui-traveler-$runId"
$uiCoordinatorId = "local-ui-coordinator-$runId"
$uiTravelerName = "Viaggiatore UI $($runId.Substring(0, 6))"
$uiCoordinatorName = "Coordinatore UI $($runId.Substring(0, 6))"
$uiManagedProfileName = "Profilo gestito $($runId.Substring(0, 6))"
$uiTravelerInvite = New-QaToken
$uiTravelerSecondInvite = New-QaToken
$uiCoordinatorInvite = New-QaToken
$expiredInviteToken = New-QaToken
$expiredSessionToken = New-QaToken
$created = [DateTime]::UtcNow.ToString("o")
$expires = [DateTime]::UtcNow.AddHours(1).ToString("o")
$expired = [DateTime]::UtcNow.AddHours(-1).ToString("o")

try {
  New-Item -ItemType Directory -Path $persistRoot | Out-Null
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\schema.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Schema D1 locale non riuscito" }
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\migrations\0014_realtime_sync_triggers.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Trigger sincronizzazione D1 locali non riusciti" }
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\migrations\0016_auth_profile_integrity.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Vincoli profilo autenticazione D1 locali non riusciti" }

  if ($Suite -in @("all", "auth-lifecycle")) {
    $invalidSessionSql = "INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES('invalid-session-$runId','missing-profile-$runId','invalid-device-$runId','Non valido','$created','$created','$expires',NULL);"
    $invalidInviteSql = "INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('invalid-invite-$runId','missing-profile-$runId',NULL,'$created','$expires',NULL);"
    foreach ($invalidSql in @($invalidSessionSql, $invalidInviteSql)) {
      $previousErrorActionPreference = $ErrorActionPreference
      $ErrorActionPreference = "Continue"
      $invalidOutput = & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --command $invalidSql 2>&1
      $invalidExit = $LASTEXITCODE
      $ErrorActionPreference = $previousErrorActionPreference
      if ($invalidExit -eq 0) { throw "Il database ha accettato un record autenticazione senza profilo: $invalidOutput" }
    }

    $cascadeProfileId = "integrity-profile-$runId"
    $cascadeSql = @"
INSERT INTO profiles(id,name,surname,role,created_at) VALUES('$cascadeProfileId','Integrita','Locale','traveler','$created');
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES('integrity-session-$runId','$cascadeProfileId','integrity-device-$runId','Integrita','$created','$created','$expires',NULL);
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('integrity-invite-$runId','$cascadeProfileId','$cascadeProfileId','$created','$expires',NULL);
DELETE FROM profiles WHERE id='$cascadeProfileId';
INSERT INTO profiles(id,name,surname,role,created_at) VALUES('$cascadeProfileId','Integrita','Locale','traveler','$created');
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES('integrity-session-$runId','$cascadeProfileId','integrity-device-$runId','Integrita','$created','$created','$expires',NULL);
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('integrity-invite-$runId','$cascadeProfileId','$cascadeProfileId','$created','$expires',NULL);
DELETE FROM profiles WHERE id='$cascadeProfileId';
"@
    & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --command $cascadeSql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Pulizia a cascata di sessioni e inviti non riuscita" }
    Write-Output "P0_DB_AUTH_INTEGRITY=3/3"
  }

  $sql = @"
INSERT INTO profiles(id,name,surname,role,created_at) VALUES
('$ownerId','Proprietario','Locale','traveler','$created'),
('$otherId','Secondo','Locale','traveler','$created'),
('$coordinatorId','Coordinatore','Locale','coordinator','$created'),
('$unclaimedId','Invitato','Locale','traveler','$created'),
('$deleteProfileId','Da eliminare','Locale','traveler','$created');
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES
('$(Get-TokenHash $ownerToken)','$ownerId','local-owner-device','Telefono proprietario locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $otherToken)','$otherId','local-other-device','Secondo telefono locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorToken)','$coordinatorId','local-coordinator-device','Telefono coordinatore locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorSecondaryToken)','$coordinatorId','$coordinatorSecondaryDeviceId','Secondo telefono coordinatore locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $deleteProfileToken)','$deleteProfileId','local-delete-device','Telefono profilo da eliminare','$created','$created','$expires',NULL);
"@
  $setupFile = Join-Path $persistRoot "setup.sql"
  [IO.File]::WriteAllText($setupFile, $sql, [Text.UTF8Encoding]::new($false))
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file $setupFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Preparazione D1 locale non riuscita" }

  # I dati UI devono essere creati prima dell'avvio di Pages. Scrivere nello
  # stesso database locale con un secondo processo Wrangler mentre il browser
  # lo usa può interrompere Miniflare e produrre falsi errori di rete.
  if ($Suite -in @("ui-session-history", "ui-location-permissions", "ui-microphone-permissions", "ui-password-access", "ui-stale-password-session", "ui-coordinator-grid", "ui-invite-misdelivery", "ui-private-browser-session", "ui-multi-invite-copy", "ui-people", "ui-protected-pdf")) {
    $uiSetupSql = @"
INSERT INTO profiles(id,name,surname,role,created_at) VALUES
('$uiTravelerId','$uiTravelerName','','traveler','$created'),
('$uiCoordinatorId','$uiCoordinatorName','','coordinator','$created');
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES
('$(Get-TokenHash $uiTravelerInvite)','$uiTravelerId','$uiCoordinatorId','$created','$expires',NULL),
('$(Get-TokenHash $uiTravelerSecondInvite)','$uiTravelerId','$uiCoordinatorId','$created','$expires',NULL),
('$(Get-TokenHash $uiCoordinatorInvite)','$uiCoordinatorId','$uiCoordinatorId','$created','$expires',NULL);
"@
    $uiSetupFile = Join-Path $persistRoot "ui-session-history.sql"
    [IO.File]::WriteAllText($uiSetupFile, $uiSetupSql, [Text.UTF8Encoding]::new($false))
    & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file $uiSetupFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Preparazione profili UI locali non riuscita" }
  }

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

  # Inserisce i record scaduti soltanto dopo il controllo di disponibilita,
  # perche /api/health esegue intenzionalmente la manutenzione silenziosa.
  $expiredSql = @"
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at)
VALUES('$(Get-TokenHash $expiredSessionToken)','$ownerId','local-expired-device','Telefono scaduto locale','$created','$created','$expired',NULL);
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at)
VALUES('$(Get-TokenHash $expiredInviteToken)','$unclaimedId','$coordinatorId','$created','$expired',NULL);
"@
  $expiredFile = Join-Path $persistRoot "expired-auth.sql"
  [IO.File]::WriteAllText($expiredFile, $expiredSql, [Text.UTF8Encoding]::new($false))
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file $expiredFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Preparazione record autenticazione scaduti non riuscita" }

  $env:TEST_BASE_URL = "http://127.0.0.1:$port"
  $env:QA_PROFILE_ID = $ownerId
  $env:QA_SESSION_TOKEN = $ownerToken
  $env:QA_SECOND_PROFILE_ID = $otherId
  $env:QA_SECOND_SESSION_TOKEN = $otherToken
  $env:QA_SECOND_DEVICE_ID = "local-other-device"
  $env:QA_COORDINATOR_TOKEN = $coordinatorToken
  $env:QA_COORDINATOR_PROFILE_ID = $coordinatorId
  $env:QA_COORDINATOR_SECOND_TOKEN = $coordinatorSecondaryToken
  $env:QA_COORDINATOR_SECOND_DEVICE_ID = $coordinatorSecondaryDeviceId
  $env:QA_UNCLAIMED_PROFILE_ID = $unclaimedId
  $env:QA_EXPIRED_INVITE_TOKEN = $expiredInviteToken
  $env:QA_EXPIRED_SESSION_TOKEN = $expiredSessionToken
  $env:QA_GROUP_CODE = "qa-local-only"
  $env:QA_UI_GROUP_CODE = "qa-local-only"
  $env:QA_DELETE_PROFILE_ID = $deleteProfileId
  $env:QA_DELETE_PROFILE_TOKEN = $deleteProfileToken
  $env:QA_UI_PROFILE_NAME = $uiTravelerName
  $env:QA_UI_INVITE_TOKEN = $uiTravelerInvite
  $env:QA_UI_SWITCH_INVITE_TOKEN = $uiTravelerSecondInvite
  $env:QA_UI_COORDINATOR_NAME = $uiCoordinatorName
  $env:QA_UI_COORDINATOR_INVITE_TOKEN = $uiCoordinatorInvite
  $env:QA_UI_MANAGED_PROFILE_NAME = $uiManagedProfileName
  $env:QA_UI_EXPIRED_SESSION_TOKEN = $expiredSessionToken
  $suiteFiles = @{
    "authorization-matrix" = "tests\extended-p0-authorization-matrix.mjs"
    "resource-enumeration" = "tests\extended-p0-resource-enumeration.mjs"
    "auth-lifecycle" = "tests\extended-p0-auth-lifecycle.mjs"
    "access-session-boundaries" = "tests\extended-p0-access-session-boundaries.mjs"
    "profile-deletion" = "tests\extended-p0-profile-deletion.mjs"
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
    @("authorization-matrix", "resource-enumeration", "document-concurrency", "documents", "location", "media", "social", "sync", "avatar", "chunk-retry", "roles", "profile-deletion", "auth-lifecycle", "access-session-boundaries")
  } else { @($Suite) }
  foreach ($selectedSuite in $selectedSuites) {
    Write-Host "P0_SUITE_START=$selectedSuite"
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    if ($selectedSuite -in @("ui-session-history", "ui-location-permissions", "ui-microphone-permissions", "ui-password-access", "ui-stale-password-session", "ui-coordinator-grid", "ui-invite-misdelivery", "ui-private-browser-session", "ui-multi-invite-copy", "ui-people", "ui-protected-pdf")) {
      $uiTestFile = switch ($selectedSuite) {
        "ui-session-history" { "tests/ui-role-live.spec.mjs" }
        "ui-location-permissions" { "tests/ui-location.spec.mjs" }
        "ui-microphone-permissions" { "tests/ui-microphone-permissions.spec.mjs" }
        "ui-password-access" { "tests/ui-password-access.spec.mjs" }
        "ui-stale-password-session" { "tests/ui-stale-password-session.spec.mjs" }
        "ui-coordinator-grid" { "tests/ui-coordinator-grid-access.spec.mjs" }
        "ui-invite-misdelivery" { "tests/ui-invite-misdelivery.spec.mjs" }
        "ui-private-browser-session" { "tests/ui-private-browser-session.spec.mjs" }
        "ui-multi-invite-copy" { "tests/ui-multi-invite-copy.spec.mjs" }
        "ui-people" { "tests/ui-people.spec.mjs" }
        "ui-protected-pdf" { "tests/ui-protected-pdf.spec.mjs" }
      }
      $suiteOutput = & npx playwright test $uiTestFile --config playwright.release.config.mjs --project=Samsung-S20-FE 2>&1
    } else {
      $suiteOutput = & node $suiteFiles[$selectedSuite] 2>&1
    }
    $suiteExit = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $suiteOutput | ForEach-Object { Write-Host $_ }
    if ($suiteExit -ne 0) { throw "Test P0 locale non riuscito: $selectedSuite" }
    Write-Host "P0_SUITE_PASS=$selectedSuite"
  }
}
finally {
  if ($server -and -not $server.HasExited) { Stop-ProcessTree $server.Id }
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
