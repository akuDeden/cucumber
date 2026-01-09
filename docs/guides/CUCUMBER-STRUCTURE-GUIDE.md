# Chronicle Automation - Project Structure Guide

## 📋 Daftar Isi
- [Struktur Project](#struktur-project)
- [Hybrid Approach - Data Management Strategy](#hybrid-approach---data-management-strategy)
- [Centralized Test Data](#centralized-test-data)
- [Data-Driven Testing dengan Scenario Outline](#data-driven-testing-dengan-scenario-outline)
- [Pemisahan Skenario Public vs Authenticated](#pemisahan-skenario-public-vs-authenticated)
- [Flow Penambahan Skenario Baru](#flow-penambahan-skenario-baru)
- [Debugging dengan MCP Playwright](#debugging-dengan-mcp-playwright)
- [Best Practices](#best-practices)

---

## 📁 Struktur Project

```
automation_web/
├── src/
│   ├── core/              # Base classes & browser management
│   │   ├── BasePage.ts
│   │   └── BrowserManager.ts
│   │
│   ├── data/              # ⭐ CENTRALIZED TEST DATA
│   │   └── test-data.ts   # Semua data test berada di sini
│   │
│   ├── features/          # Gherkin feature files (organized by priority)
│   │   ├── p0/           # Priority 0 (Critical scenarios)
│   │   ├── p1/           # Priority 1 (High scenarios)
│   │   └── p2/           # Priority 2 (Medium scenarios)
│   │
│   ├── hooks/             # Cucumber hooks & world setup
│   │   ├── hooks.ts
│   │   └── World.ts
│   │
│   ├── pages/             # Page Object Models (organized by priority)
│   │   ├── p0/
│   │   ├── p1/
│   │   └── p2/
│   │
│   ├── selectors/         # UI element selectors (organized by priority)
│   │   ├── p0/
│   │   ├── p1/
│   │   └── p2/
│   │
│   ├── steps/             # Step definitions (organized by priority)
│   │   ├── p0/
│   │   ├── p1/
│   │   └── p2/
│   │
│   └── utils/             # Utility classes
│       └── Logger.ts
│
├── .env.example           # Template untuk environment variables
├── .env                   # ⭐ File untuk override test data (tidak di-commit)
└── cucumber.js            # Cucumber configuration
```

---

## 🎯 Hybrid Approach - Data Management Strategy

### Konsep Utama

Framework ini menggunakan **HYBRID APPROACH** yang menggabungkan 2 strategi data management:

1. **Placeholders** (`<TEST_VARIABLE>`) → Untuk data **KONSISTEN**
2. **Scenario Outline + Examples** → Untuk data **BERVARIASI**

### Decision Matrix: Kapan Pakai Apa?

| Data Type | Approach | Reason | Example |
|-----------|----------|--------|---------|
| **Cemetery** | ✅ Placeholder | Konsisten di semua test | `<TEST_CEMETERY>` |
| **Credentials** | ✅ Placeholder | Login data sama | `<TEST_EMAIL>`, `<TEST_PASSWORD>` |
| **Person Names** | ✅ Placeholder | Cukup 1 nilai untuk test functionality | `<TEST_INTERMENT_FIRSTNAME>` |
| **ROI Basic Data** | ✅ Placeholder | RightType, Fee, Term konsisten | `<TEST_ROI_RIGHT_TYPE>` |
| **Section/Row Combinations** | ✅ Scenario Outline | Perlu test A-A, B-B, C-C | Examples table |
| **Price Ranges** | ✅ Scenario Outline | Perlu test 500, 1000, 5000 | Examples table |
| **Capacity Variations** | ✅ Scenario Outline | Perlu test berbagai kombinasi | Examples table |
| **Status Types** | ✅ Scenario Outline | Perlu test Vacant, Reserved, Occupied | Examples table |

### Contoh Implementasi

#### ✅ Feature yang Pakai Placeholders

**ROI Feature** - Data konsisten:
```gherkin
@p0 @roi
Feature: ROI Management

  Background:
    When I enter email "<TEST_EMAIL>"          # Konsisten
    And I enter password "<TEST_PASSWORD>"      # Konsisten

  Scenario: Add ROI to vacant plot
    And I fill ROI form with following details
      | rightType   | <TEST_ROI_RIGHT_TYPE> |    # Konsisten: Cremation
      | fee         | <TEST_ROI_FEE>        |    # Konsisten: 1000
      | notes       | <TEST_ROI_NOTES>      |    # Konsisten
```

**Interment Feature** - Data konsisten:
```gherkin
  Scenario: Add Interment
    And I fill interment form with following details
      | firstName     | <TEST_INTERMENT_FIRSTNAME> |  # John
      | lastName      | <TEST_INTERMENT_LASTNAME>  |  # Doe
      | intermentType | <TEST_INTERMENT_TYPE>      |  # Burial
```

#### ✅ Feature yang Pakai Scenario Outline

**AdvanceSearch Feature** - Data bervariasi:
```gherkin
  Scenario Outline: Search by Section Row - <section> <row>
    When I select section "<section>"           # Bervariasi: A/B/C
    And I select row "<row>"                    # Bervariasi: A/B/C
    
    Examples:
      | section | row |  # Perlu test kombinasi berbeda
      | A       | A   |
      | B       | B   |
      | C       | C   |
```

### Kenapa Hybrid?

**Problem jika semua pakai Scenario Outline:**
```gherkin
# ❌ BAD - Cemetery harus direpeat di semua row!
Examples:
  | cemetery            | section | row |
  | Astana Tegal Gundul | A       | A   |
  | Astana Tegal Gundul | B       | B   |  # Repetitive!
  | Astana Tegal Gundul | C       | C   |  # Susah maintain!
```
**Mau ganti cemetery?** → Ubah di 100+ baris! 😱

**Solution dengan Hybrid:**
```gherkin
# ✅ GOOD - Cemetery pakai placeholder!
Background:
  Given I login to "<TEST_CEMETERY>"          # Placeholder (1 tempat)

Scenario Outline: Search - <section> <row>
  When I select section "<section>"
  
  Examples:
    | section | row |  # Cemetery tidak direpeat!
    | A       | A   |
    | B       | B   |
```
**Mau ganti cemetery?** → Edit 1 file (`test-data.ts`) ✅

### Consistency Rules

#### ✅ DO - Konsisten Approach per Feature Type

| Feature File | Approach | ✓ |
|-------------|----------|---|
| **roi.feature** | All Placeholders | ✅ |
| **interment.feature** | All Placeholders | ✅ |
| **searchBox.feature** | All Placeholders | ✅ |
| **login.feature** | All Placeholders | ✅ |
| **advanceSearch.authenticated.feature** | All Scenario Outline | ✅ |
| **advanceSearch.public.feature** | All Scenario Outline | ✅ |

#### ❌ DON'T - Mixed Approach dalam 1 Feature

```gherkin
# ❌ BAD - Mixing approaches
Scenario: Add ROI (using placeholders)
  And I fill form with "<TEST_ROI_FEE>"

Scenario Outline: Edit ROI (using outline)  # ← Inconsistent!
  And I fill form with "<fee>"
  Examples:
    | fee  |
    | 1000 |
```

### Quick Decision Guide

**Pertanyaan untuk memutuskan approach:**

1. **Apakah data ini SAMA di semua test?**
   - ✅ YES → Pakai **Placeholder**
   - ❌ NO → Lanjut ke pertanyaan 2

2. **Apakah perlu test dengan BERBAGAI NILAI?**
   - ✅ YES → Pakai **Scenario Outline**
   - ❌ NO → Pakai **Placeholder**

3. **Apakah nilai ini sering BERUBAH antar environment?**
   - ✅ YES → Pakai **Placeholder** (easy override via .env)
   - ❌ NO → Consider Scenario Outline

### File Structure for Hybrid Approach

```
src/data/test-data.ts           # Placeholders source
├── LOGIN_DATA                  # For all features
├── CEMETERY                    # For all features
├── ROI_DATA                    # For roi.feature
│   ├── basic { rightType, fee, term, notes }
│   ├── certificates { withPerson, applicant, both }
│   ├── holder { firstName, lastName, phone, email }
│   └── applicant { firstName, lastName, phone, email }
├── INTERMENT_DATA              # For interment.feature
│   ├── add { firstName, lastName, type }
│   └── edit { firstName, lastName, type }
└── SEARCH_DATA                 # For searchBox.feature
    └── roiHolder { searchName, displayName, plotId }

src/features/p0/
├── roi.feature                 # Uses ROI_DATA placeholders
├── interment.feature           # Uses INTERMENT_DATA placeholders
├── searchBox.feature           # Uses SEARCH_DATA placeholders
├── advanceSearch.authenticated.feature   # Uses Scenario Outline
└── advanceSearch.public.feature          # Uses Scenario Outline
```

---

## 🔐 Pemisahan Skenario Public vs Authenticated

### Konsep Pemisahan
Untuk memudahkan testing dan maintenance, skenario **public** (tanpa login) dan **authenticated** (dengan login) **HARUS DIPISAH** dalam file feature yang berbeda.

### Naming Convention

#### 1. Feature Files
- **Public scenarios**: `{feature-name}.public.feature`
- **Authenticated scenarios**: `{feature-name}.authenticated.feature`

**Contoh:**
```
src/features/p0/
├── advanceSearch.public.feature          # Scenario tanpa login
├── advanceSearch.authenticated.feature    # Scenario dengan login
├── searchBox.public.feature
├── searchBox.authenticated.feature
└── login.feature                          # Login only
```

#### 2. Tags untuk Filtering
```gherkin
# Public scenario
@p0 @advance-search @public
Feature: Advance Search (Public Access)
  As a visitor (not logged in)
  I want to search records
  
  Scenario: Search without login
    Given I am on the Chronicle homepage
    When I perform search
    # ... no login required

# Authenticated scenario
@p0 @advance-search @authenticated
Feature: Advance Search (Authenticated Access)
  As a logged in user
  I want to access advanced features
  
  Background:
    Given I am logged in as valid user
  
  Scenario: Search with advanced filters
    When I navigate to advance search
    # ... requires authentication
```

### Kapan Menggunakan Public vs Authenticated?

#### ✅ Public Scenarios (`*.public.feature`)
- Basic search functionality
- View public records
- Navigation tanpa login
- Read-only operations yang tidak memerlukan authentication

#### ✅ Authenticated Scenarios (`*.authenticated.feature`)
- CRUD operations (Create, Update, Delete)
- Access restricted data
- User-specific features
- Advanced filters yang hanya tersedia setelah login

### Background Setup

#### Public Scenarios
```gherkin
Feature: Search (Public Access)
  
  # No background atau minimal setup
  Scenario: Basic search
    Given I am on the Chronicle homepage
    When I search for "John Doe"
    Then I should see search results
```

#### Authenticated Scenarios
```gherkin
Feature: Search (Authenticated Access)
  
  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be redirected to the dashboard
  
  Scenario: Advanced search
    When I navigate to advance search page
    And I apply advanced filters
    Then I should see filtered results
```

### Running Tests by Type

```bash
# Run only public scenarios
npm test -- --tags "@public"

# Run only authenticated scenarios
npm test -- --tags "@authenticated"

# Run specific feature with authentication
npm test -- --tags "@authenticated and @advance-search"

# Run all p0 public scenarios
npm test -- --tags "@p0 and @public"
```

---

## ⭐ Centralized Test Data

### Konsep
Semua data test disimpan di **`src/data/test-data.ts`** untuk memudahkan:
- ✅ Regression testing dengan data baru
- ✅ Update data secara terpusat (sekali ubah, semua scenario terupdate)
- ✅ Environment-specific data via `.env` file

### Struktur Data

```typescript
// src/data/test-data.ts
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || 'default@example.com',
    password: process.env.TEST_PASSWORD || 'default123',
    organizationName: process.env.TEST_ORG_NAME || 'Default Org'
  }
};

export const INTERMENT_DATA = { ... };
export const ROI_DATA = { ... };
```

### Cara Penggunaan

#### 1. Dalam Feature File (.feature)
Gunakan placeholder dengan format `<VARIABLE_NAME>`:

```gherkin
Scenario: Login with valid credentials
  When I enter email "<TEST_EMAIL>"
  And I enter password "<TEST_PASSWORD>"
  Then I should see organization name "<TEST_ORG_NAME>"
```

#### 2. Dalam Step Definition (.steps.ts)
Import data dan replace placeholder:

```typescript
import { LOGIN_DATA } from '../../data/test-data.js';

When('I enter email {string}', async function (email: string) {
  const actualEmail = email.replace('<TEST_EMAIL>', LOGIN_DATA.valid.email);
  await page.fill('#email', actualEmail);
});
```

#### 3. Override via Environment Variables
Buat file `.env` (copy dari `.env.example`):

```bash
# .env
TEST_EMAIL=regression_user@chronicle.rip
TEST_PASSWORD=newPassword123
TEST_ORG_NAME=New Organization
```

---

## � Data-Driven Testing dengan Scenario Outline

### Konsep
**Scenario Outline** adalah best practice Cucumber untuk test dengan **berbagai kombinasi data** tanpa duplikasi code. Sangat berguna untuk:
- ✅ Test multiple input combinations
- ✅ Maintenance lebih mudah (data terlihat jelas di feature file)
- ✅ Tidak perlu ubah code atau environment variables
- ✅ Dokumentasi self-explanatory

### Kapan Menggunakan Scenario Outline?

| Approach | Kapan Pakai | Contoh Use Case |
|----------|-------------|-----------------|
| **Scenario Outline** | Test dengan **variasi data berbeda** | Search dengan section A/B/C, price range, capacity combinations |
| **Placeholder + test-data.ts** | Data **konsisten** di banyak scenario | Login credentials, organization name |
| **Hardcode** | Data **static** yang tidak pernah berubah | UI text validation, fixed labels |

### Contoh Implementasi

#### ❌ BEFORE (Maintenance Susah)
```gherkin
@advance-search
Scenario: Search section A
  When I select section "<TEST_ADVANCE_SECTION_A>"
  Then I should see results
  
# Mau test section B? Harus buat scenario baru atau ubah .env!
```

#### ✅ AFTER (Easy Maintenance)
```gherkin
@advance-search
Scenario Outline: Search by section - <section> <row>
  When I select section "<section>"
  And I select row "<row>"
  Then I should see results
  
  Examples:
    | section | row | description           |
    | A       | A   | High capacity plot    |
    | B       | A   | Garden plot           |
    | C       | B   | Different section     |
    | D       | C   | Edge case testing     |

# Mau tambah test untuk section E? Tinggal tambah row baru!
```

### Template Scenario Outline

#### 1. Single Parameter
```gherkin
Scenario Outline: Test with <parameter>
  When I perform action with "<parameter>"
  Then I should see result
  
  Examples:
    | parameter  | description      |
    | value1     | Normal case      |
    | value2     | Edge case        |
    | value3     | Boundary test    |
```

#### 2. Multiple Parameters
```gherkin
Scenario Outline: Advanced search - <section> <row> <type>
  When I select section "<section>"
  And I select row "<row>"
  And I select plot type "<type>"
  Then I should see results
  
  Examples:
    | section | row | type       | description           |
    | A       | A   | Garden     | Section A Garden      |
    | B       | B   | Lawn       | Section B Lawn        |
    | C       | A   | Monumental | Section C Monumental  |
```

#### 3. Complex Combinations
```gherkin
Scenario Outline: Search with capacity - B:<burial> C:<cremation>
  When I enter burial capacity "<burial>"
  And I enter cremation capacity "<cremation>"
  Then I should see "<expectedCount>" results
  
  Examples:
    | burial | cremation | expectedCount | description           |
    | 3      | 2         | 10            | High capacity         |
    | 1      | 1         | 25            | Standard capacity     |
    | 0      | 0         | 5             | No capacity filter    |
```

### Best Practices

#### ✅ DO:
- Use descriptive scenario names with parameter placeholders
- Add description column untuk dokumentasi
- Group related test data together
- Keep Examples table readable (align columns)
- Use meaningful parameter names

```gherkin
# ✅ GOOD
Scenario Outline: Login with <userType> - <expectedResult>
  When I login as "<userType>"
  Then I should see "<expectedResult>"
  
  Examples:
    | userType | expectedResult | description           |
    | admin    | Dashboard      | Admin user access     |
    | user     | Home           | Regular user access   |
    | guest    | Error          | Unauthorized access   |
```

#### ❌ DON'T:
```gherkin
# ❌ BAD - No context in scenario name
Scenario Outline: Test login
  When I login as "<type>"
  
  Examples:
    | type |
    | a    |   # Apa maksud 'a'?
    | b    |   # Tidak jelas!
```

### Hybrid Approach (Recommended)

Gunakan kombinasi **Scenario Outline** untuk data yang bervariasi dan **Placeholder** untuk data konsisten:

```gherkin
Feature: Advanced Search
  
  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"        # ← Placeholder (konsisten)
    And I enter password "<TEST_PASSWORD>"   # ← Placeholder (konsisten)
    And I click the login button
  
  @advance-search
  Scenario Outline: Search by section - <section> <row>
    When I select section "<section>"        # ← From Examples (bervariasi)
    And I select row "<row>"                 # ← From Examples (bervariasi)
    Then I should see results
    
    Examples:
      | section | row | description    |
      | A       | A   | Section A test |
      | B       | B   | Section B test |
```

### Benefits Summary

| Benefit | Description |
|---------|-------------|
| 🚀 **Fast Changes** | Tambah kombinasi test baru tanpa code change |
| 📖 **Self-Documenting** | Examples table adalah dokumentasi test cases |
| 🔧 **Easy Maintenance** | Update data di satu tempat (feature file) |
| ♻️ **No Duplication** | Satu scenario template untuk banyak test cases |
| 🎯 **Clear Intent** | Langsung keliatan mau test kombinasi apa |

---

## �🔄 Flow Penambahan Skenario Baru

### Step-by-Step Guide

#### 1️⃣ **Tentukan Priority**
- **P0**: Critical scenarios (smoke test, login, core features)
- **P1**: High priority features
- **P2**: Medium priority features

#### 2️⃣ **Tambahkan Data Test** (jika diperlukan)
Edit `src/data/test-data.ts`:

```typescript
export const NEW_FEATURE_DATA = {
  field1: process.env.TEST_NEW_FIELD1 || 'default value',
  field2: process.env.TEST_NEW_FIELD2 || 'default value'
};
```

Dan tambahkan ke `.env.example`:

```bash
# New Feature Test Data
TEST_NEW_FIELD1=value1
TEST_NEW_FIELD2=value2
```

#### 3️⃣ **Buat Selectors File**
`src/selectors/p{X}/new-feature.selectors.ts`:

```typescript
export const NewFeatureSelectors = {
  buttonSubmit: 'button[data-testid="submit"]',
  inputField: 'input[name="field1"]',
  // ... other selectors
};
```

Update `src/selectors/p{X}/index.ts`:

```typescript
export { NewFeatureSelectors } from './new-feature.selectors.js';
```

#### 4️⃣ **Buat Page Object** (opsional, jika kompleks)
`src/pages/p{X}/NewFeaturePage.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { NewFeatureSelectors } from '../../selectors/p{X}/new-feature.selectors.js';

export class NewFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async submitForm(data: any): Promise<void> {
    await this.page.fill(NewFeatureSelectors.inputField, data.field1);
    await this.page.click(NewFeatureSelectors.buttonSubmit);
  }
}
```

#### 5️⃣ **Buat Feature File**
`src/features/p{X}/new-feature.feature`:

```gherkin
@p{X} @new-feature
Feature: New Feature Description
  As a user
  I want to do something
  So that I can achieve a goal

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button

  @smoke @p{X}
  Scenario: Do something with new feature
    When I navigate to new feature page
    And I fill form with "<TEST_NEW_FIELD1>"
    And I click submit button
    Then I should see success message
```

#### 6️⃣ **Buat Step Definitions**
`src/steps/p{X}/new-feature.steps.ts`:

```typescript
import { When, Then } from '@cucumber/cucumber';
import { NewFeaturePage } from '../../pages/p{X}/NewFeaturePage.js';
import { NEW_FEATURE_DATA } from '../../data/test-data.js';

let newFeaturePage: NewFeaturePage;

When('I navigate to new feature page', async function () {
  newFeaturePage = new NewFeaturePage(this.page);
  await newFeaturePage.navigate('/new-feature');
});

When('I fill form with {string}', async function (field1: string) {
  const actualField1 = field1.replace('<TEST_NEW_FIELD1>', NEW_FEATURE_DATA.field1);
  await newFeaturePage.submitForm({ field1: actualField1 });
});

Then('I should see success message', async function () {
  await newFeaturePage.verifySuccessMessage();
});
```

#### 7️⃣ **Test Scenario**

```bash
# Run specific scenario
npm test -- --tags "@new-feature"

# Run by priority
npm test -- --tags "@p0"
```

---

## 🐛 Debugging dengan MCP Playwright

### Apa itu MCP Playwright?
MCP (Model Context Protocol) Playwright adalah tools untuk debugging dan explorasi actual flow browser secara interaktif. Gunakan MCP Playwright untuk:
- 🔍 **Debug actual flow**: Melihat langkah-langkah sebenarnya yang terjadi di browser
- 🎯 **Inspect elements**: Mencari dan verify selectors yang tepat
- 📸 **Capture state**: Mengambil screenshot dan melihat console logs
- 🔄 **Test interactions**: Mencoba klik, fill, navigate secara manual

### Kapan Menggunakan MCP Playwright?

#### ✅ Gunakan MCP Playwright ketika:
- ❌ Test gagal dan perlu investigasi kenapa
- 🤔 Tidak yakin selector yang tepat untuk element
- 🔍 Perlu verify actual behavior di browser
- 🐛 Ada unexpected behavior yang perlu di-debug
- 📊 Ingin melihat network requests/responses
- 🖼️ Perlu screenshot untuk bug report

#### 📋 Workflow Debug dengan MCP Playwright

**1. Test Gagal → Open Browser**
```bash
# Jalankan test yang gagal
npm test -- --tags "@advance-search"

# Test gagal? Use MCP Playwright untuk debug
```

**2. Navigate ke URL yang Bermasalah**
```typescript
// Via MCP Playwright
mcp_playwright_browser_navigate({
  url: "https://chronicle-staging.rip/advance-search"
})
```

**3. Inspect Element yang Bermasalah**
```typescript
// Ambil snapshot untuk lihat struktur page
mcp_playwright_browser_snapshot()

// Coba klik element
mcp_playwright_browser_click({
  element: "Submit button",
  ref: "button[data-testid='submit']"
})
```

**4. Check Console & Network**
```typescript
// Lihat console messages
mcp_playwright_browser_console_messages({
  level: "error"
})

// Lihat network requests
mcp_playwright_browser_network_requests({
  includeStatic: false
})
```

**5. Take Screenshot untuk Evidence**
```typescript
// Ambil screenshot state saat ini
mcp_playwright_browser_screenshot()
```

**6. Fix Test & Re-run**
```bash
# Update selector/step definition berdasarkan temuan
# Re-run test
npm test -- --tags "@advance-search"
```

### Contoh Debugging Session

#### Problem: Login button tidak bisa diklik

**Step 1: Buka browser dan navigate**
```typescript
// Navigate to login page
mcp_playwright_browser_navigate({
  url: "https://chronicle-staging.rip/login"
})
```

**Step 2: Ambil snapshot page**
```typescript
// Lihat struktur page dan available elements
mcp_playwright_browser_snapshot()
```

**Step 3: Test selector**
```typescript
// Coba selector yang berbeda
mcp_playwright_browser_click({
  element: "Login button",
  ref: "button[type='submit']"  // Test selector 1
})

// atau
mcp_playwright_browser_click({
  element: "Login button",
  ref: "//button[contains(text(), 'Login')]"  // Test selector 2
})
```

**Step 4: Check network & console**
```typescript
// Cek ada error di console?
mcp_playwright_browser_console_messages({ level: "error" })

// Cek ada failed network request?
mcp_playwright_browser_network_requests()
```

**Step 5: Update test code**
```typescript
// Update LoginSelectors dengan selector yang correct
export const LoginSelectors = {
  loginButton: 'button[type="submit"]', // Updated selector
  // ...
};
```

### Tips Debug dengan MCP Playwright

#### 1. Selalu Ambil Snapshot First
```typescript
// Snapshot memberikan overview lengkap page structure
mcp_playwright_browser_snapshot()
```

#### 2. Test Selector Secara Incremental
```typescript
// Test dari yang paling specific ke general
// 1. data-testid (most reliable)
mcp_playwright_browser_click({ ref: '[data-testid="submit"]' })

// 2. getByRole
mcp_playwright_browser_click({ ref: 'button:has-text("Submit")' })

// 3. CSS selector
mcp_playwright_browser_click({ ref: 'button.submit-btn' })
```

#### 3. Monitor Network untuk API Issues
```typescript
// Lihat failed requests
mcp_playwright_browser_network_requests()

// Check response status codes
// Cari requests dengan status 400, 500, etc.
```

#### 4. Console Logs untuk JavaScript Errors
```typescript
// Lihat semua level logs
mcp_playwright_browser_console_messages({ level: "info" })

// Focus pada errors
mcp_playwright_browser_console_messages({ level: "error" })
```

#### 5. Evaluate Custom JavaScript
```typescript
// Run custom JS untuk inspect state
mcp_playwright_browser_evaluate({
  function: "() => { return document.readyState; }"
})

// Check element properties
mcp_playwright_browser_evaluate({
  element: "Submit button",
  ref: "button[type='submit']",
  function: "(element) => { return element.disabled; }"
})
```

### Integrating Debug Findings ke Test Code

**Before (Test gagal):**
```typescript
// login.steps.ts - Selector salah
await this.page.click('#login-btn'); // Element tidak ada
```

**After Debug Session:**
```typescript
// 1. Update selectors based on snapshot
export const LoginSelectors = {
  loginButton: 'button[data-testid="login-submit"]', // Found via MCP
};

// 2. Update step definition
await this.page.click(LoginSelectors.loginButton);

// 3. Add wait if needed (found timing issue via MCP)
await this.page.waitForSelector(LoginSelectors.loginButton, {
  state: 'visible',
  timeout: 5000
});
await this.page.click(LoginSelectors.loginButton);
```

### MCP Playwright Commands Reference

| Command | Purpose | Example Use Case |
|---------|---------|------------------|
| `navigate` | Buka URL | Go to specific page for testing |
| `snapshot` | Get page structure | Find correct selectors |
| `click` | Click element | Test button interactions |
| `fill` | Fill input fields | Test form inputs |
| `screenshot` | Capture visual state | Bug report evidence |
| `console_messages` | View console logs | Debug JS errors |
| `network_requests` | View API calls | Debug API failures |
| `evaluate` | Run custom JS | Check element states |

---

## ✅ Best Practices

### 1. Naming Conventions
- **Feature files**: `camelCase.feature` (e.g., `advanceSearch.feature`, `searchBox.feature`)
- **Page objects**: `PascalCase.ts` (e.g., `LoginPage.ts`, `AdvanceSearchPage.ts`)
- **Step files**: `camelCase.steps.ts` (e.g., `login.steps.ts`, `advanceSearch.steps.ts`)
- **Selectors**: `camelCase.selectors.ts` (e.g., `login.selectors.ts`, `advanceSearch.selectors.ts`)
- **Selector exports**: `PascalCase` (e.g., `LoginSelectors`, `AdvanceSearchSelectors`)

### 2. Data Management
- ✅ **GUNAKAN** placeholder `<VARIABLE_NAME>` di feature file
- ✅ **IMPORT** dari `test-data.ts` di step definitions
- ✅ **TAMBAHKAN** environment variable di `.env.example`
- ❌ **JANGAN** hardcode data di feature file atau step definitions

### 3. Selectors Priority
Gunakan selector dengan prioritas berikut:
1. `data-testid` attributes (paling reliable)
2. `getByRole()` with accessible names
3. `id` attributes
4. `name` attributes
5. CSS selectors (last resort)

### 4. Step Definitions
- Gunakan descriptive names untuk step definitions
- Satu step = satu action/verification
- Reuse steps sebanyak mungkin
- Gunakan `Logger` untuk tracking

### 5. Tags Organization
```gherkin
@p0 @login @smoke @authenticated     # Priority + Feature + Type + Access Level
@p0 @search @public                  # Public access scenarios
@p1 @interment @negative @authenticated  # Multiple tags untuk filtering
```

**Tag Structure:**
- **Priority**: `@p0`, `@p1`, `@p2`
- **Feature**: `@login`, `@search`, `@interment`, dll
- **Type**: `@smoke`, `@regression`, `@negative`
- **Access Level**: `@public`, `@authenticated` ← **WAJIB untuk semua scenario**

### 6. Background vs Before Hooks
- **Background**: Untuk setup yang specific ke feature (visible dalam feature file)
- **Hooks**: Untuk setup global (browser initialization, screenshot, dll)

### 7. Pemisahan Public & Authenticated
- ✅ **Pisahkan** file feature untuk public dan authenticated scenarios
- ✅ **Gunakan** naming: `*.public.feature` dan `*.authenticated.feature`
- ✅ **Tag** setiap feature dengan `@public` atau `@authenticated`
- ❌ **Jangan** mix scenarios public dan authenticated dalam satu file

### 8. Feature File Naming
- ✅ Pisahkan public dan authenticated scenarios ke file berbeda
- ✅ Format: `{feature-name}.public.feature` atau `{feature-name}.authenticated.feature`
- ✅ Tambahkan tag `@public` atau `@authenticated` di level Feature
- ❌ Jangan campur public dan authenticated scenarios dalam satu file

### 9. Debug Flow
- ✅ **Gunakan MCP Playwright** untuk debug actual flow di browser
- ✅ Ambil snapshot page untuk find correct selectors
- ✅ Monitor console logs dan network requests untuk troubleshoot
- ✅ Take screenshot sebagai evidence untuk bug reports
- ❌ Jangan guess selectors, verify dengan MCP Playwright dulu

### 10. Dynamic Steps vs Parameterized Steps
Untuk step yang bergantung pada hasil filter atau kondisi runtime:
- ✅ **GUNAKAN** dynamic steps tanpa parameter (e.g., `I expand the first section`)
- ✅ **HINDARI** hardcoded values dalam step (e.g., `I expand section "a"`)
- ✅ **BUAT** method Page Object yang mengambil element pertama secara dinamis

**Contoh:**
```gherkin
# ❌ Bad: Hardcoded section
And I expand section "a"

# ✅ Good: Dynamic, ambil section pertama dari hasil filter
And I expand the first section
```

```typescript
// Page Object Method
async expandFirstSection(): Promise<string> {
  const sections = await this.page.locator('[data-testid^="section-toggle-"]').all();
  const firstSection = sections[0];
  await firstSection.click();
  return firstSection.getAttribute('data-section');
}
```

---

## 📝 Contoh Lengkap: Menambah Scenario Plot Management

<details>
<summary>Klik untuk melihat contoh lengkap</summary>

### 1. Data Test (`src/data/test-data.ts`)
```typescript
export const PLOT_MANAGEMENT_DATA = {
  plotName: process.env.TEST_PLOT_NAME || 'Plot A-1',
  plotType: process.env.TEST_PLOT_TYPE || 'Single',
  plotSize: process.env.TEST_PLOT_SIZE || '2x2'
};
```

### 2. Selectors (`src/selectors/p1/plot-management.selectors.ts`)
```typescript
export const PlotManagementSelectors = {
  addPlotButton: 'button[data-testid="add-plot"]',
  plotNameInput: 'input[name="plotName"]',
  plotTypeSelect: 'select[name="plotType"]',
  savePlotButton: 'button[type="submit"]'
};
```

### 3. Feature File (`src/features/p1/plot-management.feature`)
```gherkin
@p1 @plot-management
Feature: Plot Management
  
  Background:
    Given I am logged in as admin

  @add-plot @p1
  Scenario: Add new plot
    When I click add plot button
    And I fill plot name "<TEST_PLOT_NAME>"
    And I select plot type "<TEST_PLOT_TYPE>"
    And I click save button
    Then I should see plot "<TEST_PLOT_NAME>" in the list
```

### 4. Step Definition (`src/steps/p1/plot-management.steps.ts`)
```typescript
import { When, Then } from '@cucumber/cucumber';
import { PLOT_MANAGEMENT_DATA } from '../../data/test-data.js';

When('I fill plot name {string}', async function (plotName: string) {
  const name = plotName.replace('<TEST_PLOT_NAME>', PLOT_MANAGEMENT_DATA.plotName);
  await this.page.fill('input[name="plotName"]', name);
});
```

</details>

---

## 🔍 Troubleshooting

### Data tidak terupdate?
- ✅ Pastikan `.env` file sudah dibuat (copy dari `.env.example`)
- ✅ Restart test runner setelah update `.env`
- ✅ Cek import statement di step definition

### Selector tidak ditemukan?
- ✅ Cek element dengan Playwright Inspector: `npm run debug`
- ✅ Tambahkan wait/timeout jika element load lambat
- ✅ Gunakan `getByRole()` untuk lebih reliable

### Step definition tidak match?
- ✅ Cek regex pattern di step definition
- ✅ Pastikan text di feature file match exactly dengan step definition
- ✅ Running `npm test -- --dry-run` untuk check missing steps

---

## 📚 Resources

- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

---

**Last Updated**: January 2026  
**Maintainer**: QA Team
