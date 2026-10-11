param([string]$Needle = 'vite.js preview --strictPort --port 4173')
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Needle) } | ForEach-Object {
  $parent = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $_.ParentProcessId)
  "{0} ppid={1} ({2}) start={3:HH:mm:ss} cmd={4}" -f $_.ProcessId, $_.ParentProcessId, $parent.Name, $_.CreationDate, $_.CommandLine
}
