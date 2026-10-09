$ErrorActionPreference = "Stop"

$root = "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio"
$packet = Join-Path $root "project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/verification/hardware-acceptance-corrected-reruns"
$stdout = Join-Path $packet "logs/preview-4174-restart.stdout.log"
$stderr = Join-Path $packet "logs/preview-4174-restart.stderr.log"

$existing = Get-NetTCPConnection -LocalPort 4174 -ErrorAction SilentlyContinue | Where-Object State -eq "Listen"
if ($existing) { throw "Port 4174 already has listener PID $($existing[0].OwningProcess)" }

$process = Start-Process -FilePath "node" -ArgumentList @(
  "node_modules/vite/bin/vite.js",
  "preview",
  "--outDir", ".scratch/v1-frozen-dist",
  "--host", "127.0.0.1",
  "--port", "4174",
  "--strictPort"
) -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

Start-Sleep -Seconds 2
$response = $null
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:4174/" -Method Head -TimeoutSec 10 -UseBasicParsing
} catch {
}

$receipt = [ordered]@{
  restartedUtc = (Get-Date).ToUniversalTime().ToString("o")
  reason = "Recorded PID 262212 absent; no 4174 listener; frozen dist snapshot unchanged"
  command = "node node_modules/vite/bin/vite.js preview --outDir .scratch/v1-frozen-dist --host 127.0.0.1 --port 4174 --strictPort"
  pid = $process.Id
  hasExited = $process.HasExited
  httpStatus = if ($response) { [int]$response.StatusCode } else { $null }
  stdout = $stdout
  stderr = $stderr
}

$receipt | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $packet "preview-4174-restart.json")
Write-Output (ConvertTo-Json $receipt -Compress)
