# CLAUDE.md

Always address the user as "Mr Deden" at the beginning of every sentence or answer.

## Scenario Runner — Wajib Baca Sebelum Run

**TRIGGER**: Kapanpun user mengirimkan tiket/skenario pengujian (berisi langkah-langkah bernomor, kata "Skenario", "validate", "verify", atau deskripsi flow yang harus di-test):

### Session Config (Baca Dulu Sebelum Tanya)

Baca `.test-session.json` di root project — file ini berisi default environment, akun, dan cemetery.

```json
// .test-session.json (selalu up-to-date)
{
  "environment": "production",
  "baseUrl": "https://project-aus.chronicle.rip",
  "account": { "email": "...", "password": "..." },
  "cemetery": "Astana Tegal Gundul",
  "region": "aus"
}
```

**Jika tiket tidak menyebutkan environment/akun/cemetery** → gunakan nilai dari `.test-session.json` langsung, **tanpa perlu tanya ke user**.

**Tanya ke user HANYA jika** tiket secara eksplisit meminta environment/akun/cemetery yang berbeda dari default.

**JANGAN langsung open browser atau jalankan playwright-cli sebelum membaca `.test-session.json`.**

### Auth State Reuse (Skip Login Steps)

File `auth-support-admin.json` di root berisi saved session untuk `project.chronicle.rip` + `project-aus.chronicle.rip`.

**Gunakan saat membuka browser untuk scenario @authenticated:**
```bash
playwright-cli state-load auth-support-admin.json
```
Lakukan setelah `playwright-cli open` dan sebelum navigasi ke halaman target — ini skip login sepenuhnya.

**Regenerate jika session expired** (redirect ke `/login` setelah load):
```bash
# 1. Buka login page
playwright-cli open https://project.chronicle.rip/login
# 2. Click email field dulu (readonly), fill, click password, fill, click LOGIN
playwright-cli click e{email-ref}
playwright-cli fill e{email-ref} "faris+astanaorg@chronicle.rip"
playwright-cli click e{password-ref}
playwright-cli fill e{password-ref} "12345"
playwright-cli click e{login-btn-ref}
# 3. Setelah redirect sukses, save state
playwright-cli state-save auth-support-admin.json
```

### Setelah Mendapat Jawaban — Aturan Eksekusi:

1. **Gunakan playwright-cli** untuk semua interaksi browser (open, click, fill, snapshot, dll.) 
2. **simpan snapshoot** sebagai knowledbase jika tidak ada, namun jika ternyata ada gunakan yg sudah ada. jadi anda sblm run biar g muter2 cari konteks bisa paka reference dari folder `docs/snapshots/<feature>/` dan refrence cara simpan snapshot jika ada flow baru bisa dari instruksi ## Debug Snapshots, instruksi tsb ada di file CLAUDE.md ini 

2. **entry point** fitur yang sering di butuhkan dalam pencarian interment dan roi perlu awal dari plot. entry point plot bisa dari advance table, map view, searchbox di header atau dari advance search di header juga, tergantung tiketnya jika tidak di sebutkan dari mana maka bebas pilih yang mana saja, status plot occupied (ada interment, mungkin bisa jadi ada ROI), status plot forsale dan vacant (tidak ada interment, tidak ada ROI), status plot reserved (tidak ada interment, ada ROI)
4. **Buat daftar assertion SEBELUM mulai eksekusi** — baca tiket, petakan setiap ekspektasi:

   Untuk setiap assertion, tentukan:
   - **Elemen apa** yang membuktikan assertion ini. Jika panel memiliki sub-menu atau tab, pilih tab yang **relevan dengan konteks tiket** (bukan tab default) sebelum screenshot — konsisten untuk BEFORE maupun AFTER. "PASTIKAN TARGET SCREENSHOT TIDAK TERTUTUP OLEH DIALOG ATAU POP UP LAINNYA"** — jangan campur urutan.
   - **Perlu BEFORE?** → Ya, jika assertion memvalidasi *perubahan* (sesuatu yang tadinya kosong/berbeda lalu berubah)
   - **Perlu AFTER?** → Selalu ya

5. **Capture ekspetasi BEFORE terlebih dahulu**, baru eksekusi aksi
6. **capture ekspetasi AFTER**, baru eksekusi aksi lanjutan

7. **Screenshot wajib di-crop hanya untuk elemen ekspektasi, tidak untuk prekondisi tidak perlu di crop** — pakai `playwright-cli screenshot e{ref}` untuk element screenshot, atau `clip` jika butuh presisi lebih:
   ```js
   const box = await page.locator('[data-testid="target"]').boundingBox();
   await page.screenshot({ path: 'path.png', clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 20 } });
   ```

8. **Penamaan file**: `s{skenario}_{step}_BEFORE_{deskripsi}.png` / `s{skenario}_{step}_AFTER_{deskripsi}.png` — pakai sufiks BEFORE/AFTER agar laporan langsung terbaca.

9. **Simpan ke** `docs/snapshots/evidence/`

10. **Laporkan setiap assertion** dengan format PASS/FAIL + pasangan screenshot BEFORE → AFTER

### Format Laporan:

| Assertion | Elemen | Status | BEFORE | AFTER |
|-----------|--------|--------|--------|-------|
| ROI muncul di plot tujuan | Right of Interment panel | PASS | s1_01_BEFORE_dest_roi.png | s1_01_AFTER_dest_roi.png |
| ROI hilang dari plot asal | Right of Interment panel | PASS | s1_02_BEFORE_src_roi.png | s1_02_AFTER_src_roi.png |
| Activity log mencatat move | Activity/Changes panel | PASS | s1_03_BEFORE_activity.png | s1_03_AFTER_activity.png |
| Dialog konfirmasi muncul | Dialog modal | PASS | — | s1_04_AFTER_dialog.png |

## Context

**Chronicle** is a cemetery management system. This repo is its BDD test suite (Cucumber + Playwright + TypeScript).

## Commands

```bash
# Run by tag
npm run test:headless -- --tags "@login"

# Run single feature
cross-env NODE_OPTIONS='--loader ts-node/esm' cucumber-js 'src/features/p0/file.feature' --import 'src/**/*.ts'

# Different environment + region
ENVIRONMENT=map REGION=us npm test -- --tags "@p0"
```

See `package.json` scripts for all test commands (`test:staging`, `test:p0`, etc.).

## Debug & Fix Protocol — WAJIB Sebelum Menulis Kode

**DILARANG KERAS** menulis atau mengubah kode untuk memperbaiki test yang gagal tanpa melakukan investigasi langsung terlebih dahulu via playwright-cli.

playwright-cli adalah alat debug penuh — bukan sekadar snapshot. Gunakan untuk **mereproduksi, menginvestigasi, memverifikasi selector, menjalankan JS, dan mengkonfirmasi fix** sebelum menyentuh kode.

### Kapabilitas playwright-cli yang Wajib Dimanfaatkan:

| Kebutuhan | Perintah | Contoh |
|-----------|----------|--------|
| Buka browser | `playwright-cli open <url>` | `playwright-cli open https://map.chronicle.rip` |
| Load auth session | `playwright-cli state-load <file>` | `playwright-cli state-load auth-support-admin.json` |
| Klik elemen | `playwright-cli click e{ref}` | `playwright-cli click e492` |
| Isi input | `playwright-cli fill e{ref} "text"` | `playwright-cli fill e210 "Gibran"` |
| Ambil accessibility tree | `playwright-cli snapshot` | lihat semua elemen + ref + role |
| Screenshot seluruh halaman | `playwright-cli screenshot` | verifikasi visual state |
| Screenshot satu elemen | `playwright-cli screenshot e{ref}` | crop langsung ke elemen |
| Jalankan JavaScript | `playwright-cli evaluate "js"` | `playwright-cli evaluate "document.querySelector('[role=tree]')?.innerText"` |
| Verifikasi selector CSS | `playwright-cli evaluate "document.querySelectorAll('selector').length"` | konfirmasi selector match sebelum dipakai di kode |
| Cek teks elemen | `playwright-cli evaluate "document.querySelector('sel')?.textContent"` | lihat nilai aktual |
| Navigate URL | `playwright-cli navigate <url>` | pindah halaman tanpa buka baru |

### Alur Wajib Saat Ada Test Failure:

1. **Baca error** — identifikasi step yang gagal, selector, dan timeout yang terjadi
2. **Reproduksi manual via playwright-cli** — lakukan langkah-langkah yang sama persis seperti test:
   - Buka halaman, load auth, klik filter, expand section, dsb.
   - Sampai ke kondisi tepat saat step tersebut seharusnya berjalan
3. **Snapshot** — ambil accessibility tree, simpan ke `docs/snapshots/<feature>/`
4. **Verifikasi selector langsung di browser**:
   ```bash
   # Cek apakah selector ada di DOM
   playwright-cli evaluate "document.querySelectorAll('[data-testid^=statuses-div]').length"
   # Lihat teks elemen yang dimaksud
   playwright-cli evaluate "document.querySelector('[role=tree]')?.innerText?.slice(0,200)"
   ```
5. **Test fix di browser sebelum nulis kode** — simulasikan fix dengan JS evaluate:
   ```bash
   # Contoh: verifikasi bahwa JS click pada li pertama di tree benar-benar navigasi
   playwright-cli evaluate "document.querySelector('[role=tree] ul li')?.click()"
   # Cek URL setelah klik
   playwright-cli evaluate "location.href"
   ```
6. **BARU tulis kode** — setelah tahu fix benar-benar works di browser

### Yang TIDAK Boleh Dilakukan:
- Menulis fix berdasarkan snapshot lama / asumsi tentang DOM
- Mengubah selector/regex berulang-ulang tanpa melihat DOM sesungguhnya
- Trial-and-error run: **jalankan test → gagal → ubah kode → jalankan lagi** tanpa debug
- Menganggap snapshot lama masih valid — selalu ambil snapshot fresh untuk state yang relevan

---

### STEP 0 — Failure Classification (Wajib Sebelum Investigasi)

Setiap kali ada test failure, **langkah pertama** adalah klasifikasikan jenis failure-nya. Ini menentukan aksi wajib berikutnya:

| Klasifikasi | Kondisi | Aksi Wajib Berikutnya |
|-------------|---------|----------------------|
| `SELECTOR_UNKNOWN` | Tidak tahu struktur DOM / belum punya snapshot state ini | Ambil snapshot fresh via playwright-cli dulu |
| `SELECTOR_MISMATCH` | Punya snapshot tapi selector di kode tidak match DOM | Verifikasi via `evaluate querySelectorAll` di browser |
| `TIMING_ISSUE` | Selector ada dan match, tapi element tidak muncul tepat waktu | Observasi timing di browser, cek network/animation |
| `DATA_ISSUE` | Kode dan selector benar, tapi test data tidak ada di environment | Cek keberadaan data di browser langsung |
| `LOGIC_ISSUE` | Selector match, data ada, tapi aksi tidak menghasilkan hasil yang diharapkan | Simulasi aksi via JS evaluate, verifikasi hasilnya |

Output klasifikasi wajib ditulis eksplisit sebelum lanjut:
> *"Klasifikasi: `SELECTOR_UNKNOWN` — belum ada snapshot untuk kondisi filter Vacant applied + section expanded di prod."*

---

### STEP 1 — Investigation Report (Wajib Sebelum Menulis Fix)

Setelah investigasi via playwright-cli selesai, **wajib output laporan** ini sebelum menulis satu baris kode apapun:

```
## Investigation Report
- Klasifikasi        : SELECTOR_UNKNOWN / SELECTOR_MISMATCH / TIMING_ISSUE / DATA_ISSUE / LOGIC_ISSUE
- URL diinvestigasi  : https://...
- State saat error   : (misal: filter Vacant applied, section A expanded)
- Snapshot diambil   : docs/snapshots/<feature>/<filename>.yaml
- Evaluate dijalankan: document.querySelectorAll('[role="tree"] ul li').length = 18
- JS simulation      : document.querySelector('[role="tree"] ul li').click() → URL = /plots/123 ✓
- Root cause         : [kesimpulan berdasarkan fakta, bukan asumsi]
- Fix yang diusulkan : [deskripsi fix sebelum implementasi]
```

**Aturan ketat:**
- Field `Snapshot diambil` harus diisi dengan path file nyata → berarti saya benar-benar menjalankan playwright-cli
- Field `Evaluate dijalankan` harus diisi dengan output aktual dari browser → bukan perkiraan
- Field `JS simulation` harus diisi dengan hasil nyata → konfirmasi fix works sebelum kode ditulis
- Jika ada field yang tidak bisa diisi → investigasi belum cukup → lanjutkan dulu via playwright-cli

---

### STEP 2 — Konfirmasi Mr Deden Sebelum Implementasi

Setelah Investigation Report selesai, **wajib minta persetujuan** sebelum menulis kode:

> *"Ini hasil investigasi saya [tempel Investigation Report]. Root cause-nya adalah [X] karena [Y berdasarkan fakta di atas]. Fix yang saya usulkan adalah [Z]. Boleh saya lanjut implementasi?"*

Saya **tidak boleh langsung menulis kode** sebelum Mr Deden menyetujui analisis dan fix yang diusulkan. Ini memastikan:
- Mr Deden punya visibility penuh sebelum kode berubah
- Analisis saya bisa dikoreksi sebelum implementasi yang salah
- Tidak ada lagi 5-6 iterasi fix yang buang waktu

**Pengecualian** (tidak perlu konfirmasi): fix yang bersifat typo / obvious satu baris dan bukan terkait selector/DOM logic.

---

## Critical Rules

- **Public vs Authenticated files MUST be separate** — `{feature}.public.feature` and `{feature}.authenticated.feature`. Never mix in one file.
- **Tag `@public` or `@authenticated` is MANDATORY** at Feature level alongside priority (`@p0`) and feature name (`@login`)
- **Never hardcode URLs** — use helpers from `test-data.ts`: `getCemeteryUrl()`, `getCustomerOrgBaseUrl()`, `getCustomerOrgUrl(path)`
- **URL pattern**: public = `https://{env}.chronicle.rip/{cemetery}_{region}/...`, authenticated = `https://{env}-{region}.chronicle.rip/...`
- **Don't mix data approaches in one feature** — use either all Placeholders (`<TEST_*>`) or all Scenario Outline, not both

## Chronicle-Specific Gotchas

- Chronicle polls the server continuously — always use `NetworkHelper.waitForNetworkIdle()` after navigation, never rely on raw `networkidle`
- Some input fields start as read-only — click the field before filling
- Use `TimeoutHelper` (`clickWithRetry`, `fillWithRetry`) for all interactions, not raw Playwright waits
- Video files are auto-renamed by the `After()` hook — do not rename manually
- `<TEST_*>` placeholders resolve at runtime from `.env` / `test-data.ts`; `Scenario Outline` + `Examples` for per-run variations

## Wait Strategy — NEVER Use Static Waits

**DILARANG** pakai `page.waitForTimeout()`. Gunakan `NetworkHelper` atau element wait.

### Pilih Wait Berdasarkan Konteks:

| Konteks | Gunakan | Contoh |
|---------|---------|--------|
| Setelah navigasi/click yang pindah halaman | `waitForURL` + `waitForSelector` | `await page.waitForURL('**/add/roi'); await page.waitForSelector(selector);` |
| Tunggu API selesai (tahu endpoint) | `waitForEndpoint` (setup SEBELUM trigger) | `const p = waitForEndpoint(page, 'plots/'); await button.click(); await p;` |
| Tunggu API selesai (tidak tahu endpoint) | `NetworkHelper.waitForApiRequestsComplete()` | `await NetworkHelper.waitForApiRequestsComplete(page, 5000);` |
| Tunggu element muncul | `element.waitFor()` | `await locator.waitFor({ state: 'visible', timeout: 10000 });` |
| Setelah click dropdown/dialog | `waitFor` on overlay | `await page.locator('.cdk-overlay-pane').waitFor({ state: 'visible' });` |
| Tunggu animasi/transisi | `NetworkHelper.waitForAnimation()` | `await NetworkHelper.waitForAnimation(page);` |
| DOM stabil setelah render | `NetworkHelper.waitForStabilization()` | `await NetworkHelper.waitForStabilization(page, { minWait: 300, maxWait: 2000 });` |
| Form siap diisi | `NetworkHelper.waitForFormReady()` | `await NetworkHelper.waitForFormReady(page, 'form');` |

### Aturan Penting:
1. **Jangan duplikat wait** — jika step sebelumnya sudah `waitForSelector(X)`, step berikutnya tidak perlu wait `X` lagi
2. **`waitForEndpoint` HARUS dipasang SEBELUM action** — jika dipasang setelah, response bisa terlewat → timeout penuh
3. **Satu element wait cukup** — jika `mat-select:has-text("A")` sudah visible berarti API selesai + DOM rendered, tidak perlu tambah `waitForApiRequestsComplete` + `waitForStabilization`
4. **Gunakan `{ optional: true }` hati-hati** — jika API tidak terpanggil, wait tetap tunggu sampai timeout penuh

## Feature Map

Sebelum menyentuh file apapun untuk fitur tertentu, baca **`docs/FEATURE_MAP.md`** — berisi mapping lengkap:
feature → selectors → page object → steps → feature file → snapshots → entry point → run command.

## Adding New Tests

1. Selectors in `src/selectors/p0/<feature>/<feature>.selectors.ts`
2. Page object in `src/pages/p0/<Feature>Page.ts` extending `BasePage`
3. Steps in `src/steps/p0/<feature>.steps.ts`
4. Feature in `src/features/p0/<feature>.{public|authenticated}.feature` with required tags
5. Update `docs/FEATURE_MAP.md` dengan entry baru

## Debug Snapshots

Accessibility tree snapshots disimpan di `docs/snapshots/<feature>/` sebagai referensi selector & debugging.

### Cara Capture
```bash
# 1. Buka browser & navigasi ke halaman target
playwright-cli open https://staging-aus.chronicle.rip

# 2. Ambil snapshot → simpan ke .yml
playwright-cli snapshot

# 3. Simpan output ke docs/snapshots/<feature>/<nama>.yml
```

### Aturan
- **Simpan snapshot setiap debug flow baru** — taruh di `docs/snapshots/<feature>/`
- **Jika file sudah ada, replace** dengan yang terbaru jika UI berubah
- **Jika ada state baru** (misal: form setelah diisi), tambahkan file baru
- Gunakan YAML snapshot untuk cari selector **tanpa perlu buka browser ulang**
- `ref=eXXXX` berubah setiap session — jangan jadikan selector, gunakan `data-testid`, `role`, `aria-label`, atau text

### Root Directory — Wajib Bersih dari .yaml
- **DILARANG** meninggalkan file `.yaml` / `.yml` di root project
- Setiap kali `playwright-cli snapshot` dijalankan tanpa `--filename`, file otomatis masuk ke `.playwright-cli/` — biarkan di sana
- Setiap kali snapshot disimpan dengan nama custom (misal `playwright-cli snapshot --filename=foo.yaml`), **langsung pindahkan** ke `docs/snapshots/<feature>/foo.yaml`
- **Setelah setiap sesi debug**, jalankan:
  ```bash
  find . -maxdepth 1 -name "*.yaml" -o -maxdepth 1 -name "*.yml" | head -5
  ```
  Jika ada file, pindahkan ke folder snapshot yang sesuai dan update `README.md`-nya

### Snapshot yang Tersedia

Lihat `docs/snapshots/README.md` untuk index lengkap. Setiap folder punya `README.md` sendiri dengan tabel per file.

```
docs/snapshots/
├── advance-table/   # Tables > Advanced Table (Plots & ROIs tab)
├── at-need/         # Form At-need Plot Purchase — tiap step
├── home/            # Dashboard & homepage public
├── import/          # Halaman Import data
├── interment/       # Form Add Interment & plot detail tab Interments
├── login/           # Login page & state setelah login — semua env
├── plots/           # Plot detail & Edit Plot form
├── roi/             # Add/Edit ROI form, plot detail, activity — per tiket
├── tables/          # Halaman Tables (ROI Table & general)
└── evidence/        # Screenshot BEFORE/AFTER per eksekusi tiket
```

## Environment

`.env` files: `.env` (active), `.env.chronicle` (staging), `.env.chronicle.prod` (prod), `.env.dev`, `.env.map`. Never commit `.env`.
