$ErrorActionPreference = 'Stop'
$oryzoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$capturePath = Join-Path $oryzoRoot 'capture.md'
$snapshotPath = Join-Path $PSScriptRoot 'capture.step2-before.md'
$encoding = [Text.UTF8Encoding]::new($false, $true)
$originalBytes = [IO.File]::ReadAllBytes($capturePath)
$snapshotBytes = [IO.File]::ReadAllBytes($snapshotPath)
if ([Convert]::ToBase64String($originalBytes) -cne [Convert]::ToBase64String($snapshotBytes)) {
    throw 'capture.md differs from the saved pre-step2 version; refusing to overwrite concurrent changes.'
}
$original = $encoding.GetString($originalBytes)
$newline = if ($original.Contains("`r`n")) { "`r`n" } else { "`n" }
$insert4 = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'step2-before-4b.md'), $encoding)
$insertRest = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'step2-after-4b.md'), $encoding)
# Normalize only new material; existing bytes survive decoding/re-encoding unchanged.
$insert4 = $insert4.Replace("`r`n", "`n").TrimEnd("`n").Replace("`n", $newline) + $newline + $newline
$insertRest = $insertRest.Replace('1093000–1097812', '1093000–1097784').Replace("`r`n", "`n").TrimEnd("`n").Replace("`n", $newline) + $newline + $newline
$anchor4b = '## 4b. Page and route transitions'
$anchor8 = '## 8. Accessibility and fallbacks'
if ($original.IndexOf($anchor4b) -lt 0 -or $original.IndexOf($anchor8) -lt 0) { throw 'Required original anchors missing.' }
$updated = $original.Replace($anchor4b, $insert4 + $anchor4b).Replace($anchor8, $insertRest + $anchor8)
$recovered = $updated.Replace($insert4, '').Replace($insertRest, '')
if ([Convert]::ToBase64String($encoding.GetBytes($recovered)) -cne [Convert]::ToBase64String($originalBytes)) {
    throw 'Preservation check failed before write.'
}
[IO.File]::WriteAllBytes($capturePath, $encoding.GetBytes($updated))
Write-Output ('Updated only {0}; original {1} bytes preserved verbatim.' -f $capturePath, $originalBytes.Length)
