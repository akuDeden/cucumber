# Feature Map

Single reference: feature → selectors → page object → steps → feature file → snapshots → entry point.
Baca ini sebelum menyentuh file apapun — hindari buka 4 file hanya untuk tahu struktur satu fitur.

---

## Login

| Item | Path |
|------|------|
| Feature file | `src/features/p0/login.feature` |
| Steps | `src/steps/p0/login.steps.ts` |
| Page object | `src/pages/p0/LoginPage.ts` (10 methods) |
| Selectors | `src/selectors/p0/login/login-form.selectors.ts` |
| Snapshots | `docs/snapshots/login/` — lihat README di folder |
| Tags | `@login @authenticated @p0` |
| Scenarios | 4 |
| Entry point | `https://project.chronicle.rip/login` → klik Login link di nav → isi form |
| Notes | Field email + password readonly → click dulu sebelum fill. Auth state tersimpan di `auth-support-admin.json` |

---

## Search Box

| Item | Path |
|------|------|
| Feature file | `src/features/p0/searchBox.feature` |
| Steps | `src/steps/p0/searchBox.steps.ts` |
| Page object | — (tidak ada dedicated page object) |
| Selectors | `src/selectors/p0/search-box/search-box.selectors.ts` |
| Snapshots | `docs/snapshots/home/` (homepage snapshots) |
| Tags | `@p0 @searchBox` |
| Scenarios | 2 |
| Entry point | Header search box — tersedia di semua halaman authenticated |

---

## Advance Search

| Item | Path |
|------|------|
| Feature file | `src/features/p0/advanceSearch.authenticated.feature` (9 scenarios) |
| | `src/features/p0/advanceSearch.public.feature` (2 scenarios) |
| Steps | `src/steps/p0/advanceSearch.steps.ts` |
| Page object | `src/pages/p0/AdvanceSearchPage.ts` (22 methods) |
| Selectors | `src/selectors/p0/advance-search/advance-search.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @advancesearch-auth @authenticated` / `@p0 @advance-search-public` |
| Scenarios | 11 total |
| Entry point | Header > tombol **ADVANCED** di sebelah search box |

---

## Advance Table

| Item | Path |
|------|------|
| Feature file | `src/features/p0/advance-table.authenticated.feature` |
| Steps | `src/steps/p0/advanceTable.steps.ts` |
| Page object | `src/pages/p0/AdvanceTablePage.ts` (15 methods) |
| Selectors | `src/selectors/p0/advance-table/advance-table.selectors.ts` |
| Snapshots | `docs/snapshots/advance-table/` — 6 files (Plots tab & ROIs tab, staging + dev) |
| Tags | `@p0 @advance-table @authenticated` |
| Scenarios | 1 |
| Entry point | Dashboard nav > **Tables** > tab **Advanced Table** |

---

## Plot

| Item | Path |
|------|------|
| Feature file | `src/features/p0/plot.authenticated.feature` |
| Steps | `src/steps/p0/plot.steps.ts` |
| Page object | `src/pages/p0/PlotPage.ts` (16 methods) |
| | `src/pages/p0/CreatePlotPage.ts` (20 methods) — untuk create/edit plot |
| Selectors | `src/selectors/p0/plot.selectors.ts` |
| Snapshots | `docs/snapshots/plots/` — plot detail & edit form |
| Tags | `@p0 @plot @authenticated` |
| Scenarios | 10 |
| Entry point (pilih salah satu): | |
| → Map view | Klik plot di peta langsung |
| → Advance Table | Tables > PLOTS tab > klik plot |
| → Search box | Ketik nama plot di header search |
| → Advance Search | Header > ADVANCED > cari plot |
| Notes | Status plot menentukan konten: `Occupied` (ada interment, mungkin ROI), `Reserved` (ada ROI, no interment), `Vacant`/`ForSale` (kosong) |

---

## ROI (Right of Interment)

| Item | Path |
|------|------|
| Feature file | `src/features/p0/roi.feature` (9 scenarios) |
| | `src/features/p0/roiTable.authenticated.feature` (4 scenarios) |
| Steps | `src/steps/p0/roi.steps.ts` (367 lines) |
| | `src/steps/p0/roiTable.steps.ts` (351 lines) |
| Page object | `src/pages/p0/ROIPage.ts` (26 methods) |
| Selectors | `src/selectors/p0/roi/roi-form.selectors.ts` — form fields |
| | `src/selectors/p0/roi/roi-table.selectors.ts` — ROI table |
| | `src/selectors/p0/roi/roi.enums.ts` — enum values |
| | `src/selectors/p0/roi/roi.urls.ts` — URL patterns |
| Snapshots | `docs/snapshots/roi/` — 24 files, per tiket (bg3, bg6, bg13, ad1) + generic forms |
| Tags | `@p0 @roi` / `@p0 @roi @roi-table @authenticated` |
| Scenarios | 13 total |
| Entry point | Plot detail (Reserved/Occupied) > panel kanan > **Add ROI** / **Edit ROI** |
| | Tables > ROI Table tab |
| Notes | Plot `Reserved` = ada ROI tanpa interment. Plot `Occupied` = ada interment, mungkin ada ROI |

---

## Interment

| Item | Path |
|------|------|
| Feature file | `src/features/p0/interment.feature` |
| Steps | `src/steps/p0/interment.steps.ts` (262 lines) |
| Page object | `src/pages/p0/IntermentPage.ts` (34 methods) |
| Selectors | `src/selectors/p0/interment/interment-form.selectors.ts` |
| Snapshots | `docs/snapshots/interment/` — Add Interment form & plot detail tab Interments |
| Tags | `@p0 @interment` |
| Scenarios | 7 |
| Entry point | Plot detail (status **Occupied**) > tab **INTERMENTS** > Edit interment |
| | Plot detail > **Add interment** button |
| Notes | Hanya plot Occupied yang punya interment. Entry via plot (map/table/search) |

---

## Sales

| Item | Path |
|------|------|
| Feature file | `src/features/p0/sales.authenticated.feature` |
| Steps | `src/steps/p0/sales.steps.ts` (451 lines) |
| Page object | `src/pages/p0/SalesPage.ts` (47 methods) |
| Selectors | `src/selectors/p0/sales/sales-form.selectors.ts` — form |
| | `src/selectors/p0/sales/sales-invoice.selectors.ts` — invoice |
| | `src/selectors/p0/sales/sales-payment.selectors.ts` — payment |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @sales @authenticated` |
| Scenarios | 6 |
| Entry point | Plot detail > **Add Sale** button |
| | Person detail > Sales tab |

---

## Person

| Item | Path |
|------|------|
| Feature file | `src/features/p0/person.authenticated.feature` |
| Steps | `src/steps/p0/person.steps.ts` (250 lines) |
| Page object | `src/pages/p0/PersonPage.ts` (21 methods) |
| Selectors | `src/selectors/p0/person/person-form.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @person @authenticated` |
| Scenarios | 4 |
| Entry point | Advance Search > hasil pencarian orang > klik person |
| | Header search box > nama person |

---

## Business

| Item | Path |
|------|------|
| Feature file | `src/features/p0/business.authenticated.feature` |
| Steps | `src/steps/p0/business.steps.ts` (93 lines) |
| Page object | `src/pages/p0/BusinessPage.ts` (10 methods) |
| Selectors | `src/selectors/p0/business.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @business @authenticated` |
| Scenarios | 3 |
| Entry point | Dashboard > More menu > Business / Organization settings |

---

## Feedback

| Item | Path |
|------|------|
| Feature file | `src/features/p0/feedback.authenticated.feature` |
| Steps | `src/steps/p0/feedback.steps.ts` (168 lines) |
| Page object | `src/pages/p0/FeedbackPage.ts` (21 methods) |
| Selectors | `src/selectors/p0/feedback/feedback-form.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @feedback` |
| Scenarios | 2 |
| Entry point | Dashboard > More menu > Feedback |

---

## Request Sales Form (Public)

| Item | Path |
|------|------|
| Feature file | `src/features/p0/requestSalesForm.public.feature` |
| Steps | `src/steps/p0/requestSalesForm.steps.ts` (186 lines) |
| Page object | `src/pages/p0/RequestSalesFormPage.ts` (43 methods) |
| Selectors | `src/selectors/p0/request-sales-form/request-sales-form.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@request-sales-form @public @p0` |
| Scenarios | 2 |
| Entry point | Public URL — tidak perlu login |
| Notes | `@public` — gunakan `getCemeteryUrl()` bukan `getCustomerOrgUrl()` |

---

## At-need

| Item | Path |
|------|------|
| Feature file | — (belum ada feature file) |
| Steps | — |
| Page object | — |
| Selectors | — |
| Snapshots | `docs/snapshots/at-need/` — 6 files, tiap step form |
| Entry point | Dashboard > Request > **At-need Plot Purchase** |
| Notes | Snapshot tersedia tapi belum ada BDD test |

---

## Regional Settings (p0)

| Item | Path |
|------|------|
| Selector file | `src/selectors/p0/regional-settings/regional-settings.selectors.ts` |
| Page object | `src/pages/p0/RegionalSettingsPage.ts` |
| Steps file | `src/steps/p0/regionalSettings.steps.ts` |
| Feature file | `src/features/p0/regionalSettings.authenticated.feature` |
| Snapshots | `docs/snapshots/regional-settings/` — belum ada |
| Tags | `@p0 @regional-settings @authenticated` |
| Scenarios | 2 — update labels, restore defaults |
| Entry point | Top-right dropdown > My Organisation > Regional Settings tab |
| Notes | Use `selectText() + pressSequentially()` — `fill()` tidak trigger Angular dirty state. Save button muncul hanya setelah form dirty. waitForResponse harus dipasang SEBELUM click save. |

---

## Invoice from Sales Request

| Item | Path |
|------|------|
| Feature file | `src/features/p0/invoiceFromSalesRequest.authenticated.feature` |
| Steps | `src/steps/p0/invoiceFromSalesRequest.steps.ts` |
| Page object | `src/pages/p0/InvoiceFromSalesRequestPage.ts` (11 methods) |
| Selectors | `src/selectors/p0/invoice-from-sales-request/invoice-from-sales-request.selectors.ts` |
| Snapshots | — (belum ada dedicated folder) |
| Tags | `@p0 @invoice-from-sales-request @authenticated` |
| Scenarios | 4 — TC-01 admin generate, TC-02 already exists, TC-03 owner regression, TC-04 sales menu regression |
| Entry point | `/customer-admin/request` (admin) atau `/customer-organization/request` (owner) |
| Notes | Bug fix: admin org user harus dapat generate invoice tanpa 403 "access denied". `<TEST_ADMIN_EMAIL>` / `<TEST_ADMIN_PASSWORD>` untuk admin, `<TEST_OWNER_EMAIL>` / `<TEST_OWNER_PASSWORD>` untuk owner |

---

## Import (p1)

| Item | Path |
|------|------|
| Feature file | — (p1, bukan p0) |
| Page object | `src/pages/p1/ImportPage.ts` |
| Snapshots | `docs/snapshots/import/` — 4 files termasuk wipe dialog |
| Entry point | Dashboard > More menu > Import |
| Notes | p1 priority — import CSV/GeoJSON ke Chronicle |

---

## Run Commands

```bash
# Run by feature tag
npm run test:headless -- --tags "@roi"
npm run test:headless -- --tags "@interment"
npm run test:headless -- --tags "@sales"

# Run single feature file
cross-env NODE_OPTIONS='--loader ts-node/esm' cucumber-js 'src/features/p0/roi.feature' --import 'src/**/*.ts'

# Run dengan environment berbeda
ENVIRONMENT=staging REGION=aus npm test -- --tags "@p0"
```
