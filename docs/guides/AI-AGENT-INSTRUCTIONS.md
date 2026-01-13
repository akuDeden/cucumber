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
  environment: 'staging',      // staging | map | production
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
- Example: `https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots`

**AUTHENTICATED URLs** (with region in subdomain):
- Format: `https://{environment}-{region}.chronicle.rip/{path}`
- Used for: login, customer-organization, add/edit ROI
- Example: `https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/...`

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
const publicUrl = BASE_CONFIG.baseUrl;               // https://staging.chronicle.rip
const cemeteryUrl = getCemeteryUrl();                // https://staging.chronicle.rip/astana_tegal_gundul_aus
const sellPlotsUrl = getCemeterySellPlotsUrl();      // https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots

// Authenticated URLs
const authBaseUrl = getCustomerOrgBaseUrl();         // https://staging-aus.chronicle.rip
const loginUrl = `${authBaseUrl}/login`;             // https://staging-aus.chronicle.rip/login
const addRoiUrl = getCustomerOrgUrl('A A 1/manage/add/roi'); // https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/A A 1/manage/add/roi
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
# Default: staging + aus
npm test -- --tags "@roi"

# Map environment + US region
ENVIRONMENT=map REGION=us npm test -- --tags "@roi"

# Production + UK region (future)
ENVIRONMENT=production REGION=uk npm test
```

**CRITICAL RULES:**
- ✅ **ALWAYS** use helper functions for URLs
- ✅ **NEVER** hardcode `https://staging.chronicle.rip` or `https://staging-aus.chronicle.rip`
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

### 4. MCP Playwright for Debugging

**Use MCP Playwright when:**
- Test fails and need to investigate actual browser behavior
- Need to find correct selectors
- Need to verify element interactions
- Need screenshots/console logs/network data

**Quick Debug Workflow:**
1. Navigate: `mcp_playwright_browser_navigate({ url: "..." })`
2. Snapshot: `mcp_playwright_browser_snapshot()` - get page structure
3. Test selector: `mcp_playwright_browser_click({ element: "...", ref: "..." })`
4. Check logs: `mcp_playwright_browser_console_messages({ level: "error" })`
5. Check network: `mcp_playwright_browser_network_requests()`
6. Screenshot: `mcp_playwright_browser_screenshot()`
7. Fix code based on findings

**Key MCP Commands:**
- `navigate` - go to URL
- `snapshot` - get page structure (use first to find selectors)
- `click` / `fill` - interact with elements
- `console_messages` - view console errors
- `network_requests` - view API calls
- `screenshot` - capture visual state
- `evaluate` - run custom JavaScript

### 5. Naming Conventions
- Feature files: `camelCase.{public|authenticated}.feature`
- Page objects: `PascalCase.ts` (LoginPage.ts)
- Step files: `camelCase.steps.ts` (login.steps.ts)
- Selectors: `camelCase.selectors.ts` exported as `PascalCase`

### 6. Tags Structure (ALL REQUIRED)
```gherkin
@p0 @feature-name @smoke @authenticated
```
- Priority: `@p0`, `@p1`, `@p2`
- Feature name: `@login`, `@search`, etc.
- Type: `@smoke`, `@regression`, `@negative`
- Access: `@public` or `@authenticated` (MANDATORY)

### 7. Selector Priority (Use in Order)
1. `[data-testid="..."]` - most reliable
2. `getByRole('button', { name: '...' })` - accessible
3. `#id` or `[name="..."]` - structural
4. CSS selectors - last resort

### 8. Running Tests

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
ENVIRONMENT=staging npm test -- --tags "@p0"
ENVIRONMENT=map REGION=us npm test -- --tags "@p0"

# Headless mode
npm run test:headless -- --tags "@p0"
```

### 9. Background Setup

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

### 10. Key Practices
- **DO**: Separate public/authenticated files
- **DO**: Use MCP Playwright to debug and verify selectors
- **DO**: Use centralized test data from `test-data.ts`
- **DO**: Use helper functions for URLs (getCemeteryUrl, getCustomerOrgBaseUrl, etc.)
- **DO**: Add `@public` or `@authenticated` tag to all features
- **DO**: Use dynamic steps for runtime-dependent values
- **DO**: Test with different environments using ENVIRONMENT and REGION variables
- **DON'T**: Mix public/authenticated in same file
- **DON'T**: Hardcode test data in feature files or steps
- **DON'T**: Hardcode URLs - always use helper functions
- **DON'T**: Guess selectors - verify with MCP Playwright first
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
# Test in staging (default)
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
| `BASE_CONFIG.baseUrl` | `https://staging.chronicle.rip` | Public base URL |
| `getCemeteryUrl()` | `https://staging.chronicle.rip/astana_tegal_gundul_aus` | Public cemetery URL |
| `getCemeterySellPlotsUrl()` | `https://staging.chronicle.rip/.../sell-plots` | Public sell plots page |
| `getCustomerOrgBaseUrl()` | `https://staging-aus.chronicle.rip` | Auth base URL |
| `getCustomerOrgUrl(path)` | `https://staging-aus.chronicle.rip/customer-organization/...` | Auth customer org pages |

**See [URL-STRUCTURE-GUIDE.md](URL-STRUCTURE-GUIDE.md) for complete URL documentation**

---

**For complete details, see CUCUMBER-STRUCTURE-GUIDE.md**
