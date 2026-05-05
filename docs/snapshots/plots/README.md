# plots Snapshots

Plot detail panel & Edit Plot form.

| File | Page | Status Plot | Keterangan |
|------|------|------------|------------|
| `plot-detail-ac5.yml` | Plot detail | Occupied | Plot AC5 — detail panel terbuka di map view |
| `ac5-plot.yml` | Plot detail | Occupied | Plot AC5 — versi lain / state berbeda |
| `edit-plot-form-with-roi.yml` | Edit Plot form | Reserved | Form Edit Plot dengan ROI section + Activity panel — plot BG6 |
| `reserved-plots.yml` | Plot list / detail | Reserved | Plot dengan status Reserved — map atau table view |
| `staging-plot.yml` | Plot detail | — | Plot detail — staging env |
| `plots-after-goback.yaml` | Tables > Plots | — | Tab Plots setelah navigasi go-back |
| `plots-filtered-expanded.yaml` | Tables > Plots | — | Tab Plots dengan filter expanded |

**Status plot & konten**:
- `Occupied` → ada Interment, mungkin ada ROI
- `Reserved` → ada ROI, tidak ada Interment
- `Vacant` / `ForSale` → tidak ada Interment, tidak ada ROI
