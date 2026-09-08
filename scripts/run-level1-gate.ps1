param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [string]$ExpectedVersion = "1.33.1",
  [switch]$DeployOnly,
  [switch]$SmokeOnly
)

$ErrorActionPreference = "Stop"
$gateStartedAt = [DateTime]::UtcNow.ToString("o")

if ($SmokeOnly) {
  $env:TEST_BASE_URL = $BaseUrl
  $env:TEST_EXPECTED_VERSION = $ExpectedVersion
  & node --test --test-concurrency=1 tests/production-smoke.test.mjs
  exit $LASTEXITCODE
}

$parsedBaseUrl = [Uri]$BaseUrl
if ($parsedBaseUrl.Scheme -ne "https" -or $parsedBaseUrl.Host -notmatch '(^|\.)viaggio-in-india-2026-qa\.pages\.dev$') {
  throw "Protezione dati: il gate completo con scritture può essere eseguito soltanto sul progetto QA isolato. Usare -SmokeOnly per la sola lettura ufficiale."
}

if ($DeployOnly) {
  & .\scripts\deploy-qa.ps1 -Branch main
  exit $LASTEXITCODE
}

function Assert-LastExit([string]$Label) {
  if ($LASTEXITCODE -ne 0) { throw "Primo livello fallito: $Label" }
  Write-Host "[L1 PASS] $Label"
}

function Run-Ui([string]$File) {
  & .\scripts\run-ui-critical.ps1 -BaseUrl $BaseUrl -TestFiles @($File)
  Assert-LastExit $File
}

Write-Host "[L1] Controlli locali e build"
& npm test
Assert-LastExit "unitari e build"

Write-Host "[L0] Confine pubblico, password e sessione personale"
$env:TEST_BASE_URL = $BaseUrl
$env:QA_UI_GROUP_CODE = $env:QA_GROUP_CODE
& npx playwright test tests/ui-public-access-boundary.spec.mjs
Assert-LastExit "confine accessi livello zero"
Remove-Item Env:QA_UI_GROUP_CODE -ErrorAction SilentlyContinue

Write-Host "[L1] Primo accesso su database vuoto"
& .\scripts\run-ui-bootstrap.ps1 -BaseUrl $BaseUrl
Assert-LastExit "bootstrap e riapertura"

$uiFiles = @(
  "tests/ui-critical.spec.mjs",
  "tests/ui-navigation.spec.mjs",
  "tests/ui-responsive.spec.mjs",
  "tests/ui-media.spec.mjs",
  "tests/ui-social.spec.mjs",
  "tests/ui-documents.spec.mjs",
  "tests/ui-location.spec.mjs",
  "tests/ui-people.spec.mjs",
  "tests/ui-role-live.spec.mjs",
  "tests/ui-secondary.spec.mjs",
  "tests/ui-comment-media.spec.mjs",
  "tests/ui-offline.spec.mjs"
)
foreach ($file in $uiFiles) { Run-Ui $file }

Write-Host "[L1] Bacheca e responsive visivo"
$env:TEST_BASE_URL = $BaseUrl
& npx playwright test tests/ui-home-visual.spec.mjs
Assert-LastExit "bacheca visuale"

Write-Host "[L1] Sicurezza e affidabilità autenticata"
& .\scripts\run-authenticated-qa.ps1 -BaseUrl $BaseUrl -ExpectedVersion $ExpectedVersion
Assert-LastExit "sicurezza autenticata"
& .\scripts\run-authenticated-qa.ps1 -BaseUrl $BaseUrl -ExpectedVersion $ExpectedVersion -RunLoad
Assert-LastExit "carico concorrente"
& .\scripts\run-authenticated-qa.ps1 -BaseUrl $BaseUrl -ExpectedVersion $ExpectedVersion -AbuseOnly
Assert-LastExit "antispam e rate limit"

Write-Host "[L1] Verifica pulizia database QA"
$cleanupSql = "DELETE FROM reactions WHERE post_id='weroad-predeparture'; DELETE FROM comment_reactions WHERE comment_id IN (SELECT id FROM comments WHERE post_id='weroad-predeparture'); DELETE FROM post_media WHERE post_id='weroad-predeparture'; DELETE FROM comments WHERE post_id='weroad-predeparture'; DELETE FROM posts WHERE id='weroad-predeparture'; DELETE FROM security_audit_log WHERE created_at >= '$gateStartedAt';"
for ($cleanupAttempt = 1; $cleanupAttempt -le 3; $cleanupAttempt += 1) {
  & npx wrangler d1 execute viaggio-in-india-qa-db --remote --config wrangler.qa.jsonc --command $cleanupSql | Out-Null
  Assert-LastExit "pulizia circoscritta dati gate"
  $countsJson = & npx wrangler d1 execute viaggio-in-india-qa-db --remote --config wrangler.qa.jsonc --json --command "SELECT COUNT(*) AS profiles FROM profiles; SELECT COUNT(*) AS posts FROM posts; SELECT COUNT(*) AS comments FROM comments; SELECT COUNT(*) AS documents FROM document_status; SELECT COUNT(*) AS locations FROM locations; SELECT COUNT(*) AS sessions FROM auth_sessions; SELECT COUNT(*) AS audit_events FROM security_audit_log;"
  Assert-LastExit "lettura pulizia QA"
  $counts = $countsJson | ConvertFrom-Json
  $dirty = @()
  foreach ($result in $counts) {
    foreach ($property in $result.results[0].PSObject.Properties) {
      if ([int]$property.Value -ne 0) { $dirty += "$($property.Name)=$($property.Value)" }
    }
  }
  if ($dirty.Count -eq 0) { break }
  if ($cleanupAttempt -lt 3 -and $dirty.Count -eq 1 -and $dirty[0] -match '^audit_events=') {
    Start-Sleep -Seconds 1
    continue
  }
  throw "Database QA non pulito: $($dirty -join ', ')"
}
Write-Host "[L1 PASS] database QA pulito"
Write-Host "[L1 COMPLETE] 109/109"
