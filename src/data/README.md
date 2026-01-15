# Test Data Management

## 📍 Single Source of Truth

**SEMUA test data harus diatur di `test-data.ts`** - ini adalah satu-satunya tempat untuk konfigurasi test.

## 🔄 Fallback System

Framework menggunakan **2-tier fallback system**:

```typescript
environment: process.env.ENV || process.env.ENVIRONMENT || 'dev'
```

**Priority Order:**
1. **Coba baca dari `.env` file** → `ENV=staging`
2. **Kalau tidak ada**, pakai default di `test-data.ts` → `'dev'`

### Contoh Scenario:

#### ✅ Scenario 1: Ada di `.env`
```bash
# File .env
ENV=staging
CHRONICLE_EMAIL=custom@email.com
```
→ Test pakai: `staging` & `custom@email.com`

#### ✅ Scenario 2: Tidak ada di `.env`
```bash
# File .env kosong atau variable tidak ada
```
→ Test pakai default dari test-data.ts: `'dev'` & `'faris+astanaorg@chronicle.rip'`

## 🎯 Cara Menggunakan

### 1. Import Test Data

```typescript
// Import yang kamu butuhkan
import { TEST_DATA, LOGIN_DATA, BASE_CONFIG } from '../data/test-data.js';

// Contoh penggunaan
await page.goto(BASE_CONFIG.baseUrl);
await loginPage.login(LOGIN_DATA.valid.email, LOGIN_DATA.valid.password);
```

### 2. Switch Environment via `.env`

Edit file `.env` di root project:

```bash
# Switch ke Staging
ENV=staging
BASE_URL=https://staging.chronicle.rip

# Switch ke Map/Production
ENV=map
BASE_URL=https://map.chronicle.rip

# Switch ke Dev
ENV=dev
BASE_URL=https://dev.chronicle.rip
```

### 3. Override Test Data via `.env`

```bash
# Override specific test data
ENV=staging
TEST_EMAIL=email-baru@example.com
TEST_PASSWORD=password-baru
TEST_CEMETERY_NAME=Different Cemetery
```

### 4. Jalankan Test

```bash
# Test akan OTOMATIS load .env dan pakai nilai di dalamnya
npm run test:headless -- --tags "@p0"

# Video/screenshot naming akan sesuai ENV:
# pass_staging_*.webm (kalau ENV=staging)
# fail_map_*.webm (kalau ENV=map)
```

## 📂 Struktur Data

```typescript
TEST_DATA = {
  config: {
    baseUrl,    // BASE_URL dari env atau default
    browser,    // Browser type (chromium/firefox/webkit)
    headless,   // true/false untuk headless mode
    timeout     // Default timeout in ms
  },
  login: {
    valid: { email, password, organizationName },
    invalid: { email, password }
  },
  cemetery: "Cemetery Name",
  plot: { section, row, number },
  advanceSearch: { plotId, plotType, status, ... },
  interment: { add: {...}, edit: {...} },
  roi: { basic: {...}, withPerson: {...} }
}
```

## ⚠️ Jangan Pakai Config.ts

`Config.ts` sudah deprecated. Semua config sekarang ada di `test-data.ts`.

## 🔄 Untuk Regression Testing

1. Copy `.env.example` ke `.env`
2. Update semua nilai test data
3. Run test - semua scenario akan pakai data baru

## 💡 Tips

- **Default values** sudah ada di `test-data.ts`
- **Override selective** - hanya set env var yang mau diubah
- **Bulk update** - pakai `.env` file untuk update banyak data sekaligus
- **Jangan commit** file `.env` (sudah ada di .gitignore)
