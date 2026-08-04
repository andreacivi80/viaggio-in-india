param(
  [Parameter(Mandatory = $true)][string]$BaseUrl
)

$ErrorActionPreference = "Stop"
$runId = [guid]::NewGuid().ToString("N")
$coordinatorName = "Avvio$($runId.Substring(0, 8))"
$postMarker = "QA bootstrap $runId"

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
  if (-not (Invoke-D1Sql "DELETE FROM rate_limits;")) {
    throw "Pulizia contatori QA non riuscita"
  }
  $countsJson = & npx wrangler d1 execute viaggio-in-india-qa-db --remote --config wrangler.qa.jsonc --json --command "SELECT COUNT(*) AS profiles FROM profiles; SELECT COUNT(*) AS sessions FROM auth_sessions;"
  if ($LASTEXITCODE -ne 0) { throw "Verifica database non riuscita" }
  $counts = $countsJson | ConvertFrom-Json
  if ([int]$counts[0].results[0].profiles -ne 0 -or [int]$counts[1].results[0].sessions -ne 0) {
    throw "Il bootstrap richiede database vuoto: profili=$($counts[0].results[0].profiles), sessioni=$($counts[1].results[0].sessions)"
  }

  $env:TEST_BASE_URL = $BaseUrl
  $env:QA_BOOTSTRAP_NAME = $coordinatorName
  $env:QA_BOOTSTRAP_POST = $postMarker
  & npx playwright test tests/ui-bootstrap.spec.mjs
  $testExit = $LASTEXITCODE
}
finally {
  $cleanupSql = @"
DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE text='$postMarker');
DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts WHERE text='$postMarker');
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE text='$postMarker');
DELETE FROM posts WHERE text='$postMarker';
DELETE FROM document_status WHERE profile_id IN (SELECT id FROM profiles WHERE name='$coordinatorName');
DELETE FROM locations WHERE profile_id IN (SELECT id FROM profiles WHERE name='$coordinatorName');
DELETE FROM profile_invites WHERE profile_id IN (SELECT id FROM profiles WHERE name='$coordinatorName') OR created_by IN (SELECT id FROM profiles WHERE name='$coordinatorName');
DELETE FROM auth_sessions WHERE profile_id IN (SELECT id FROM profiles WHERE name='$coordinatorName');
DELETE FROM profile_device_claims WHERE profile_id IN (SELECT id FROM profiles WHERE name='$coordinatorName');
DELETE FROM profiles WHERE name='$coordinatorName';
"@
  $compactCleanupSql = ($cleanupSql -replace '\s+', ' ').Trim()
  if (-not (Invoke-D1Sql $compactCleanupSql)) {
    Write-Error "Pulizia bootstrap QA non riuscita: $coordinatorName"
    if ($testExit -eq 0) { $testExit = 2 }
  }
  Remove-Item Env:QA_BOOTSTRAP_NAME -ErrorAction SilentlyContinue
  Remove-Item Env:QA_BOOTSTRAP_POST -ErrorAction SilentlyContinue
}
exit $testExit
