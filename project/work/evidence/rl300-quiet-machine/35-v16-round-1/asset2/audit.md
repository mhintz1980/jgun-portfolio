# Fused / shifted parts audit (shipped msp-enclosure.glb vs V16 copy, glTF Y-up frame)
Shipped mesh nodes with a bbox: 551; V16 mesh objects: 614; matched by sanitized name: 540 (shipped-only: 11); V16 objects with no shipped node: 74.

## (a) shipped nodes containing the union of 2+ same-family V16 objects (tol 2 mm or equal union dims; absorbed = no own shipped node; shipped tris ~ one member = stacked duplicates, not a fusion)
| shipped node | tris shipped | tris V16 (members) | members inside | absorbed (no own node) |
|---|---:|---:|---:|---:|
| MAN-6650459107-1 | 4000 | 30253 | 8 | 7 |
| 4874323_VG01_REV01_MS-1 | 3998 | 13054 | 2 | 1 |
| V2CONTROL_PANEL,_URFS-2 | 4152 | 4296 | 18 | 17 |
| V2HWR-WSH-F8Z-050-2002 | 168 | 504 | 3 | 2 |

## (b) median per-axis bbox-centre delta, shipped minus V16, per V16 root group (matched non-fused parts: 536; groups: 11; flag > 5 mm on any axis)
| root group | parts | dx mm | dy mm | dz mm |
|---|---:|---:|---:|---:|
| 904j-e28t_eng | 33 | -0.0 | -0.0 | +14.9 |
| 26-01305-1 | 1 | +0.2 | +0.1 | +14.9 |
| RM100-PX1029008D-1 | 1 | -0.6 | -0.0 | +14.5 |
| RL300-P-FFM-1000 | 3 | -0.0 | -0.0 | +14.0 |
| RL300-CPM-3000 | 2 | -0.0 | -0.0 | +14.0 |
| groups above 5 mm: 5 of 11; largest unflagged: DUCT_INTAKE +0.0/-0.0/-0.0 | | | | |
## (c) individual parts shifted > 5 mm on any axis (shipped minus V16, fused excluded), by root group
| root group | shifted parts | example (dx/dy/dz mm) |
|---|---:|---|
| ENCLOSURE_CHASSIS | 36 | HWR-BLTSET-H8Z-075-275-1/HWR-BLT-H8Z-075-275-2 +0.0/-0.0/+9.1 |
| 904j-e28t_eng | 33 | 4874290_REV00_MS-1 +0.2/+0.0/+15.0 |
| COMPOSITE_PANELS | 16 | G2C07-0085-15 +94.4/+0.0/+0.0 |
| PUMP_HOUSING | 4 | V23028T25_Weld-on Tie-Down Ring-1 +2.4/+29.2/+0.2 |
| RL300-P-FFM-1000 | 3 | RL300-P-FFM-1001-1 -0.0/-0.0/+14.0 |
| RL300-CPM-3000 | 2 | RL300-CPM-3001-1 -0.0/-0.0/+14.0 |
| 26-01305-1 | 1 | 26-01305-1 +0.2/+0.1/+14.9 |
| RM100-PX1029008D-1 | 1 | RM100-PX1029008D-1 -0.6/-0.0/+14.5 |
| ACOUSTIC_BAFFLES | 1 | RL200-SIF-1019-1 +0.0/+0.0/+5.0 |
| DUCT_EXHAUST | 1 | EXHAUST PIPE-1 -400.0/+0.0/+65.0 |

## Reference rows (fused nodes excluded from (b); the three extras roots are not in msp-enclosure.glb)
| group | parts | dx mm | dy mm | dz mm |
|---|---:|---:|---:|---:|
| DUCT_EXHAUST | 43 | +0.0 | +0.0 | +0.0 |
| PUMP_HOUSING | 104 | +0.0 | -0.0 | +0.0 |
| RL300-CPM-3000 | 2 | -0.0 | -0.0 | +14.0 |
