# Chronicle Automation - AI Agent Instructions

## Project Structure
```
src/
├── core/           # BasePage, BrowserManager
├── data/           # test-data.ts (centralized test data)
├── features/       # .feature files (organized by p0/p1/p2)
├── hooks/          # Cucumber hooks & World
├── pages/          # Page Object Models (by priority)
├── selectors/      # UI selectors (by priority)
├── steps/          # Step definitions (by priority)
└── utils/          # Config, Logger, helpers
```

## Critical Rules

### 1. Public vs Authenticated Separation (MANDATORY)
- **MUST** separate scenarios into different files:
  - `{feature}.public.feature` - no login required
  - `{feature}.authenticated.feature` - login required
- **MUST** add tag: `@public` or `@authenticated` at Feature level
- **DO NOT** mix public and authenticated scenarios in one file

**Examples:**
```
src/features/p0/
├── advanceSearch.public.feature         # @public tag
├── advanceSearch.authenticated.feature  # @authenticated tag
└── searchBox.public.feature             # @public tag
```

### 2. Hybrid Approach - Data Management Strategy ⭐

**CRITICAL:** Framework uses **HYBRID APPROACH** combining:
- **Placeholders** for CONSISTENT data
- **Scenario Outline** for VARIABLE data

#### Decision Flow for New Test Data:

```
New Test Data?
  ↓
  ├─ Data KONSISTEN di semua test? (cemetery, credentials, person names)
  │   ↓ YES
  │   └─→ Use PLACEHOLDER
  │        1. Add to test-data.ts
  │        2. Add to TestDataHelper.ts
  │        3. Use <VARIABLE> in .feature
  │
  └─ Perlu test BERBAGAI KOMBINASI? (section A/B/C, prices, capacities)
      ↓ YES
      └─→ Use SCENARIO OUTLINE
           1. Create Scenario Outline in .feature
           2. Add Examples table with variations
```

#### Examples:

**✅ Use Placeholders:**
```gherkin
# ROI Feature - data konsisten
Scenario: Add ROI
  And I fill ROI form with following details
    | rightType | <TEST_ROI_RIGHT_TYPE> |  # Always "Cremation"
    | fee       | <TEST_ROI_FEE>        |  # Always "1000"
```

**✅ Use Scenario Outline:**
```gherkin
# AdvanceSearch - data bervariasi
Scenario Outline: Search by <section> <row>
  When I select section "<section>"  # Test A/B/C combinations
  
  Examples:
    | section | row |
    | A       | A   |
    | B       | B   |
    | C       | C   |
```

#### Consistency Rules:

| Feature Type | Approach | Files |
|-------------|----------|-------|
| ROI Management | All Placeholders | roi.feature |
| Interment Management | All Placeholders | interment.feature |
| Search Box | All Placeholders | searchBox.feature |
| Login | All Placeholders | login.feature |
| Advanced Search | All Scenario Outline | advanceSearch.*.feature |

**DO NOT mix approaches within one feature!**

### 3. Centralized Test Data & URL Configuration ⭐

#### 3.1 Configuration Structure
All test data and URLs are centralized in `src/data/test-data.ts`:

```typescript
// Base configuration
export const BASE_CONFIG = {
  environment: 'project',      // project | map | production
  baseDomain: 'chronicle.rip',
  region: 'aus',               // aus | us | uk
  
  // Auto-generated public URL
  get baseUrl(): string {
    return `https://${this.environment}.${this.baseDomain}`;
  }
};

// Cemetery configuration
export const CEMETERY_CONFIG = {
  uniqueName: 'astana_tegal_gundul',
  displayName: 'Astana Tegal Gundul',
  organizationName: 'astana tegal gundul'
};
```

#### 3.2 URL Structure - Public vs Authenticated

**PUBLIC URLs** (no region in subdomain):
- Format: `https://{environment}.chronicle.rip/{cemetery}_{region}/{path}`
- Used for: sell-plots, public pages, non-authenticated access
- Example: `https://project.chronicle.rip/astana_tegal_gundul_aus/sell-plots`

**AUTHENTICATED URLs** (with region in subdomain):
- Format: `https://{environment}-{region}.chronicle.rip/{path}`
- Used for: login, customer-organization, add/edit ROI
- Example: `https://project-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/...`

#### 3.3 Helper Functions for URLs

**Always use helper functions, NEVER hardcode URLs:**

```typescript
import { 
  BASE_CONFIG,
  getCemeteryUrl, 
  getCemeterySellPlotsUrl,
  getCustomerOrgBaseUrl,
  getCustomerOrgUrl 
} from '../../data/test-data.js';

// Public URLs
const publicUrl = BASE_CONFIG.baseUrl;               // https://project.chronicle.rip
const cemeteryUrl = getCemeteryUrl();                // https://project.chronicle.rip/astana_tegal_gundul_aus
const sellPlotsUrl = getCemeterySellPlotsUrl();      // https://project.chronicle.rip/astana_tegal_gundul_aus/sell-plots

// Authenticated URLs
const authBaseUrl = getCustomerOrgBaseUrl();         // https://project-aus.chronicle.rip
const loginUrl = `${authBaseUrl}/login`;             // https://project-aus.chronicle.rip/login
const addRoiUrl = getCustomerOrgUrl('A A 1/manage/add/roi'); // https://project-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/A A 1/manage/add/roi
```

#### 3.4 Test Data with Placeholders

In feature files, use placeholders:
```gherkin
When I enter email "<TEST_EMAIL>"
And I enter password "<TEST_PASSWORD>"
```

In step definitions, use replacePlaceholders:
```typescript
import { replacePlaceholders } from '../../utils/TestDataHelper.js';

When('I enter email {string}', async function (email: string) {
  const actual = replacePlaceholders(email);
  await page.fill('#email', actual);
});
```

#### 3.5 Testing Different Environments

```bash
# Default: project + aus
npm test -- --tags "@roi"

# Map environment + US region
ENVIRONMENT=map REGION=us npm test -- --tags "@roi"

# Production + UK region (future)
ENVIRONMENT=production REGION=uk npm test
```

**CRITICAL RULES:**
- ✅ **ALWAYS** use helper functions for URLs
- ✅ **NEVER** hardcode `https://project.chronicle.rip` or `https://project-aus.chronicle.rip`
- ✅ Use `BASE_CONFIG.baseUrl` for public URLs
- ✅ Use `getCustomerOrgBaseUrl()` for authenticated URLs
- ❌ **DON'T** mix environment variables in URLs manually

### 3. Adding New Scenarios - Quick Flow

**Step 1:** Determine priority (p0/p1/p2) and access level (public/authenticated)

**Step 2:** Add test data (if needed) to `src/data/test-data.ts`
```typescript
export const FEATURE_DATA = {
  field: process.env.TEST_FIELD || 'default_value'
};
```

**Step 3:** Create selectors file `src/selectors/p{X}/{feature}.selectors.ts`:
```typescript
export const FeatureSelectors = {
  button: '[data-testid="btn"]',
  input: 'input[name="field"]'
};
```

**Step 4:** Create feature file `src/features/p{X}/{feature}.{public|authenticated}.feature`:
```gherkin
@p0 @feature-name @public
Feature: Feature Name (Public Access)
  
  Background:
    # For public features - use BASE_CONFIG.baseUrl
    Given I am on the public cemetery page
  
  Scenario: Do something
    When I perform action with "<TEST_DATA>"
    Then I see result
```

**Step 5:** Create Page Object `src/pages/p{X}/{Feature}Page.ts`:
```typescript
import { Page } from '@playwright/test';
import { FeatureSelectors } from '../../selectors/p{X}/feature.selectors.js';
import { BASE_CONFIG, getCemeteryUrl } from '../../data/test-data.js';

export class FeaturePage {
  constructor(private page: Page) {}
  
  async navigate() {
    // Use helper functions for URLs
    const url = getCemeteryUrl();
    await this.page.goto(url);
  }
}
```

**Step 6:** Create step definitions `src/steps/p{X}/{feature}.steps.ts`:
```typescript
import { When, Then } from '@cucumber/cucumber';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { BASE_CONFIG } from '../../data/test-data.js';

When('I perform action with {string}', async function (data: string) {
  const actual = replacePlaceholders(data);
  await this.page.fill('input', actual);
});
```

**Step 7:** Run test: `npm test -- --tags "@feature-name"`

### 4. Browser Debugging: CLI Playwright First, MCP Playwright as Fallback

**Use browser debugging when:**
- Test fails and need to investigate actual browser behavior
- Need to find correct selectors
- Need to verify element interactions
- Need screenshots/console logs/network data

#### 4.1 CLI Playwright (PRIMARY - Use First) ⭐

**Always try `playwright-cli` first** — it's faster, simpler, and runs directly in the terminal.

**Quick Debug Workflow with CLI:**
```bash
# 1. Open browser and navigate
playwright-cli open https://project.chronicle.rip

# 2. Take snapshot to see page structure & element refs
playwright-cli snapshot

# 3. Interact with elements using refs from snapshot
playwright-cli click e15
playwright-cli fill e5 "user@example.com"
playwright-cli type "search query"
playwright-cli press Enter

# 4. Run JavaScript to inspect page / check state
playwright-cli eval "document.title"
playwright-cli eval "el => el.textContent" e5

# 5. Take screenshot for visual verification
playwright-cli screenshot
playwright-cli screenshot --filename=debug.png

# 6. Handle dialogs
playwright-cli dialog-accept
playwright-cli dialog-dismiss

# 7. Navigate back/forward, reload
playwright-cli go-back
playwright-cli reload

# 8. Close when done
playwright-cli close
```

**Key CLI Commands:**
| Command | Description |
|---------|-------------|
| `open [url]` | Open browser (optionally navigate) |
| `goto <url>` | Navigate to URL |
| `snapshot` | Get page structure with element refs |
| `click <ref>` | Click element by ref |
| `fill <ref> "text"` | Fill input field |
| `type "text"` | Type text (focused element) |
| `press <key>` | Press keyboard key |
| `select <ref> "value"` | Select dropdown option |
| `screenshot` | Capture screenshot |
| `eval "js"` | Execute JavaScript |
| `tab-list` | List open tabs |
| `tab-new [url]` | Open new tab |
| `close` | Close browser |

#### 4.2 MCP Playwright (FALLBACK - Use When CLI is Insufficient)

**Use MCP Playwright only when CLI Playwright cannot handle the case**, such as:
- Need to inspect console errors (`console_messages`)
- Need to monitor network requests (`network_requests`)
- Need complex multi-step automation that's hard in CLI
- Need to handle file uploads or drag interactions

**MCP Debug Workflow:**
1. Navigate: `mcp_playwright_browser_navigate({ url: "..." })`
2. Snapshot: `mcp_playwright_browser_snapshot()` - get page structure
3. Test selector: `mcp_playwright_browser_click({ element: "...", ref: "..." })`
4. Check logs: `mcp_playwright_browser_console_messages({ level: "error" })`
5. Check network: `mcp_playwright_browser_network_requests()`
6. Screenshot: `mcp_playwright_browser_take_screenshot()`
7. Fix code based on findings

**Key MCP Commands:**
- `navigate` - go to URL
- `snapshot` - get page structure (use first to find selectors)
- `click` / `fill_form` - interact with elements
- `console_messages` - view console errors
- `network_requests` - view API calls
- `take_screenshot` - capture visual state
- `evaluate` - run custom JavaScript

#### 4.3 Decision Flow

```
Need to debug browser?
  ↓
  ├─ Basic interaction? (navigate, click, fill, snapshot, screenshot)
  │   ↓ YES
  │   └─→ Use playwright-cli (CLI) ⭐
  │
  └─ Need console logs, network monitoring, or complex automation?
      ↓ YES
      └─→ Use MCP Playwright (fallback)
```

### 5. Debug Snapshots — Accessibility Tree YAML ⭐

Simpan accessibility tree snapshot dari `playwright-cli snapshot` ke `docs/snapshots/<feature>/` sebagai referensi selector & debugging.

#### 5.1 Capture & Simpan Snapshot
```bash
# 1. Debug di browser
playwright-cli open https://project-aus.chronicle.rip
playwright-cli snapshot

# 2. Simpan output ke file
# Contoh: docs/snapshots/roi/add-roi-form.yml
```

#### 5.2 Aturan Penyimpanan
| Kondisi | Aksi |
|---------|------|
| Flow baru di-debug | Simpan snapshot baru di `docs/snapshots/<feature>/` |
| File sudah ada, UI berubah | **Replace** file lama dengan yang baru |
| State baru (misal: form terisi) | **Tambah** file baru |
| Snapshot outdated (test gagal) | Capture ulang dan replace |

#### 5.3 Penamaan File
- `<nama-halaman>.yml` — state default (contoh: `plots-tab.yml`)
- `<nama-halaman>-<state>.yml` — state spesifik (contoh: `filtered-plots.yml`)
- `<form-name>.yml` — form kosong (contoh: `add-roi-form.yml`)
- `<action>-result.yml` — hasil aksi (contoh: `plot-search-result.yml`)

#### 5.4 Cara Pakai untuk Debug
1. Buka file `.yml` di `docs/snapshots/`
2. Cari element berdasarkan `role`, `data-testid`, `aria-label`, atau text content
3. **JANGAN** gunakan `ref=eXXXX` — berubah setiap session
4. Map ke selector di `src/selectors/`

#### 5.5 Snapshot yang Tersedia
```
docs/snapshots/
├── README.md
└── roi/
    ├── plots-tab.yml          # Tables > tab PLOTS (default)
    ├── filtered-plots.yml     # Tab PLOTS filter Status: Vacant
    ├── add-roi-form.yml       # Form Add ROI (kosong)
    └── plot-search-result.yml # Form Add ROI setelah search plot
```

### 6. Naming Conventions
- Feature files: `camelCase.{public|authenticated}.feature`
- Page objects: `PascalCase.ts` (LoginPage.ts)
- Step files: `camelCase.steps.ts` (login.steps.ts)
- Selectors: `camelCase.selectors.ts` exported as `PascalCase`

### 7. Tags Structure (ALL REQUIRED)
```gherkin
@p0 @feature-name @smoke @authenticated
```
- Priority: `@p0`, `@p1`, `@p2`
- Feature name: `@login`, `@search`, etc.
- Type: `@smoke`, `@regression`, `@negative`
- Access: `@public` or `@authenticated` (MANDATORY)

### 8. Selector Priority (Use in Order)
1. `[data-testid="..."]` - most reliable
2. `getByRole('button', { name: '...' })` - accessible
3. `#id` or `[name="..."]` - structural
4. CSS selectors - last resort

### 9. Running Tests

```bash
# By access level
npm test -- --tags "@public"
npm test -- --tags "@authenticated"

# By priority
npm test -- --tags "@p0"

# Combined
npm test -- --tags "@p0 and @authenticated"
npm test -- --tags "@search and @public"

# Different environments
ENVIRONMENT=project npm test -- --tags "@p0"
ENVIRONMENT=map REGION=us npm test -- --tags "@p0"

# Headless mode
npm run test:headless -- --tags "@p0"
```

### 10. Background Setup

**Public scenarios:**
```gherkin
Feature: Search (Public)
  # No background or minimal setup
  Scenario: Basic search
    Given I am on homepage
```

**Authenticated scenarios:**
```gherkin
Feature: Search (Authenticated)
  Background:
    Given I am on login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click login button
    Then I should be on dashboard
```

### 11. Key Practices
- **DO**: Separate public/authenticated files
- **DO**: Use `playwright-cli` (CLI) first to debug and verify selectors, then MCP Playwright as fallback
- **DO**: Use centralized test data from `test-data.ts`
- **DO**: Use helper functions for URLs (getCemeteryUrl, getCustomerOrgBaseUrl, etc.)
- **DO**: Add `@public` or `@authenticated` tag to all features
- **DO**: Use dynamic steps for runtime-dependent values
- **DO**: Test with different environments using ENVIRONMENT and REGION variables
- **DON'T**: Mix public/authenticated in same file
- **DON'T**: Hardcode test data in feature files or steps
- **DON'T**: Hardcode URLs - always use helper functions

### 12. Wait Strategy — DILARANG Static Wait ⭐

**JANGAN PERNAH** pakai `page.waitForTimeout()`. Chronicle polling terus-menerus, jadi `networkidle` juga tidak reliable.

#### Pilih Wait Berdasarkan Konteks:

```
// ❌ SALAH
await page.waitForTimeout(3000);
await page.waitForLoadState('networkidle');

// ✅ BENAR — Setelah navigasi
await page.waitForURL('**/manage/add/roi', { timeout: 20000 });
await page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible', timeout: 15000 });

// ✅ BENAR — Tunggu API (setup SEBELUM trigger action)
const apiPromise = waitForEndpoint(page, 'plots/?page=1');
await button.click();
await apiPromise;

// ✅ BENAR — Tunggu API selesai (tidak tahu endpoint)
await NetworkHelper.waitForApiRequestsComplete(page, 5000);

// ✅ BENAR — Tunggu dropdown/dialog
await page.locator('.cdk-overlay-pane').waitFor({ state: 'visible', timeout: 5000 });

// ✅ BENAR — Tunggu animasi
await NetworkHelper.waitForAnimation(page);

// ✅ BENAR — Tunggu DOM stabil
await NetworkHelper.waitForStabilization(page, { minWait: 300, maxWait: 2000 });
```

#### Aturan Anti-Duplikat:
1. **Jangan duplikat wait antar step** — jika `clickAddRoi()` sudah `waitForSelector(formTitle)`, maka `fillRoiForm()` tidak perlu wait `formTitle` lagi
2. **Satu element wait sudah cukup** — jika `mat-select:has-text("A")` visible, berarti API done + DOM rendered. Tidak perlu tambah `waitForApiRequestsComplete` + `waitForStabilization`
3. **`waitForEndpoint` HARUS di-setup SEBELUM action** — jika dipasang setelah click/navigate, response bisa sudah lewat → timeout penuh (30 detik terbuang)
4. **`{ optional: true }` pada `waitForApiEndpoint` tetap tunggu full timeout** jika API tidak terpanggil — hindari kecuali benar-benar perlu

#### Helper yang Tersedia:
| Helper | File | Kapan Pakai |
|--------|------|-------------|
| `waitForEndpoint(page, endpoint)` | `NetworkUtils.ts` | Tahu endpoint, setup SEBELUM action |
| `NetworkHelper.waitForApiRequestsComplete(page, timeout)` | `NetworkHelper.ts` | Tidak tahu endpoint, tunggu semua API selesai |
| `NetworkHelper.waitForApiEndpoint(page, pattern, timeout, opts)` | `NetworkHelper.ts` | Tahu endpoint, setup SETELAH action (hati-hati race) |
| `NetworkHelper.waitForAnimation(page)` | `NetworkHelper.ts` | Setelah click dropdown/tab/dialog |
| `NetworkHelper.waitForStabilization(page, opts)` | `NetworkHelper.ts` | DOM berubah-ubah, tunggu stabil |
| `NetworkHelper.waitForFormReady(page, selector)` | `NetworkHelper.ts` | Form Angular yang input-nya readonly dulu |
| `NetworkHelper.waitForDOMReady(page, timeout)` | `NetworkHelper.ts` | Tunggu DOM content loaded |
- **DON'T**: Guess selectors - verify with `playwright-cli` or MCP Playwright first
- **DON'T**: Create authenticated scenarios without proper Background setup

## Common Patterns

### Pattern 1: Public Feature Page Navigation
```typescript
import { BASE_CONFIG, getCemeterySellPlotsUrl } from '../../data/test-data.js';

// Navigate to public sell plots page
async navigateToSellPlots() {
  const url = getCemeterySellPlotsUrl();
  await this.page.goto(url);
}
```

### Pattern 2: Authenticated Page Navigation
```typescript
import { getCustomerOrgBaseUrl, getCustomerOrgUrl } from '../../data/test-data.js';

// Navigate to login
async navigateToLogin() {
  const loginUrl = `${getCustomerOrgBaseUrl()}/login`;
  await this.page.goto(loginUrl);
}

// Navigate to add ROI
async navigateToAddRoi(plotName: string) {
  const url = getCustomerOrgUrl(`${encodeURIComponent(plotName)}/manage/add/roi`);
  await this.page.goto(url);
}
```

### Pattern 3: Environment-Specific Testing
```bash
# Test in project (default)
npm test -- --tags "@roi"

# Test in map environment with US region
ENVIRONMENT=map REGION=us npm test -- --tags "@roi"
```

## Quick Reference

### File Organization by Priority
- **p0**: Critical scenarios (smoke, login, core features)
- **p1**: High priority features
- **p2**: Medium priority features

### Import Pattern
```typescript
// In step definitions
import { FeatureSelectors } from '../../selectors/p0/feature.selectors.js';
import { FeaturePage } from '../../pages/p0/FeaturePage.js';
import { FEATURE_DATA, BASE_CONFIG, getCemeteryUrl } from '../../data/test-data.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
```

### Page Object Pattern
```typescript
import { Page } from '@playwright/test';
import { FeatureSelectors } from '../../selectors/p0/feature.selectors.js';
import { BASE_CONFIG, getCustomerOrgUrl } from '../../data/test-data.js';

export class FeaturePage {
  constructor(private page: Page) {}
  
  async navigateToPublicPage() {
    await this.page.goto(BASE_CONFIG.baseUrl);
  }
  
  async navigateToAuthPage(path: string) {
    const url = getCustomerOrgUrl(path);
    await this.page.goto(url);
  }
  
  async performAction() {
    await this.page.click(FeatureSelectors.button);
  }
}
```

## Quick Reference: URL Helper Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `BASE_CONFIG.baseUrl` | `https://project.chronicle.rip` | Public base URL |
| `getCemeteryUrl()` | `https://project.chronicle.rip/astana_tegal_gundul_aus` | Public cemetery URL |
| `getCemeterySellPlotsUrl()` | `https://project.chronicle.rip/.../sell-plots` | Public sell plots page |
| `getCustomerOrgBaseUrl()` | `https://project-aus.chronicle.rip` | Auth base URL |
| `getCustomerOrgUrl(path)` | `https://project-aus.chronicle.rip/customer-organization/...` | Auth customer org pages |

**See [URL-STRUCTURE-GUIDE.md](URL-STRUCTURE-GUIDE.md) for complete URL documentation**

---

**For complete details, see CUCUMBER-STRUCTURE-GUIDE.md**
