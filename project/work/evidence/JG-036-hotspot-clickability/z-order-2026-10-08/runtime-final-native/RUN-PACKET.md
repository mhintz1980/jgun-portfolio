# JG-036 final native GPU run packet (prepared; do NOT start before stills release)

## Preconditions

- Owner stills/GPU occupancy released first. No product/source modification at any point during the run.
- Fresh Vite dev server at `http://localhost:5203` (localhost hostname, never `127.0.0.1`); confirm it responds before hashing/running.
- Verifier must still be SHA-256 `95A73C1418158D9AE530A98FA8B88382D042FE3D3F255BAE763FFEF0F234B314` (oracle-final-correction state); stop on mismatch.

## 1. Served index/JS hashes (same server instance as the run; before clicking starts)

```powershell
$base = 'http://localhost:5203'
$out = 'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-036-hotspot-clickability\z-order-2026-10-08\runtime-final-native'
$targets = @('/','/src/main.tsx','/src/scene/CameraRig.tsx','/src/scene/Hotspots.tsx','/src/components/TechnicalHUD.tsx','/src/components/Chapters.tsx','/src/data/caseStudies.ts')
$lines = foreach ($t in $targets) {
  $tmp = Join-Path $out ('served' + ($t -replace '/','_'))
  Invoke-WebRequest -Uri ($base + $t) -OutFile $tmp
  "$((Get-FileHash -Algorithm SHA256 $tmp).Hash)  $t"
}
$lines | Set-Content (Join-Path $out 'served-hashes.txt')
$lines
```

## 2. Normal-quality run (first; default evidence class)

```powershell
$out = 'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-036-hotspot-clickability\z-order-2026-10-08\runtime-final-native'
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=final-native --out=$out 2>&1 | Tee-Object -FilePath (Join-Path $out 'final-native-normal.log')
$LASTEXITCODE
```

## 3. Locked fallback (ONLY on reproduced inherited global canvas failure)

Permitted only if the normal report/log shows the real inherited global canvas failure (global canvas collapse / zero-badge render blocker) — quote that evidence from the normal artifacts before running. Never use the fallback for ordinary assertion failures.

```powershell
$out = 'C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-036-hotspot-clickability\z-order-2026-10-08\runtime-final-native'
node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5203 --label=final-native-locked --out=$out --quality-lock 2>&1 | Tee-Object -FilePath (Join-Path $out 'final-native-locked.log')
$LASTEXITCODE
```

Locked evidence is quality-locked functional/visual candidate only; G6/performance claims stay excluded (script policy).

## 4. No-overwrite guarantees

- Fresh `runtime-final-native` out dir only; never rerun into older z-order attempt directories.
- Distinct labels (`final-native`, `final-native-locked`); the script also timestamp-dedupes report filenames.
- Screenshot names are fixed per case/keeper and write only inside this new dir.

## 5. Post-run protocol (same turn)

- Compact results from `final-native-verification-report.json` (plus `final-native-locked-verification-report.json` only if the fallback was justified).
- Classify every failure as product-source failure vs oracle false-positive against `../oracle-final-correction.md`; cite the exact report field.
- Packet must reference: report JSON path, log path(s), `served-hashes.txt`, and the verifier hash receipt.
- Fresh independent review (Curie) owns sign-off; no self-review approval.
