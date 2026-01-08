# Chronicle Automation - Project Structure Guide

## 📋 Daftar Isi
- [Struktur Project](#struktur-project)
- [Centralized Test Data](#centralized-test-data)
- [Flow Penambahan Skenario Baru](#flow-penambahan-skenario-baru)
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
│       ├── Config.ts
│       └── Logger.ts
│
├── .env.example           # Template untuk environment variables
├── .env                   # ⭐ File untuk override test data (tidak di-commit)
└── cucumber.js            # Cucumber configuration
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

## 🔄 Flow Penambahan Skenario Baru

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
@p0 @login @smoke           # Priority + Feature + Type
@p1 @interment @negative    # Multiple tags untuk filtering
```

### 6. Background vs Before Hooks
- **Background**: Untuk setup yang specific ke feature (visible dalam feature file)
- **Hooks**: Untuk setup global (browser initialization, screenshot, dll)

### 7. Dynamic Steps vs Parameterized Steps
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
