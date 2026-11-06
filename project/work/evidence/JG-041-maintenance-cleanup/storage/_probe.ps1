
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench'
$out  = Join-Path $repo 'output'
$stor = 'C:\Users\Markimus\.codex\worktrees\cleanup-2026-11-05\jgun-torque-wrench\project\work\evidence\JG-041-maintenance-cleanup\storage'
New-Item -ItemType Directory -Force -Path $stor | Out-Null
Set-Content -LiteralPath (Join-Path $stor '_progress.txt') -Encoding utf8 -Value ('B3 start ' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ssZ'))

$cutoffArchive = [datetime]::Parse('2026-10-22T04:00:00Z').ToUniversalTime()
$cutoffHold    = [datetime]::Parse('2026-10-29T00:00:00Z').ToUniversalTime()
$BIG5 = @('owner-corrections','page-cinematography','page-cinematography-2026-10-28','final-cascade-2026-10-26','cascade-control-refinement-2026-10-30-full-r2')

function Add-Row($rel,$abs,$name,$kind,$area) {
  [pscustomobject]@{ rel=$rel; abs=$abs; name=$name; kind=$kind; area=$area }
}
$rows = New-Object System.Collections.Generic.List[object]
Get-ChildItem -LiteralPath $out -Force -File | ForEach-Object {
  $rows.Add((Add-Row ('output/' + $_.Name) $_.FullName $_.Name 'file' '(output-root)'))
}
Get-ChildItem -LiteralPath (Join-Path $out 'playwright') -Force | ForEach-Object {
  $rel = 'output/playwright/' + $_.Name
  if ($BIG5 -contains $_.Name) {
    Get-ChildItem -LiteralPath $_.FullName -Force | ForEach-Object {
      $rows.Add((Add-Row ($rel + '/' + $_.Name) $_.FullName $_.Name ($(if ($_.PSIsContainer) {'dir'} else {'file'})) $_.___dummy))
    } 2>$null
  } elseif ($_.PSIsContainer) {
    $rows.Add((Add-Row $rel $_.FullName $_.Name 'dir' '(playwright)'))
  } else {
    $rows.Add((Add-Row $rel $_.FullName $_.Name 'file' '(playwright)'))
  }
}
"row_build_phase1=$($rows.Count)" | Add-Content -LiteralPath (Join-Path $stor '_progress.txt')
exit 0

