param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string]$ExpectedVersion,
  [int]$MaxAttempts = 24
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")
$consecutivePasses = 0

function Invoke-CheckedRequest([string]$Uri) {
  try {
    $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -Headers @{ "Cache-Control" = "no-cache" } -TimeoutSec 15
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Content = [string]$response.Content; ContentType = [string]$response.Headers["Content-Type"] }
  }
  catch {
    $response = $_.Exception.Response
    if (-not $response) { return [pscustomobject]@{ Status = 0; Content = $_.Exception.Message; ContentType = "" } }
    $status = [int]$response.StatusCode
    $contentType = [string]$response.Headers["Content-Type"]
    return [pscustomobject]@{ Status = $status; Content = ""; ContentType = $contentType }
  }
}

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt += 1) {
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $page = Invoke-CheckedRequest "$base/?ready=$stamp"
  $health = Invoke-CheckedRequest "$base/api/health?ready=$stamp"
  $private = Invoke-CheckedRequest "$base/api/private?ready=$stamp"
  $assetPath = if ($page.Content -match '/assets/index-[^"'']+\.js') { $Matches[0] } else { "" }
  $bundle = if ($assetPath) { Invoke-CheckedRequest "${base}${assetPath}?ready=${stamp}" } else { $null }
  $ready = $page.Status -eq 200 -and $health.Status -eq 200 -and
    $private.Status -eq 401 -and
    $bundle -and $bundle.Status -eq 200 -and $bundle.Content.Contains($ExpectedVersion)
  Write-Output ("DEPLOYMENT_CHECK={0};page={1};health={2};private={3};bundle={4};version={5}" -f `
    $attempt, $page.Status, $health.Status, $private.Status, $(if ($bundle) { $bundle.Status } else { 0 }), `
    $(if ($bundle) { $bundle.Content.Contains($ExpectedVersion) } else { $false }))
  if ($ready) {
    $consecutivePasses += 1
    if ($consecutivePasses -ge 2) {
      Write-Output "DEPLOYMENT_READY=$base"
      exit 0
    }
  }
  else { $consecutivePasses = 0 }
  if ($attempt -lt $MaxAttempts) { Start-Sleep -Seconds 2 }
}

throw "Deployment non pronto dopo $MaxAttempts verifiche: $base"
