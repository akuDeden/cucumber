# Test Data Configuration - URL Structure Guide

## URL Structure Explained

### 🌐 PUBLIC URLs (No Region in Subdomain)
Digunakan untuk halaman public seperti sell-plots, public cemetery pages.

**Format**: `https://{environment}.chronicle.rip/{cemetery}_{region}/{path}`

**Contoh**:
```
Staging AUS: https://project.chronicle.rip/astana_tegal_gundul_aus
Staging US:  https://project.chronicle.rip/astana_tegal_gundul_us
Map AUS:     https://map.chronicle.rip/astana_tegal_gundul_aus
Map US:      https://map.chronicle.rip/astana_tegal_gundul_us
```

**Kapan digunakan**:
- Sell plots pages
- Public cemetery information
- Non-authenticated pages

### 🔐 AUTHENTICATED URLs (With Region in Subdomain)
Digunakan untuk halaman yang memerlukan autentikasi.

**Format**: `https://{environment}-{region}.chronicle.rip/{path}`

**Contoh**:
```
Staging AUS: https://staging-aus.chronicle.rip/login
Staging US:  https://staging-us.chronicle.rip/login
Map AUS:     https://map-aus.chronicle.rip/customer-organization/...
Map US:      https://map-us.chronicle.rip/customer-organization/...
```

**Kapan digunakan**:
- Login pages
- Customer organization pages
- Add/Edit ROI pages
- Authenticated dashboard

## Configuration

### Environment Variables

```bash
# Environment: staging, map, production
ENVIRONMENT=staging  # Default

# Region: aus, us, uk, etc.
REGION=aus          # Default

# Cemetery info
TEST_CEMETERY_UNIQUE=astana_tegal_gundul
TEST_CEMETERY_NAME="Astana Tegal Gundul"
TEST_ORG_NAME="astana tegal gundul"
```

### Code Configuration

```typescript
// In src/data/test-data.ts

export const BASE_CONFIG = {
  environment: 'staging',   // staging | map | production
  baseDomain: 'chronicle.rip',
  region: 'aus',           // aus | us | uk
  
  // Auto-generated
  get baseUrl(): string {
    return `https://${this.environment}.${this.baseDomain}`;
  }
};
```

## Helper Functions

### Public URLs

```typescript
// Get public base URL
BASE_CONFIG.baseUrl
// → https://project.chronicle.rip

// Get cemetery URL
getCemeteryUrl()
// → https://project.chronicle.rip/astana_tegal_gundul_aus

// Get sell plots URL
getCemeterySellPlotsUrl()
// → https://project.chronicle.rip/astana_tegal_gundul_aus/sell-plots
```

### Authenticated URLs

```typescript
// Get authenticated base URL
getCustomerOrgBaseUrl()
// → https://staging-aus.chronicle.rip

// Build login URL
`${getCustomerOrgBaseUrl()}/login`
// → https://staging-aus.chronicle.rip/login

// Get customer org URL
getCustomerOrgUrl('plots')
// → https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/plots
```

## Testing Different Environments

### Staging (Default)

```bash
npm test -- --tags "@request-sales-form-pre-need"

# URLs generated:
# Public: https://project.chronicle.rip/astana_tegal_gundul_aus
# Auth:   https://staging-aus.chronicle.rip
```

### Map Environment

```bash
ENVIRONMENT=map npm test -- --tags "@request-sales-form-pre-need"

# URLs generated:
# Public: https://map.chronicle.rip/astana_tegal_gundul_aus
# Auth:   https://map-aus.chronicle.rip
```

### Different Region

```bash
REGION=us npm test -- --tags "@request-sales-form-pre-need"

# URLs generated:
# Public: https://project.chronicle.rip/astana_tegal_gundul_us
# Auth:   https://staging-us.chronicle.rip
```

### Combine Environment + Region

```bash
ENVIRONMENT=map REGION=us npm test -- --tags "@request-sales-form-pre-need"

# URLs generated:
# Public: https://map.chronicle.rip/astana_tegal_gundul_us
# Auth:   https://map-us.chronicle.rip
```

## Migration from Old Structure

### ❌ Old (Hardcoded)

```typescript
// Bad - hardcoded URLs
const url = 'https://staging-aus.chronicle.rip/login';
const sellUrl = 'https://project.chronicle.rip/astana_tegal_gundul_us/sell-plots';
```

### ✅ New (Dynamic)

```typescript
// Good - use helper functions
import { getCustomerOrgBaseUrl, getCemeterySellPlotsUrl } from './data/test-data.js';

const loginUrl = `${getCustomerOrgBaseUrl()}/login`;
const sellUrl = getCemeterySellPlotsUrl();
```

## Examples by Use Case

### Public Sell Plots Page

```typescript
import { getCemeterySellPlotsUrl } from './data/test-data.js';

// Navigate to sell plots
await page.goto(getCemeterySellPlotsUrl());
// → https://project.chronicle.rip/astana_tegal_gundul_aus/sell-plots
```

### Authenticated Login

```typescript
import { getCustomerOrgBaseUrl, LOGIN_DATA } from './data/test-data.js';

// Navigate to login
const loginUrl = `${getCustomerOrgBaseUrl()}/login`;
await page.goto(loginUrl);
// → https://staging-aus.chronicle.rip/login

// Fill credentials
await page.fill('input[name="email"]', LOGIN_DATA.valid.email);
```

### Add/Edit ROI Page

```typescript
import { getCustomerOrgUrl } from './data/test-data.js';

// Navigate to add ROI
const plotName = 'A A 1';
const addRoiUrl = getCustomerOrgUrl(`${encodeURIComponent(plotName)}/manage/add/roi`);
await page.goto(addRoiUrl);
// → https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/A%20A%201/manage/add/roi
```

## FAQ

### Q: Kenapa public URLs tidak ada region di subdomain?
**A**: Public URLs dirancang untuk bisa diakses langsung tanpa perlu tahu region server. Region hanya ada di path (`/cemetery_aus`) untuk membedakan data.

### Q: Kenapa authenticated URLs ada region di subdomain?
**A**: Authenticated URLs perlu tahu region server untuk routing ke database dan resources yang benar. Region di subdomain (`staging-aus`) menentukan server mana yang digunakan.

### Q: Bagaimana cara test di production?
**A**: Untuk saat ini production environment belum tersedia. Nantinya bisa dengan:
```bash
ENVIRONMENT=production REGION=aus npm test
```

### Q: Apakah bisa custom domain selain chronicle.rip?
**A**: Ya, bisa dengan set environment variable:
```bash
BASE_DOMAIN=customdomain.com npm test
```

## Summary

| Type | Format | Example |
|------|--------|---------|
| **Public** | `{env}.domain/{cem}_{reg}` | `project.chronicle.rip/astana_tegal_gundul_aus` |
| **Auth** | `{env}-{reg}.domain` | `staging-aus.chronicle.rip/login` |

**Key Points**:
- ✅ Public = No region in subdomain
- ✅ Auth = Region in subdomain  
- ✅ Environment + Region = Fully configurable
- ✅ One place to change = Easy maintenance

---

**Last Updated**: January 12, 2026  
**Version**: 2.0.0
