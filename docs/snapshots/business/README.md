# Business Snapshots

Snapshots dari fitur Business Management (advance-table → BUSINESS tab).

| File | Halaman | Env | Keterangan |
|------|---------|-----|------------|
| `business-table-prod.yml` | Advance Table → BUSINESS tab | prod (aus) | Tabel business dengan daftar rows |
| `business-edit-form-prod.yml` | Edit Business form | prod (aus) | Form edit — tombol save/Delete/cancel |

## Temuan Penting (2026-04-29)

- Tombol pada edit form: `"save"` (lowercase), `"Delete"` (capital D), `"cancel"` (lowercase)
- Navigasi ke edit form: klik **cell** (mat-cell) dalam row, BUKAN klik mat-row container
- URL edit: `/customer-organization/advance-table/manage/edit/business/{id}/cemetery/{slug}?from=table`
- `mat-row` selector valid (9 data rows), tapi click pada row container tidak trigger navigasi
