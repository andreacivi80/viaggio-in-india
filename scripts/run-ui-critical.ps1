param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string[]]$TestFiles,
  [string]$Project = "Samsung-S20-FE"
)

if ($TestFiles.Count -ne 1) {
  throw "Ogni file UI deve ricevere profili e inviti QA nuovi: eseguire un solo file per volta."
}

$parsedBaseUrl = [Uri]$BaseUrl
if ($parsedBaseUrl.Scheme -ne "https" -or $parsedBaseUrl.Host -notmatch '(^|\.)viaggio-in-india-2026-qa\.pages\.dev$') {
  throw "Protezione dati: i collaudi UI scriventi possono essere eseguiti soltanto sul progetto QA isolato."
}

$ErrorActionPreference = "Stop"
$runId = [guid]::NewGuid().ToString("N")
$profileId = "qa-ui-$runId"
$profileName = "Percorso UI $($runId.Substring(0, 6))"
$coordinatorId = "qa-ui-coordinator-$runId"
$coordinatorName = "Coordinatore UI $($runId.Substring(0, 6))"
$managedProfileName = "QA UI $($runId.Substring(0, 8))"
$created = [DateTime]::UtcNow.ToString("o")
$expires = [DateTime]::UtcNow.AddHours(2).ToString("o")
$inviteToken = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
$switchInviteToken = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
$coordinatorInviteToken = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
$inviteBytes = [Text.Encoding]::UTF8.GetBytes($inviteToken)
$switchInviteBytes = [Text.Encoding]::UTF8.GetBytes($switchInviteToken)
$coordinatorInviteBytes = [Text.Encoding]::UTF8.GetBytes($coordinatorInviteToken)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
  $inviteHash = -join ($sha256.ComputeHash($inviteBytes) | ForEach-Object { $_.ToString("x2") })
  $switchInviteHash = -join ($sha256.ComputeHash($switchInviteBytes) | ForEach-Object { $_.ToString("x2") })
  $coordinatorInviteHash = -join ($sha256.ComputeHash($coordinatorInviteBytes) | ForEach-Object { $_.ToString("x2") })
}
finally {
  $sha256.Dispose()
}

function Invoke-D1Sql([string]$Sql) {
  for ($attempt = 1; $attempt -le 4; $attempt += 1) {
    & npx wrangler d1 execute viaggio-in-india-qa-db --remote --config wrangler.qa.jsonc --command $Sql | Out-Null
    if ($LASTEXITCODE -eq 0) { return $true }
    if ($attempt -lt 4) { Start-Sleep -Seconds (2 * $attempt) }
  }
  return $false
}

$testExit = 1
try {
  $setupSql = "DELETE FROM rate_limits; INSERT INTO profiles(id,name,surname,role,created_at) VALUES('$profileId','$profileName','','traveler','$created'); INSERT INTO profiles(id,name,surname,role,created_at) VALUES('$coordinatorId','$coordinatorName','','coordinator','$created'); INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('$inviteHash','$profileId','$coordinatorId','$created','$expires',NULL); INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('$switchInviteHash','$profileId','$coordinatorId','$created','$expires',NULL); INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES('$coordinatorInviteHash','$coordinatorId','$coordinatorId','$created','$expires',NULL);"
  if (-not (Invoke-D1Sql $setupSql)) { throw "Preparazione profilo UI non riuscita" }

  $env:TEST_BASE_URL = $BaseUrl
  $env:QA_UI_PROFILE_NAME = $profileName
  $env:QA_UI_INVITE_TOKEN = $inviteToken
  $env:QA_UI_SWITCH_INVITE_TOKEN = $switchInviteToken
  $env:QA_UI_COORDINATOR_NAME = $coordinatorName
  $env:QA_UI_COORDINATOR_INVITE_TOKEN = $coordinatorInviteToken
  $env:QA_UI_MANAGED_PROFILE_NAME = $managedProfileName
  $env:QA_UI_ALLOW_REGISTRATION = "true"
  & npx playwright test @TestFiles --config playwright.release.config.mjs --project=$Project
  $testExit = $LASTEXITCODE
}
finally {
  $cleanupSql = @"
DELETE FROM comments WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM reactions WHERE visitor_id IN ('$profileId','$coordinatorId');
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE profile_id IN ('$profileId','$coordinatorId'));
DELETE FROM posts WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM document_status WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM locations WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM profile_invites WHERE profile_id IN ('$profileId','$coordinatorId') OR created_by IN ('$profileId','$coordinatorId');
DELETE FROM auth_sessions WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM profile_device_claims WHERE profile_id IN ('$profileId','$coordinatorId');
DELETE FROM profile_invites WHERE profile_id IN (SELECT id FROM profiles WHERE name='$managedProfileName') OR created_by IN (SELECT id FROM profiles WHERE name='$managedProfileName');
DELETE FROM auth_sessions WHERE profile_id IN (SELECT id FROM profiles WHERE name='$managedProfileName');
DELETE FROM profile_device_claims WHERE profile_id IN (SELECT id FROM profiles WHERE name='$managedProfileName');
DELETE FROM profiles WHERE name='$managedProfileName';
DELETE FROM profiles WHERE id IN ('$profileId','$coordinatorId');
"@
  $compactCleanupSql = ($cleanupSql -replace '\s+', ' ').Trim()
  if (-not (Invoke-D1Sql $compactCleanupSql)) {
    Write-Error "Pulizia profili UI non riuscita: $profileId, $coordinatorId"
    if ($testExit -eq 0) { $testExit = 2 }
  }
}
exit $testExit
