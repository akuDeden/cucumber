# Centralized Test Data Configuration

## Overview
Test data telah di-refactor untuk memastikan konsistensi dan kemudahan maintenance. Semua konfigurasi cemetery, region, dan URL sekarang tersentralisasi di satu tempat.

## Struktur Baru

### 1. Base Configuration
```typescript
export const BASE_CONFIG = {
  // Environment: staging, map, production, etc.
  environment: 'staging',
  
  // Base domain
  baseDomain: 'chronicle.rip',
  
  // Region: aus, us, uk, etc. (untuk authenticated URLs)
  region: 'aus',
  
  // Auto-generated public URL
  baseUrl: 'https://staging.chronicle.rip',  // ✅ PUBLIC (no region)
  
  browser: 'chromium',
  headless: false,
  timeout: 30000
}
```

### 2. Cemetery Configuration
```typescript
export const CEMETERY_CONFIG = {
  // Unique slug identifier untuk URLs
  uniqueName: 'astana_tegal_gundul',  // ✅ Format konsisten
  
  // Display name untuk UI
  displayName: 'Astana Tegal Gundul',
  
  // Organization name untuk login
  organizationName: 'astana tegal gundul'
}
```

### 3. Helper Functions (BARU)
Fungsi-fungsi helper untuk build URL secara dinamis:

```typescript
// ===== PUBLIC URLs (No region in subdomain) =====

// Build cemetery URL
getCemeteryUrl()
// Returns: "https://staging.chronicle.rip/astana_tegal_gundul_aus"

// Build sell plots URL
getCemeterySellPlotsUrl()
// Returns: "https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots"

// Get display name dengan region
getCemeteryDisplayName()
// Returns: "Astana Tegal Gundul AUS"

// ===== AUTHENTICATED URLs (With region in subdomain) =====

// Build customer org base URL
getCustomerOrgBaseUrl()
// Returns: "https://staging-aus.chronicle.rip"

// Build customer org URL with path
getCustomerOrgUrl('plots')
// Returns: "https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/plots"
```

### 📌 Perbedaan PUBLIC vs AUTHENTICATED URLs

**PUBLIC URLs** (untuk sell-plots, public pages):
- Format: `https://{environment}.chronicle.rip/{cemetery}_{region}`
- Contoh: `https://staging.chronicle.rip/astana_tegal_gundul_aus`
- Tidak ada region di subdomain

**AUTHENTICATED URLs** (untuk login, customer-organization):
- Format: `https://{environment}-{region}.chronicle.rip/...`
- Contoh: `https://staging-aus.chronicle.rip/login`
- Ada region di subdomain

## Keuntungan Refactoring

### ✅ Konsistensi
- Semua skenario menggunakan cemetery yang sama
- Format naming konsisten: `astana_tegal_gundul` (bukan campuran US/AUS)
- Base URL terpusat: `staging.chronicle.rip`

### ✅ Mudah Maintenance
- Ganti region di satu tempat (`BASE_CONFIG.region`)
- Ganti cemetery di satu tempat (`CEMETERY_CONFIG`)
- Tidak perlu update banyak file

### ✅ Fleksibel
- Support multiple regions (aus, us, uk, etc.)
- Easy override via environment variables
- Dynamic URL generation

## Cara Menggunakan

### Di Feature Files
```gherkin
# ❌ OLD - Hardcoded
Given I am on the sell plots page for "Astana Tegal Gundul US"

# ✅ NEW - Dynamic
Given I am on the sell plots page for cemetery
```

### Di Step Definitions
```typescript
import { getCemeteryDisplayName, REQUEST_SALES_FORM_DATA } from '../../data/test-data.js';

// Gunakan fungsi helper
const cemeteryName = getCemeteryDisplayName(); // "Astana Tegal Gundul AUS"
const cemeteryUrl = REQUEST_SALES_FORM_DATA.cemetery.url; // Auto-generated
```

### Di Page Objects
```typescript
// Otomatis menggunakan URL yang di-generate
await this.page.goto(REQUEST_SALES_FORM_DATA.cemetery.sellPlotsUrl);
// Goes to: https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots
```

## Environment Variables Override

### Ganti Region
```bash
# Default: aus
export REGION=us  # Sekarang semua URLs akan gunakan "_us"
npm test
```

### Ganti Cemetery
```bash
export TEST_CEMETERY_UNIQUE=cemetery_lain
export TEST_CEMETERY_NAME="Cemetery Lain"
export TEST_ORG_NAME="cemetery lain"
npm test
```

### Ganti Base URL
```bash
export BASE_URL=https://production.chronicle.rip
npm test
```

## Migration Guide

### File yang Sudah Di-update
1. ✅ `/src/data/test-data.ts` - Centralized config
2. ✅ `/src/features/p0/requestSalesForm.public.feature` - Dynamic cemetery name
3. ✅ `/src/steps/p0/requestSalesForm.steps.ts` - Uses helper functions

### File yang Perlu Di-update (Future)
- [ ] Other feature files yang menggunakan hardcoded cemetery names
- [ ] Other step definitions yang reference cemetery URLs langsung

## Best Practices

### ✅ DO
```typescript
// Gunakan centralized config
import { BASE_CONFIG, CEMETERY_CONFIG, getCemeteryUrl } from '../../data/test-data.js';

const url = getCemeteryUrl(); // Dynamic
const region = BASE_CONFIG.region; // Centralized
```

### ❌ DON'T
```typescript
// Jangan hardcode URLs
const url = 'https://staging.chronicle.rip/astana_tegal_gundul_us';

// Jangan hardcode region
const region = 'aus';

// Jangan bypass centralized config
const cemeteryName = 'Astana Tegal Gundul US';
```

## Testing Different Regions

```bash
# Test dengan region AUS (default)
npm test -- --tags "@request-sales-form-pre-need"

# Test dengan region US
REGION=us npm test -- --tags "@request-sales-form-pre-need"

# Test dengan region UK
REGION=uk npm test -- --tags "@request-sales-form-pre-need"
```

## Struktur REQUEST_SALES_FORM_DATA

```typescript
export const REQUEST_SALES_FORM_DATA = {
  cemetery: {
    name: getCemeteryDisplayName(),           // Dynamic: "Astana Tegal Gundul AUS"
    url: getCemeteryUrl(),                    // Dynamic: "https://staging.chronicle.rip/astana_tegal_gundul_aus"
    sellPlotsUrl: getCemeterySellPlotsUrl(),  // Dynamic: "https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots"
    uniqueName: CEMETERY_CONFIG.uniqueName,   // Static: "astana_tegal_gundul"
    region: BASE_CONFIG.region,               // Static: "aus"
  },
  // ... other data
}
```

## Troubleshooting

### Issue: Test gagal dengan URL yang salah
**Solution**: Check `BASE_CONFIG.region` dan `CEMETERY_CONFIG.uniqueName`

### Issue: Cemetery name tidak match di UI
**Solution**: Check `CEMETERY_CONFIG.displayName` dan gunakan `getCemeteryDisplayName()`

### Issue: Login gagal karena organization mismatch
**Solution**: Check `CEMETERY_CONFIG.organizationName`

## Summary

| Configuration | Location | Example Value |
|--------------|----------|---------------|
| Base URL | `BASE_CONFIG.baseUrl` | `https://staging.chronicle.rip` |
| Region | `BASE_CONFIG.region` | `aus` |
| Cemetery Slug | `CEMETERY_CONFIG.uniqueName` | `astana_tegal_gundul` |
| Cemetery Display | `CEMETERY_CONFIG.displayName` | `Astana Tegal Gundul` |
| Full URL | `getCemeteryUrl()` | `https://staging.chronicle.rip/astana_tegal_gundul_aus` |

---

**Last Updated**: January 2026  
**Version**: 1.0.0
