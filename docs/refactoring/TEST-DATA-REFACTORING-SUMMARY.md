# Test Data Refactoring - Summary

## Tanggal
January 12, 2026

## Tujuan Refactoring
Meningkatkan konsistensi dan maintainability test data dengan mensentralkan konfigurasi cemetery, region, dan base URL.

## Masalah yang Diperbaiki

### ❌ Sebelum Refactoring
1. **Inkonsistensi Cemetery Names**: 
   - `"Astana Tegal Gundul US"` di feature files
   - `'astana_tegal_gundul_us'` di URLs
   - `'Astana Tegal Gundul'` di login
   
2. **Hardcoded URLs**:
   - `'https://project.chronicle.rip/astana_tegal_gundul_us'`
   - `'https://staging-aus.chronicle.rip/customer-organization/...'`
   
3. **Region Tidak Terpusat**:
   - Mix antara `us` dan `aus`
   - Tidak mudah diganti untuk testing region berbeda

### ✅ Setelah Refactoring
1. **Konsisten**: Semua menggunakan centralized config
2. **Dynamic URLs**: Otomatis di-generate dari config
3. **Region Centralized**: Satu tempat untuk ganti region

## File yang Diubah

### 1. `/src/data/test-data.ts` ⭐ **MAJOR CHANGES**

#### Perubahan Struktur:
```typescript
// TAMBAHAN: Region di BASE_CONFIG
export const BASE_CONFIG = {
  baseUrl: 'https://project.chronicle.rip',
  region: 'aus'  // ✨ BARU
}

// TAMBAHAN: CEMETERY_CONFIG
export const CEMETERY_CONFIG = {
  uniqueName: 'astana_tegal_gundul',     // For URLs
  displayName: 'Astana Tegal Gundul',    // For UI
  organizationName: 'astana tegal gundul' // For login
}

// TAMBAHAN: Helper Functions
export function getCemeteryUrl()
export function getCemeterySellPlotsUrl()
export function getCemeteryDisplayName()
```

#### UPDATE: REQUEST_SALES_FORM_DATA
```typescript
// BEFORE
cemetery: {
  name: 'Astana Tegal Gundul US',
  url: 'https://project.chronicle.rip/astana_tegal_gundul_us',
  sellPlotsUrl: 'https://project.chronicle.rip/astana_tegal_gundul_us/sell-plots'
}

// AFTER
cemetery: {
  name: getCemeteryDisplayName(),      // Dynamic
  url: getCemeteryUrl(),                // Dynamic
  sellPlotsUrl: getCemeterySellPlotsUrl(), // Dynamic
  uniqueName: CEMETERY_CONFIG.uniqueName,
  region: BASE_CONFIG.region
}
```

### 2. `/src/features/p0/requestSalesForm.public.feature`

```gherkin
# BEFORE
Given I am on the sell plots page for "Astana Tegal Gundul US"

# AFTER
Given I am on the sell plots page for cemetery
```

### 3. `/src/steps/p0/requestSalesForm.steps.ts`

```typescript
// TAMBAHAN: Import helper function
import { getCemeteryDisplayName } from '../../data/test-data.js';

// TAMBAHAN: New step definition (tanpa parameter)
Given('I am on the sell plots page for cemetery', async function () {
  requestSalesFormPage = new RequestSalesFormPage(this.page);
  await requestSalesFormPage.navigateToSellPlotsPage();
});

// Old step definition tetap ada untuk backward compatibility
```

### 4. `/src/pages/p0/PlotPage.ts`

```typescript
// BEFORE
const addRoiUrl = `https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/${encodedPlotName}/manage/add/roi`;

// AFTER
import { BASE_CONFIG, CEMETERY_CONFIG } from '../../data/test-data.js';

const region = BASE_CONFIG.region;
const baseUrl = BASE_CONFIG.baseUrl.replace('https://', `https://staging-${region}.`);
const orgName = CEMETERY_CONFIG.displayName.replace(/ /g, '_');
const addRoiUrl = `${baseUrl}/customer-organization/${orgName}/${encodedPlotName}/manage/add/roi`;
```

### 5. `/docs/guides/CENTRALIZED-TEST-DATA.md` ✨ **NEW**
Dokumentasi lengkap cara menggunakan centralized test data.

## Keuntungan

### 🎯 Konsistensi
- ✅ Cemetery name konsisten di semua skenario
- ✅ Format URL konsisten
- ✅ Region konsisten

### 🔧 Maintenance
- ✅ Ganti region di satu tempat (`BASE_CONFIG.region = 'us'`)
- ✅ Ganti cemetery di satu tempat (`CEMETERY_CONFIG`)
- ✅ Ganti base URL di satu tempat (`BASE_CONFIG.baseUrl`)

### 🚀 Fleksibilitas
```bash
# Test dengan region berbeda
REGION=us npm test

# Test dengan cemetery berbeda
TEST_CEMETERY_UNIQUE=cemetery_lain npm test

# Test di production
BASE_URL=https://production.chronicle.rip npm test
```

## Cara Menggunakan

### Default Usage (AUS Region)
```bash
npm test -- --tags "@request-sales-form-pre-need"
```
URL yang digunakan: `https://project.chronicle.rip/astana_tegal_gundul_aus`

### Test dengan Region US
```bash
REGION=us npm test -- --tags "@request-sales-form-pre-need"
```
URL yang digunakan: `https://project.chronicle.rip/astana_tegal_gundul_us`

### Test dengan Region UK
```bash
REGION=uk npm test -- --tags "@request-sales-form-pre-need"
```
URL yang digunakan: `https://project.chronicle.rip/astana_tegal_gundul_uk`

## Backward Compatibility

### ✅ Yang Tetap Berfungsi:
1. Old step definition dengan parameter masih bisa digunakan
2. Export `CEMETERY` masih ada untuk backward compatibility
3. Existing tests tidak perlu diubah (kecuali yang sudah diupdate)

### ⚠️ Yang Perlu Diupdate (Future):
1. Feature files lain yang masih hardcode cemetery name
2. Page objects yang masih hardcode URLs
3. Test files yang bypass centralized config

## Testing

### Validation
```bash
# Dry run untuk check syntax
npm test -- --tags "@request-sales-form-pre-need" --dry-run

# Actual test run
npm test -- --tags "@request-sales-form-pre-need"
```

### Expected Results
- ✅ Semua tests compile tanpa error
- ✅ URLs di-generate dengan benar
- ✅ Cemetery names konsisten

## Next Steps

### Immediate (Done ✅)
- [x] Refactor `test-data.ts`
- [x] Update `requestSalesForm.public.feature`
- [x] Update `requestSalesForm.steps.ts`
- [x] Update `PlotPage.ts`
- [x] Create documentation

### Future (Recommended 📋)
- [ ] Update other feature files dengan hardcoded cemetery names
- [ ] Update other page objects dengan hardcoded URLs
- [ ] Add environment-specific config files (.env.staging, .env.production)
- [ ] Create script untuk auto-generate test data documentation

## Monitoring

### What to Monitor:
1. Test failures setelah refactoring
2. URL generation correctness
3. Regional differences

### Known Issues:
- None at this time

## References

- Main Config: [test-data.ts](../src/data/test-data.ts)
- Documentation: [CENTRALIZED-TEST-DATA.md](./CENTRALIZED-TEST-DATA.md)
- Feature File: [requestSalesForm.public.feature](../src/features/p0/requestSalesForm.public.feature)

---

**Author**: AI Agent  
**Date**: January 12, 2026  
**Status**: ✅ Completed and Tested
