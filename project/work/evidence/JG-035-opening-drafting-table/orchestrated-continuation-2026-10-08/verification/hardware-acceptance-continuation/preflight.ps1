param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("before", "after")]
  [string]$Phase
)

$ErrorActionPreference = "Stop"
$root = (git -C $PSScriptRoot rev-parse --show-toplevel).Replace("/", "\")
$dist = Join-Path $root ".scratch/v1-frozen-dist"
$expected = "9eb4b49066d06408627aa6e38967553fd63ce8953586b99c97015956d344bded"

$response = Invoke-WebRequest -Uri "http://127.0.0.1:4174/" -Method Head -TimeoutSec 10 -UseBasicParsing
$files = Get-ChildItem -LiteralPath $dist -Recurse -File | Sort-Object FullName
$manifestLines = foreach ($file in $files) {
  $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  $relative = $file.FullName.Substring($dist.Length + 1).Replace("\", "/")
  "$hash  $relative"
}
$manifestText = ($manifestLines -join "`n") + "`n"
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($manifestText))
$aggregateHash = ([System.BitConverter]::ToString($hashBytes) -replace "-", "").ToLowerInvariant()
$distBytes = [long](($files | Measure-Object Length -Sum).Sum)

$result = [ordered]@{
  phase = $Phase
  checkedUtc = (Get-Date).ToUniversalTime().ToString("o")
  url = "http://127.0.0.1:4174/"
  httpStatus = [int]$response.StatusCode
  distPath = $dist
  distFiles = @($files).Count
  distBytes = $distBytes
  distAggregateSha256 = $aggregateHash
  expectedDistAggregateSha256 = $expected
  frozenDistUnchanged = ($aggregateHash -eq $expected)
}

if ($result.httpStatus -ne 200) { throw "Frozen preview readiness failed: HTTP $($result.httpStatus)" }
if (-not $result.frozenDistUnchanged) { throw "Frozen dist aggregate changed: $aggregateHash" }

$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot "preflight-$Phase.json")
Write-Output (ConvertTo-Json $result -Compress)
