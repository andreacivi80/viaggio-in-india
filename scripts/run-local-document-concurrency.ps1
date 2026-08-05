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
$coordinatorId = "local-coordinator-$runId"
$ownerToken = New-QaToken
$coordinatorToken = New-QaToken
$created = [DateTime]::UtcNow.ToString("o")
$expires = [DateTime]::UtcNow.AddHours(1).ToString("o")

try {
  New-Item -ItemType Directory -Path $persistRoot | Out-Null
  & npx --yes wrangler@4.118.0 d1 execute viaggio-in-india-qa-db --local --config wrangler.qa.jsonc --persist-to $persistRoot --file db\schema.sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Schema D1 locale non riuscito" }

  $sql = @"
INSERT INTO profiles(id,name,surname,role,created_at) VALUES
('$ownerId','Proprietario','Locale','traveler','$created'),
('$coordinatorId','Coordinatore','Locale','coordinator','$created');
INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES
('$(Get-TokenHash $ownerToken)','$ownerId','local-owner-device','Telefono proprietario locale','$created','$created','$expires',NULL),
('$(Get-TokenHash $coordinatorToken)','$coordinatorId','local-coordinator-device','Telefono coordinatore locale','$created','$created','$expires',NULL);
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
  $env:QA_COORDINATOR_TOKEN = $coordinatorToken
  & node tests\extended-p0-document-concurrency.mjs
  if ($LASTEXITCODE -ne 0) { throw "Test concorrenza documenti non riuscito" }
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
