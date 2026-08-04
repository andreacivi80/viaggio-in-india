param(
  [Parameter(Mandatory = $true)][string]$BaseUrl
)

$ErrorActionPreference = "Stop"
$tests = @(
  "tests/ui-critical.spec.mjs",
  "tests/ui-navigation.spec.mjs",
  "tests/ui-social.spec.mjs",
  "tests/ui-media.spec.mjs",
  "tests/ui-documents.spec.mjs",
  "tests/ui-location.spec.mjs",
  "tests/ui-people.spec.mjs",
  "tests/ui-role-live.spec.mjs",
  "tests/ui-responsive.spec.mjs",
  "tests/ui-secondary.spec.mjs"
)
$passed = 0
foreach ($testFile in $tests) {
  Write-Host "`n=== $testFile ==="
  & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\run-ui-critical.ps1" -BaseUrl $BaseUrl -TestFiles $testFile
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Suite UI interrotta: $testFile non superato ($passed/$($tests.Count) file completati)."
    exit $LASTEXITCODE
  }
  $passed += 1
}
Write-Host "`nSuite UI completata: $passed/$($tests.Count) file superati."
