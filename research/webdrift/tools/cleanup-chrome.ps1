$procs = Get-CimInstance Win32_Process -Filter "name='chrome.exe'" |
  Where-Object { $_.CommandLine -match 'rea-webdrift|rea-wd-' }
if ($procs) {
  foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output ("killed " + $p.ProcessId)
  }
} else {
  Write-Output "no probe chrome found"
}
