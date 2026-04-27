# Snapshot Index

Accessibility tree snapshots diambil via `playwright-cli snapshot`. Gunakan sebagai referensi selector & struktur DOM — tanpa perlu buka browser.

## Cara Pakai

```bash
# Capture snapshot baru
playwright-cli open https://project.chronicle.rip/...
playwright-cli snapshot --filename=<nama>.yml
# Simpan ke folder feature yang sesuai
```

**Aturan selector**: jangan pakai `ref=eXXXX` (berubah tiap session). Gunakan `data-testid`, `role`, `aria-label`, atau text content.

## Folder Index

| Folder | Isi | Jumlah File |
|--------|-----|-------------|
| [advance-table/](advance-table/) | Halaman Tables > Advanced Table (Plots & ROIs tab) | 6 |
| [at-need/](at-need/) | Form At-need Plot Purchase — tiap step form | 6 |
| [home/](home/) | Dashboard & homepage public setelah login | 3 |
| [import/](import/) | Halaman Import data — berbagai state | 4 |
| [interment/](interment/) | Form Add Interment & plot detail dengan tab Interments | 4 |
| [login/](login/) | Login page berbagai environment & state | 16 |
| [plots/](plots/) | Plot detail & Edit Plot form | 7 |
| [roi/](roi/) | Add/Edit ROI form, plot detail, activity tab — tiap ticket | 24 |
| [regional-settings/](regional-settings/) | Regional Settings debug — login, dropdown, form fill, save states | 26 |
| [tables/](tables/) | Halaman Tables (ROI Table & general) | 2 |
| [evidence/](evidence/) | Screenshot BEFORE/AFTER per eksekusi tiket | — |
