param()

$ErrorActionPreference = "Stop"
$runId = [guid]::NewGuid().ToString("N")
$root = Join-Path ([IO.Path]::GetTempPath()) "india-migrations-$runId"
$legacyRoot = Join-Path $root "legacy"
$schemaRoot = Join-Path $root "schema"
$config = "wrangler.qa.jsonc"
$database = "viaggio-in-india-qa-db"
$node = (Get-Command node).Source
$wrangler = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA "npm-cache\_npx") -Recurse -Filter "package.json" -ErrorAction SilentlyContinue |
  Where-Object { $_.Directory.Name -eq "wrangler" } |
  ForEach-Object {
    try {
      $package = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
      if ($package.version -eq "4.118.0") { Join-Path $_.Directory.FullName "bin\wrangler.js" }
    } catch {}
  } |
  Select-Object -First 1
if (-not $wrangler) { throw "Wrangler 4.118.0 non disponibile nella cache locale" }

function Invoke-D1File([string]$persistRoot, [string]$file) {
  & $node $wrangler d1 execute $database --local --config $config --persist-to $persistRoot --file $file | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Migrazione non applicata: $file" }
}

function Invoke-D1Command([string]$persistRoot, [string]$command) {
  $raw = & $node $wrangler d1 execute $database --local --config $config --persist-to $persistRoot --command $command --json
  if ($LASTEXITCODE -ne 0) { throw "Query D1 non riuscita" }
  $joined = $raw -join [Environment]::NewLine
  $jsonStart = $joined.IndexOf("[")
  if ($jsonStart -lt 0) { throw "Risposta JSON D1 assente" }
  return ($joined.Substring($jsonStart) | ConvertFrom-Json)
}

try {
  New-Item -ItemType Directory -Path $legacyRoot, $schemaRoot | Out-Null

  $migrations = Get-ChildItem -LiteralPath "db\migrations" -Filter "*.sql" | Sort-Object Name
  if ($migrations[0].Name -ne "0001_initial.sql") { throw "Baseline 0001 mancante" }
  Invoke-D1File $legacyRoot $migrations[0].FullName

  $created = [DateTime]::UtcNow.ToString("o")
  $sentinel = "sentinel-$runId"
  $seed = @"
INSERT INTO profiles(id,name,role,created_at) VALUES('$sentinel','Dati preservati','traveler','$created');
INSERT INTO posts(id,author_name,profile_id,text,created_at) VALUES('$sentinel','Dati preservati','$sentinel','Prima versione','$created');
INSERT INTO document_status(profile_id,doc_type,status,updated_at) VALUES('$sentinel','passport','present','$created');
"@
  $seedFile = Join-Path $root "legacy-seed.sql"
  [IO.File]::WriteAllText($seedFile, $seed, [Text.UTF8Encoding]::new($false))
  Invoke-D1File $legacyRoot $seedFile

  foreach ($migration in $migrations | Select-Object -Skip 1) {
    Invoke-D1File $legacyRoot $migration.FullName
    $preserved = Invoke-D1Command $legacyRoot "SELECT (SELECT COUNT(*) FROM profiles WHERE id='$sentinel') + (SELECT COUNT(*) FROM posts WHERE id='$sentinel') + (SELECT COUNT(*) FROM document_status WHERE profile_id='$sentinel') AS preserved;"
    $preservedValue = @($preserved)[0].results[0].preserved
    if ([int]$preservedValue -ne 3) { throw "Dati persi dopo $($migration.Name): $preservedValue/3" }
  }

  $legacyCheck = Invoke-D1Command $legacyRoot "SELECT (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('profiles','posts','post_media','comments','reactions','document_status','locations','auth_sessions','guest_sessions','push_subscriptions','upload_sessions','security_audit_log')) AS tables_ok, (SELECT COUNT(*) FROM pragma_table_info('profiles') WHERE name IN ('origin_city','gender','privacy_consent_at','privacy_consent_version')) AS profile_columns, (SELECT COUNT(*) FROM pragma_table_info('auth_sessions') WHERE name IN ('device_id','device_name','device_key_hash','last_used_at')) AS session_columns;"
  $legacyRow = @($legacyCheck)[0].results[0]
  if ([int]$legacyRow.tables_ok -ne 12 -or [int]$legacyRow.profile_columns -ne 4 -or [int]$legacyRow.session_columns -ne 4) {
    throw "Schema finale incompleto dopo la catena storica"
  }

  Invoke-D1File $schemaRoot "db\schema.sql"
  Invoke-D1File $schemaRoot "db\schema.sql"
  $schemaCheck = Invoke-D1Command $schemaRoot "SELECT COUNT(*) AS tables_ok FROM sqlite_master WHERE type='table' AND name IN ('profiles','posts','post_media','comments','reactions','document_status','locations','auth_sessions','guest_sessions','push_subscriptions','upload_sessions','security_audit_log');"
  if ([int](@($schemaCheck)[0].results[0].tables_ok) -ne 12) { throw "Creazione dalla schema completa incompleta" }

  Write-Output "P0_MIGRATION_CHAIN=$($migrations.Count)/$($migrations.Count)"
  Write-Output "P0_LEGACY_DATA_PRESERVATION=3/3"
  Write-Output "P0_FULL_SCHEMA_CREATE=2/2"
} finally {
  if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
