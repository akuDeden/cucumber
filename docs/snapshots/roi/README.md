# roi Snapshots

Add/Edit ROI form, plot detail dengan ROI tab, dan activity log setelah operasi ROI.
Penamaan prefix `bg{n}` / `ad{n}` / `prod-bg{n}` merujuk ke nomor tiket.

| File | Page | Keterangan |
|------|------|------------|
| `plots-tab.yml` | Tables > PLOTS tab | Tab Plots (default) — titik awal cari plot untuk Add ROI |
| `filtered-plots.yml` | Tables > PLOTS tab | Tab Plots setelah filter Status: Vacant — untuk Add ROI |
| `add-roi-form.yml` | Add ROI form | Form Add ROI kosong — **gunakan untuk cari selector field** |
| `plot-search-result.yml` | Add ROI form | Form Add ROI setelah search plot "B G 9" — plot sudah dipilih |
| `edit-roi-form.yml` | Edit ROI form | Form Edit ROI generik — selector stabil |
| `more-menu-open.yml` | Edit ROI form | Form Edit ROI dengan MORE menu terbuka |
| `roi-form.yml` | Add ROI form | Form Add ROI — versi 1 |
| `roi-form2.yml` | Add ROI form | Form Add ROI — versi 2 |
| `roi-clean.yml` | Add ROI form | Form Add ROI bersih — versi 1 |
| `roi-clean2.yml` | Add ROI form | Form Add ROI bersih — versi 2 |
| `roi-right-type.yml` | Add ROI form | Form Add ROI dengan Right Type sudah dipilih |
| **Tiket AD1** | | |
| `ad1-plot-detail.yml` | Plot detail | Plot detail sebelum remove ROI (tiket AD1) |
| `ad1-roi-edit-form.yml` | Edit ROI form | Form Edit ROI — tiket AD1 |
| `ad1-roi-tab-after-remove.yml` | Plot detail | ROI tab setelah ROI di-remove — tiket AD1 |
| `ad1-activity-tab-after-remove.yml` | Plot detail | Activity tab setelah ROI di-remove — tiket AD1 |
| **Tiket BG3** | | |
| `bg3-roi-edit-form-after-replace.yml` | Edit ROI form | Form Edit ROI setelah replace plot — tiket BG3 |
| `bg3-activity-after-replace.yml` | Activity tab | Activity log setelah ROI plot diganti — tiket BG3 |
| **Tiket BG6** | | |
| `plot-bg6-detail.yml` | Plot detail | Plot BG6 sebelum move ROI |
| `bg6-roi-edit-form.yml` | Edit ROI form | Form Edit ROI — tiket BG6 |
| `bg6-activity-after-move.yml` | Edit Plot form | State setelah move ROI ke plot tujuan — tiket BG6 |
| `bg6-after-move-activity.yml` | Plot detail | Activity tab setelah ROI dipindah — tiket BG6 |
| **Tiket BG8** | | |
| `plot-bg8-detail.yml` | Plot detail | Plot BG8 detail — tiket BG8 |
| **Tiket BG13 / prod-BG13** | | |
| `roi-edit-bg13.yml` | Edit ROI form | Form Edit ROI — tiket BG13 project |
| `prod-bg13-roi-edit-after-replace.yml` | Edit ROI form | Form Edit ROI setelah replace — tiket BG13 production |

**Entry point**: Tables > PLOTS tab (filter Vacant/Reserved) → pilih plot → Add/Edit ROI
