param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string]$ExpectedVersion,
  [switch]$RunLoad,
  [switch]$AbuseOnly,
  [switch]$ExtendedDocuments,
  [switch]$ExtendedSync,
  [switch]$ExtendedMedia,
  [switch]$ExtendedLocation,
  [switch]$ExtendedRoles
)

$ErrorActionPreference = "Stop"

function New-QaToken {
  return ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
}

function Get-TokenHash([string]$Token) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Token)
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $digest = $sha256.ComputeHash($bytes)
    return -join ($digest | ForEach-Object { $_.ToString("x2") })
  }
  finally {
    $sha256.Dispose()
  }
}

function Invoke-D1File([string]$Path) {
  for ($attempt = 1; $attempt -le 4; $attempt += 1) {
    & npx wrangler d1 execute viaggio-in-india-qa-db --remote --config wrangler.qa.jsonc --file $Path | Out-Null
    if ($LASTEXITCODE -eq 0) { return $true }
    if ($attempt -lt 4) { Start-Sleep -Seconds (2 * $attempt) }
  }
  return $false
}

$runId = [guid]::NewGuid().ToString("N")
$ownerId = "qa-owner-$runId"
$otherId = "qa-other-$runId"
$coordinatorId = "qa-coordinator-$runId"
$unclaimedId = "qa-unclaimed-$runId"
$referencePostId = "qa-reference-$runId"
$ownerToken = New-QaToken
$otherToken = New-QaToken
$coordinatorToken = New-QaToken
$expiredToken = New-QaToken
$secondaryDeviceToken = New-QaToken
$secondaryDeviceId = "device-owner-secondary-$runId"
$created = [DateTime]::UtcNow.ToString("o")
$expires = [DateTime]::UtcNow.AddHours(3).ToString("o")
$oldLastUse = [DateTime]::UtcNow.AddDays(-30).ToString("o")
$ids = @($ownerId, $otherId, $coordinatorId, $unclaimedId)
$quotedIds = ($ids | ForEach-Object { "'$_'" }) -join ","

$setupSql = @"
DELETE FROM rate_limits;
INSERT OR IGNORE INTO profiles(id,name,surname,role,created_at) VALUES
('$ownerId','Proprietario','QA','traveler','$created'),
('$otherId','Secondo','QA','traveler','$created'),
('$coordinatorId','Coordinatore','QA','coordinator','$created'),
('$unclaimedId','Invitato','QA','traveler','$created');
INSERT OR IGNORE INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES
('$(Get-TokenHash $ownerToken)','$ownerId','device-owner-$runId','Telefono proprietario QA','$created','$created','$expires',NULL),
('$(Get-TokenHash $secondaryDeviceToken)','$ownerId','$secondaryDeviceId','Secondo telefono proprietario QA','$created','$created','$expires',NULL),
('$(Get-TokenHash $otherToken)','$otherId','device-other-$runId','Secondo telefono QA','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorToken)','$coordinatorId','device-coordinator-$runId','Telefono coordinatore QA','$created','$created','$expires',NULL),
('$(Get-TokenHash $expiredToken)','$ownerId','device-expired-$runId','Sessione inattiva QA','$oldLastUse','$oldLastUse','$expires',NULL);
INSERT OR IGNORE INTO posts(id,author_name,profile_id,day_index,visibility,text,created_at)
VALUES('$referencePostId','Proprietario QA','$ownerId',-1,'public','Pubblicazione di riferimento QA $runId','$created');
"@

$testExit = 1
try {
  $setupFile = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($setupFile, $setupSql, [Text.UTF8Encoding]::new($false))
  $setupOk = Invoke-D1File $setupFile
  Remove-Item -LiteralPath $setupFile -Force
  if (-not $setupOk) { throw "Preparazione QA non riuscita" }
  $env:TEST_BASE_URL = $BaseUrl
  $env:TEST_EXPECTED_VERSION = $ExpectedVersion
  $env:QA_SESSION_TOKEN = $ownerToken
  $env:QA_PROFILE_ID = $ownerId
  $env:QA_SECOND_SESSION_TOKEN = $otherToken
  $env:QA_SECOND_PROFILE_ID = $otherId
  $env:QA_COORDINATOR_TOKEN = $coordinatorToken
  $env:QA_UNCLAIMED_PROFILE_ID = $unclaimedId
  $env:QA_EXPIRED_SESSION_TOKEN = $expiredToken
  $env:QA_SECOND_DEVICE_ID = $secondaryDeviceId
  $env:QA_RUN_ID = $runId
  $env:RUN_LOAD = if ($RunLoad) { "true" } else { "false" }
  $env:RUN_ABUSE = if ($AbuseOnly) { "true" } else { "false" }
  if ($ExtendedRoles) {
    & node tests\extended-p0-roles.mjs
  }
  elseif ($ExtendedLocation) {
    & node tests\extended-p0-location.mjs
  }
  elseif ($ExtendedMedia) {
    & node tests\extended-p0-media-delete.mjs
  }
  elseif ($ExtendedSync) {
    & node tests\extended-p0-sync-delete.mjs
  }
  elseif ($ExtendedDocuments) {
    & node tests\extended-p0-documents.mjs
  }
  elseif ($AbuseOnly) {
    & node --test --test-concurrency=1 --test-name-pattern "limiti antispam|rate limiting" tests\production-smoke.test.mjs
  } else {
    & node --test --test-concurrency=1 tests\production-smoke.test.mjs
  }
  $testExit = $LASTEXITCODE
}
finally {
  $cleanupSql = @"
DELETE FROM comments WHERE profile_id IN ($quotedIds);
DELETE FROM reactions WHERE visitor_id IN ($quotedIds);
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE profile_id IN ($quotedIds));
DELETE FROM posts WHERE profile_id IN ($quotedIds);
DELETE FROM document_status WHERE profile_id IN ($quotedIds);
DELETE FROM locations WHERE profile_id IN ($quotedIds);
DELETE FROM profile_invites WHERE profile_id IN ($quotedIds) OR created_by IN ($quotedIds);
DELETE FROM auth_sessions WHERE profile_id IN ($quotedIds);
DELETE FROM profile_device_claims WHERE profile_id IN ($quotedIds);
DELETE FROM guest_sessions WHERE display_name IN ('Collaudo automatico $runId','Collaudo idempotenza $runId','Ospite sicurezza $runId','Antispam $runId');
DELETE FROM profiles WHERE id IN ($quotedIds);
"@
  $cleanupFile = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($cleanupFile, $cleanupSql, [Text.UTF8Encoding]::new($false))
  [void](Invoke-D1File $cleanupFile)
  Remove-Item -LiteralPath $cleanupFile -Force
}
exit $testExit
