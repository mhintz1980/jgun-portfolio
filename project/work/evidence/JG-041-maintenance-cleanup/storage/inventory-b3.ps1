$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench'
Set-Location $repo
$out  = Join-Path $repo 'output'
$stor = 'C:\Users\Markimus\.codex\worktrees\cleanup-2026-11-05\jgun-torque-wrench\project\work\evidence\JG-041-maintenance-cleanup\storage'
New-Item -ItemType Directory -Force -Path $stor | Out-Null
$prog = Join-Path $stor '_progress.txt'
Set-Content -LiteralPath $prog -Encoding utf8 -Value ('B3 start ' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ssZ'))
function Log($m){ $m | Add-Content -LiteralPath $prog }
$cutoffArchive = [datetime]'2026-10-22T04:00:00Z'
$cutoffHold    = [datetime]'2026-10-29T00:00:00Z'
$BIG5 = @('owner-corrections','page-cinematography','page-cinematography-2026-10-28','final-cascade-2026-10-26','cascade-control-refinement-2026-10-30-full-r2')
$rows = New-Object System.Collections.Generic.List[object]
function Add-Row([string]$rel,[string]$abs,[string]$name,[string]$kind,[string]$area){
  $rows.Add([pscustomobject]@{ rel=$rel; abs=$abs; name=$name; kind=$kind; area=$area })
}
Get-ChildItem -LiteralPath $out -Force -File | ForEach-Object {
  Add-Row ('output/' + $_.Name) $_.FullName $_.Name 'file' '(output-root)'
}
Get-ChildItem -LiteralPath (Join-Path $out 'playwright') -Force | ForEach-Object {
  $a = $_.Name; $rel = 'output/playwright/' + $a
  if ($BIG5 -contains $a) {
    Get-ChildItem -LiteralPath $_.FullName -Force | ForEach-Object {
      if ($_.PSIsContainer) { Add-Row ($rel + '/' + $_.Name) $_.FullName $_.Name 'dir' $a }
      else { Add-Row ($rel + '/' + $_.Name) $_.FullName $_.Name 'file' $a }
    }
  } elseif ($_.PSIsContainer) { Add-Row $rel $_.FullName $a 'dir' '(playwright)' }
  else { Add-Row $rel $_.FullName $a 'file' '(playwright)' }
}
Get-ChildItem -LiteralPath (Join-Path $out 'high-low-feature-proof') -Force | ForEach-Object {
  if ($_.PSIsContainer) { Add-Row ('output/high-low-feature-proof/' + $_.Name) $_.FullName $_.Name 'dir' 'high-low-feature-proof' }
  else { Add-Row ('output/high-low-feature-proof/' + $_.Name) $_.FullName $_.Name 'file' 'high-low-feature-proof' }
}
Log ('rows=' + $rows.Count)
$rootRefFiles = @(Get-ChildItem -LiteralPath $repo -File | Where-Object { $_.Extension -in '.md','.json','.ts','.mjs' } | ForEach-Object { $_.FullName })
Log ('rootRefFiles=' + $rootRefFiles.Count)
$refScopeArgs = @((Join-Path $repo 'docs'),(Join-Path $repo 'project'),(Join-Path $repo 'scripts'),(Join-Path $repo 'src'),(Join-Path $repo 'remotion')) + $rootRefFiles
function Get-Refs([string]$name){
  @(& rg -l --fixed-strings --no-messages -- $name @refScopeArgs 2>$null | Where-Object { $_ -ne '' } | ForEach-Object { $_.Replace('\\','/') })
}
function Get-GitStatus([string]$rel){
  $t = @(& git -C $repo ls-files -- $rel 2>$null | Where-Object { $_ -ne '' })
  $tracked = $t.Count
  & git -C $repo check-ignore -q -- $rel 2>$null
  $ignored = ($LASTEXITCODE -eq 0)
  $parts = @()
  if ($ignored) { $parts += 'ignored' }
  if ($tracked -gt 0) { $parts += ('tracked=' + $tracked) }
  if ($parts.Count -eq 0) { $parts += 'untracked' }
  ($parts -join ';')
}
function Measure-Run($row){
  if ($row.kind -eq 'file') {
    $fi = Get-Item -LiteralPath $row.abs -Force
    return [pscustomobject]@{ files=1; bytes=$fi.Length; newest=$fi.LastWriteTimeUtc }
  }
  $all = @(Get-ChildItem -LiteralPath $row.abs -Recurse -File -Force -ErrorAction SilentlyContinue)
  if ($all.Count -eq 0) { return [pscustomobject]@{ files=0; bytes=0; newest=$null } }
  $sum = [long]0; $newest = $all[0].LastWriteTimeUtc
  foreach ($f in $all) { $sum += $f.Length; if ($f.LastWriteTimeUtc -gt $newest) { $newest = $f.LastWriteTimeUtc } }
  [pscustomobject]@{ files=$all.Count; bytes=$sum; newest=$newest }
}
$pinned = @{
  'output/high-low-feature-proof/73-same-program' = 'plan s4 seed: evidence 70 cited proof run'
  'output/high-low-feature-proof/73-terminal-final' = 'plan s4 seed: evidence 70 cited proof run'
  'output/high-low-feature-proof/geometry' = 'evidence 70 packet cites output/high-low-feature-proof/geometry/analyze-geometry.mjs'
  'output/playwright/page-cinematography/73-reconciliation-final' = 'plan s4: evidence 73 final reconciliation run'
  'output/playwright/page-cinematography/73-narrow-lite-recovery' = 'plan s4: evidence 73 narrow-lite recovery run'
  'output/playwright/torque-camera-hud-73-final' = 'plan s4: evidence 72/73 cited camera-HUD proof'
  'output/playwright/torque-camera-hud-2026-10-21' = 'plan s4 pins subdir after/; whole run kept as pinned packet'
  'output/playwright/studiomark-wip-2026-10-31' = 'plan s4 + evidence 74 cites local/, production/, local-reduced-recovery/'
  'output/playwright/studiomark-home-release-local' = 'plan s4 JG-039 homepage proof; release record cites report.json'
  'output/playwright/studiomark-home-release-production' = 'plan s4 JG-039 homepage proof; release record cites report.json'
  'output/playwright/home-header' = 'plan s4 JG-039 homepage proof; evidence 72 cites summary.json'
  'output/playwright/jg040-stage3-20261104' = 'plan s4 JG-040 release set: release/ holds archived exact uploaded bundle; final/dist cited'
  'output/playwright/torque-camera-hud-jg040-rebaseline' = 'JG-040 review set; stage3 records cite after-final/'
}
$explicitHolds = @{
  'output/playwright/jg040-corrections-narrow2' = @('HOLD-active','plan s4 area table: hold - recent HUD evidence')
  'output/playwright/owner-visual-preview-2026-10-28' = @('HOLD-owner-review','plan s4 area table: hold pending reference/owner-review classification')
}
$holdPatterns = @('jg040*','torque-tracker*','studiomark*','logo*','live-2026-11-04*','stage3*','cascade*','owner*')
function Classify($row,[datetime]$newest,[string]$gitStatus,[int]$refCount,[bool]$ignorePins){
  if (-not $ignorePins -and $pinned.ContainsKey($row.rel)) {
    return [pscustomobject]@{ cls='PINNED'; reason=$pinned[$row.rel] }
  }
  if ($explicitHolds.ContainsKey($row.rel)) {
    $h = $explicitHolds[$row.rel]
    return [pscustomobject]@{ cls=$h[0]; reason=$h[1] }
  }
  if ($row.area -eq 'high-low-feature-proof') {
    return [pscustomobject]@{ cls='HOLD-owner-review'; reason='plan s4: output/high-low-feature-proof/ remains held (cited evidence inside)' }
  }
  $mt = if ($newest) { $newest.ToString('yyyy-MM-dd HH:mm:ssZ') } else { 'empty' }
  if ($newest -and $newest -ge $cutoffHold) {
    return [pscustomobject]@{ cls='HOLD-active'; reason=('newest mtime ' + $mt + ' >= 2026-10-29Z') }
  }
  foreach ($p in $holdPatterns) {
    if ($row.name -like $p) {
      return [pscustomobject]@{ cls='HOLD-owner-review'; reason=('name matches hold pattern ' + $p) }
    }
  }
  if (-not $newest -or $newest -lt $cutoffArchive) {
    if ($refCount -gt 0) {
      return [pscustomobject]@{ cls='ARCHIVE-candidate'; reason=('inactive < 2026-10-22T04:00Z; ' + $refCount + ' inbound ref(s) in searched scopes; historically referenced, not proof') }
    }
    $tracked = $gitStatus -match 'tracked='
    $excl = ($row.rel -match '(^|/)(\.scratch|dist|project|public|remotion)/')
    if ($excl -or $tracked) {
      return [pscustomobject]@{ cls='KEEP-unknown'; reason='old + 0 refs but inside excluded tree or git-tracked; needs decision' }
    }
    return [pscustomobject]@{ cls='DELETE-candidate'; reason=('inactive < 2026-10-22T04:00Z; 0 inbound refs in searched scopes; ' + $gitStatus + '; not pinned') }
  }
  [pscustomobject]@{ cls='KEEP-unknown'; reason='mtime between 2026-10-22T04:00Z and 2026-10-29Z; no hold pattern; not pinned' }
}
$outRows = New-Object System.Collections.Generic.List[object]
$swTotal = [diagnostics.stopwatch]::StartNew()
$i = 0
foreach ($row in $rows) {
  $m = Measure-Run $row
  $gitStatus = Get-GitStatus $row.rel
  $refs = @(Get-Refs $row.name)
  $refSample = (($refs | Select-Object -First 3) -join '; ')
  if ($refSample.Length -gt 240) { $refSample = $refSample.Substring(0,240) }
  $fin = Classify $row $m.newest $gitStatus $refs.Count $false
  $raw = Classify $row $m.newest $gitStatus $refs.Count $true
  $mtStr = if ($m.newest) { $m.newest.ToString('yyyy-MM-dd HH:mm:ss') + 'Z' } else { '' }
  $outRows.Add([pscustomobject]@{
    path=$row.rel; files=$m.files; logical_bytes=$m.bytes; newest_mtime_utc=$mtStr
    git_status=$gitStatus; reference_count=$refs.Count; reference_sample=$refSample
    classification=$fin.cls; reason=$fin.reason; raw_class_unpinned=$raw.cls; area=$row.area
  })
  $i++
  if ($i % 10 -eq 0) { Log ('rows_done=' + $i + ' elapsed_s=' + [int]$swTotal.Elapsed.TotalSeconds) }
}
Log 'writing outputs'
$manifest = Join-Path $stor 'manifest.csv'
$outRows | Export-Csv -LiteralPath $manifest -NoTypeInformation -Encoding utf8
$kl = New-Object System.Collections.Generic.List[string]
$kl.Add('# JG-041 B3 keep-list (pinned + held runs)')
$kl.Add('')
$kl.Add('Generated ' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ssZ') + ' from manifest.csv. Inventory only; nothing deleted or moved.')
$kl.Add('')
$kl.Add('| path | classification | files | logical_bytes | newest_mtime_utc | reason |')
$kl.Add('|---|---|---:|---:|---|---|')
foreach ($r in ($outRows | Where-Object { $_.classification -like 'PINNED*' -or $_.classification -like 'HOLD*' } | Sort-Object logical_bytes -Descending)) {
  $kl.Add(('| ' + $r.path + ' | ' + $r.classification + ' | ' + $r.files + ' | ' + $r.logical_bytes + ' | ' + $r.newest_mtime_utc + ' | ' + ($r.reason -replace '\|','/') + ' |'))
}
$kl.Add('')
$kl.Add('## Citing evidence (searched scopes)')
$kl.Add('')
$kl.Add('- Evidence 70 packet: project/work/evidence/torque-wrench-rebuild/70-high-low-feature-proof-2026-10-30/')
$kl.Add('- Evidence 74 packet: project/work/evidence/torque-wrench-rebuild/74-work-in-progress-publication-2026-10-31/')
$kl.Add('- Evidence 72/73 docs: docs/torque-wrench-rebuild/72-owner-review-and-control-refinement-2026-10-30.md, 73-verification-reconciliation-plan-2026-10-30.md')
$kl.Add('- JG-039 release record: project/work/evidence/JG-039-homepage/release-2026-11-03.md')
$kl.Add('- JG-040 records: project/work/evidence/JG-040-hud-d-inline/ (stage3 release-2026-11-04.md, live-2026-11-04, torque-tracker-2026-11-05)')
$kl.Add('- Per-run citing matches are in manifest.csv reference_sample (exact rg searches listed in summary.md).')
Set-Content -LiteralPath (Join-Path $stor 'keep-list.md') -Encoding utf8 -Value $kl
$byCls = $outRows | Group-Object classification
$sumLines = New-Object System.Collections.Generic.List[string]
$sumLines.Add('# JG-041 B3 storage inventory summary')
$sumLines.Add('')
$sumLines.Add('Generated ' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ssZ') + '. READ-ONLY inventory of the shared checkout output/ tree; no files deleted, moved, or modified. Bytes are logical file bytes (Length sum), not disk allocation.')
$sumLines.Add('')
$sumLines.Add('## Bytes by classification')
$sumLines.Add('')
$sumLines.Add('| classification | runs | files | logical_bytes |')
$sumLines.Add('|---|---:|---:|---:|')
foreach ($g in ($byCls | Sort-Object Name)) {
  $b = ($g.Group | Measure-Object logical_bytes -Sum).Sum
  $f = ($g.Group | Measure-Object files -Sum).Sum
  $sumLines.Add(('| ' + $g.Name + ' | ' + $g.Count + ' | ' + $f + ' | ' + $b + ' |'))
}
$rawDel = $outRows | Where-Object { $_.raw_class_unpinned -eq 'DELETE-candidate' }
$finDel = $outRows | Where-Object { $_.classification -eq 'DELETE-candidate' }
$arch   = $outRows | Where-Object { $_.classification -eq 'ARCHIVE-candidate' }
$sumLines.Add('')
$sumLines.Add(('DELETE-candidate before pin/hold exclusions (raw unpinned class): ' + ($rawDel | Measure-Object).Count + ' runs, ' + (($rawDel | Measure-Object logical_bytes -Sum).Sum) + ' bytes'))
$sumLines.Add(('DELETE-candidate after exclusions (final class): ' + ($finDel | Measure-Object).Count + ' runs, ' + (($finDel | Measure-Object logical_bytes -Sum).Sum) + ' bytes'))
$excluded = $rawDel | Where-Object { $_.classification -ne 'DELETE-candidate' }
$sumLines.Add(('Excluded from raw DELETE by pin/hold rules: ' + ($excluded | Measure-Object).Count + ' runs, ' + (($excluded | Measure-Object logical_bytes -Sum).Sum) + ' bytes'))
$sumLines.Add(('ARCHIVE-candidate: ' + ($arch | Measure-Object).Count + ' runs, ' + (($arch | Measure-Object logical_bytes -Sum).Sum) + ' bytes'))
$sumLines.Add('')
$sumLines.Add('## Area rollups')
$sumLines.Add('')
$sumLines.Add('| area | runs | files | logical_bytes |')
$sumLines.Add('|---|---:|---:|---:|')
foreach ($g in ($outRows | Group-Object area)) {
  $b = ($g.Group | Measure-Object logical_bytes -Sum).Sum
  $f = ($g.Group | Measure-Object files -Sum).Sum
  $sumLines.Add(('| ' + $g.Name + ' | ' + $g.Count + ' | ' + $f + ' | ' + $b + ' |'))
}
$sumLines.Add('')
$sumLines.Add('## Top 20 largest runs')
$sumLines.Add('')
$sumLines.Add('| path | files | logical_bytes | newest_mtime_utc | classification |')
$sumLines.Add('|---|---:|---:|---|---|')
foreach ($r in ($outRows | Sort-Object logical_bytes -Descending | Select-Object -First 20)) {
  $sumLines.Add(('| ' + $r.path + ' | ' + $r.files + ' | ' + $r.logical_bytes + ' | ' + $r.newest_mtime_utc + ' | ' + $r.classification + ' |'))
}
$sumLines.Add('')
$sumLines.Add('## Method')
$sumLines.Add('')
$sumLines.Add('- Run units: children of output/playwright/ (the five largest areas expanded run-level: owner-corrections, page-cinematography, page-cinematography-2026-10-28, final-cascade-2026-10-26, cascade-control-refinement-2026-10-30-full-r2), children of output/high-low-feature-proof/, and every other child of output/ including loose files at output root. The plan table pins/holds for jg040-corrections-narrow2, owner-visual-preview-2026-10-28 and jg040-stage3-20261104 are applied at their run level.')
$sumLines.Add('- Measurement: Get-ChildItem -Recurse -File -Force per run; logical bytes = sum of Length; newest = max LastWriteTimeUtc. No file contents read; reparse-point traversal excluded (default).')
$sumLines.Add('- Git status per run: git -C <repo> ls-files -- <path> (tracked file count) and git -C <repo> check-ignore -q -- <path>.')
$sumLines.Add('- Reference search per run name, exact command template: rg -l --fixed-strings -- "<runName>" <repo>/docs <repo>/project <repo>/scripts <repo>/src <repo>/remotion <repo>/*.md <repo>/*.json <repo>/*.ts <repo>/*.mjs')
$sumLines.Add('  - rg respects .gitignore by default, approximating tracked scopes; hidden files and ignored paths are not searched.')
$sumLines.Add('  - A grep miss is evidence only for these scopes. Fixed-strings matching can false-positive on shared name prefixes (e.g. jg040-corrections-narrow matches inside jg040-corrections-narrow2 mentions); this inflates reference_count in the safe direction.')
$sumLines.Add('- Classification order: PINNED (plan s4 seed + evidence 70/72/73/74 cited sets + JG-039 homepage proof + JG-040 release/review sets) > plan-table holds > high-low-feature-proof held-area inheritance > newest mtime >= 2026-10-29Z HOLD-active > name pattern (jg040*, torque-tracker*, studiomark*, logo*, live-2026-11-04*, stage3*, cascade*, owner*) HOLD-owner-review > inactive < 2026-10-22T04:00Z with refs ARCHIVE-candidate > inactive, 0 refs, untracked+ignored DELETE-candidate > else KEEP-unknown.')
$sumLines.Add('')
$sumLines.Add('## Ambiguities for parent decision')
$sumLines.Add('')
$sumLines.Add('- Evidence numbering: 70 and 74 are packets under project/work/evidence/torque-wrench-rebuild/; 72 and 73 are docs under docs/torque-wrench-rebuild/. Pins were materialized from the plan s4 seed text plus rg -o extraction of cited output/ paths from those four sources plus the JG-039/JG-040 records.')
$sumLines.Add('- output/playwright/torque-camera-hud-2026-10-21/: the plan pins only its after/ subdir; the run-level row is marked PINNED conservatively (never-delete direction).')
$sumLines.Add('- output/high-low-feature-proof/: task text calls the area pinned; plan s4 says it remains held. Subruns cited by evidence 70 are PINNED; remaining subruns inherit HOLD-owner-review.')
$sumLines.Add('- output/playwright/torque-camera-hud-jg040-rebaseline/: pinned as a JG-040 review set via stage3 record citation (seed expansion), not an explicit plan line item.')
$sumLines.Add('- reference_count counts any scope file containing the run name as a substring; mention vs citation is not distinguished.')
$sumLines.Add('- Runs classified HOLD-active purely by mtime may simply be concurrent-lane writers (HUD/logo/showreel own other trees, but output/ writes from parallel sessions are possible); treat deletes as unsafe without a writer check regardless of class.')
Set-Content -LiteralPath (Join-Path $stor 'summary.md') -Encoding utf8 -Value $sumLines
$swTotal.Stop()
Log ('done elapsed_s=' + [int]$swTotal.Elapsed.TotalSeconds)
'=== RECAP ==='
'class_counts:'
$byCls | Sort-Object Name | ForEach-Object { '  {0}: {1} runs, {2} bytes' -f $_.Name, $_.Count, (($_.Group | Measure-Object logical_bytes -Sum).Sum) }
'delete_raw_bytes=' + (($rawDel | Measure-Object logical_bytes -Sum).Sum) + ' delete_final_bytes=' + (($finDel | Measure-Object logical_bytes -Sum).Sum) + ' archive_bytes=' + (($arch | Measure-Object logical_bytes -Sum).Sum)
'top10_delete_candidates:'
$finDel | Sort-Object logical_bytes -Descending | Select-Object -First 10 | ForEach-Object { '  {0} | {1} bytes | {2} | {3}' -f $_.path, $_.logical_bytes, $_.newest_mtime_utc, $_.git_status }
'outputs_at=' + $stor

