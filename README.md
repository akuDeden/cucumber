# Chronicle Web Automation Framework

A web automation framework for Chronicle using Playwright, Cucumber, and TypeScript with real test scenarios against staging.chronicle.rip.

## ⚠️ Known Issues

**Add ROI Bug in Staging** (Dec 28, 2025): The "Add ROI" button on plot detail pages does not navigate to the form. See [BUG-REPORT.md](BUG-REPORT.md) for details. Screenshot evidence available in `screenshots/` directory.

## 📁 Project Structure

```
automation_web/
├── src/
│   ├── core/              # Core framework components
│   │   ├── BasePage.ts
│   │   └── BrowserManager.ts
│   ├── features/          # Feature files organized by priority
│   │   ├── p0/           # P0 - Critical test scenarios (Smoke tests)
│   │   │   └── login.feature
│   │   ├── p1/           # P1 - High priority test scenarios
│   │   └── p2/           # P2 - Medium priority test scenarios
│   ├── pages/            # Page Object Models organized by priority
│   │   ├── p0/
│   │   │   └── LoginPage.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── steps/            # Step definitions organized by priority
│   │   ├── p0/
│   │   │   └── login.steps.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── selectors/        # CSS selectors organized by priority
│   │   ├── p0/
│   │   │   └── login.selectors.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── hooks/            # Cucumber hooks
│   │   ├── hooks.ts
│   │   └── World.ts
│   └── utils/            # Utility functions
│       └── Logger.ts
├── cucumber.js           # Cucumber configuration
├── package.json
└── tsconfig.json
```

## 🎯 Priority Classification

- **P0**: Critical functionality, must pass for every release (smoke tests)
  - Example: Login, Core user flows
- **P1**: High priority features, important business functionality
  - Example: Key features, Common user scenarios
- **P2**: Medium priority features, secondary functionality
  - Example: Edge cases, Nice-to-have features

## 🌐 Test Environment

- **Target URL**: https://staging.chronicle.rip
- **Test Organization**: Astana Tegal Gundul
- **Test Credentials**:
  - Email: `faris+astanaorg@chronicle.rip`
  - Password: `12345`

## 🔧 Test Data Management

Framework ini menggunakan **Environment-Based Configuration Pattern** dengan 3 komponen utama:

### 1. `.env.example` - Template File
- **Fungsi**: Template/dokumentasi untuk environment variables
- **Kapan dipakai**: Copy ke `.env` ketika ingin override nilai default
- **Format**: Standard environment variables (`KEY=VALUE`)
- **Note**: File ini TIDAK dipakai langsung oleh test!

### 2. `src/data/test-data.ts` - Single Source of Truth ⭐
- **Fungsi**: **Pusat data testing yang sebenarnya dipakai**
- **Logika**: `process.env.VARIABLE_NAME || 'default value'`
- **Ini yang dipakai oleh semua test!**
- **Structure**:
  ```typescript
  export const ADVANCE_SEARCH_DATA = {
    sectionA: process.env.TEST_ADVANCE_SECTION_A || 'A',
    rowA: process.env.TEST_ADVANCE_ROW_A || 'A',
    // ... more data
  };
  ```

### 3. `src/utils/TestDataHelper.ts` - Placeholder Mapper
- **Fungsi**: Converter untuk placeholder di file `.feature` (Gherkin)
- **Contoh**: Mengubah `<TEST_ADVANCE_SECTION_A>` → nilai dari `test-data.ts`
- **Kapan dipakai**: Di Cucumber step definitions untuk replace placeholders

### 🎯 Cara Mengubah Test Data

#### Cara 1: Ubah Default Values (Permanent)
Edit [src/data/test-data.ts](src/data/test-data.ts):
```typescript
sectionA: process.env.TEST_ADVANCE_SECTION_A || 'B',  // Ubah 'A' → 'B'
```

#### Cara 2: Override via Environment Variable (Flexible)
1. Copy `.env.example` → `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` untuk override nilai tertentu:
   ```bash
   # Override section A
   TEST_ADVANCE_SECTION_A=B
   
   # Override untuk different environment
   BASE_URL=https://production.chronicle.rip
   TEST_EMAIL=different@email.com
   ```

3. Run test seperti biasa - akan otomatis pakai nilai dari `.env`

### 📝 Menambah Variable Baru

**Step 1**: Tambah di `src/data/test-data.ts`
```typescript
export const ADVANCE_SEARCH_DATA = {
  sectionA: process.env.TEST_ADVANCE_SECTION_A || 'A',
  sectionC: process.env.TEST_ADVANCE_SECTION_C || 'C',  // ← NEW
};
```

**Step 2**: Tambah di `src/utils/TestDataHelper.ts` (jika pakai placeholder)
```typescript
const PLACEHOLDER_MAP: Record<string, string> = {
  '<TEST_ADVANCE_SECTION_A>': TEST_DATA.advanceSearch.sectionA,
  '<TEST_ADVANCE_SECTION_C>': TEST_DATA.advanceSearch.sectionC,  // ← NEW
};
```

**Step 3**: Tambah di `.env.example` (optional, untuk dokumentasi)
```bash
# Section C (new section)
TEST_ADVANCE_SECTION_C=C
```

### 🎯 Data-Driven Testing dengan Scenario Outline

**Framework menggunakan HYBRID APPROACH** yang menggabungkan:
- **Placeholders** untuk data **KONSISTEN** (cemetery, credentials)
- **Scenario Outline** untuk data **BERVARIASI** (section A/B/C, price range)

#### Why Hybrid?

**Problem:** Jika semua pakai Scenario Outline, mau ganti cemetery harus ubah di banyak tempat!
```gherkin
# ❌ BAD - Cemetery repeated everywhere
Examples:
    | cemetery              | section | row |
    | Astana Tegal Gundul  | A       | A   |
    | Astana Tegal Gundul  | B       | B   |  # Must repeat!
```

**Solution:** Hybrid Approach!
```gherkin
Background:
    Given I navigate to "<TEST_CEMETERY>"      # ← PLACEHOLDER (konsisten)

Scenario Outline: Search by <section> <row>
    When I select section "<section>"          # ← EXAMPLES (bervariasi)
    
    Examples:
        | section | row |
        | A       | A   |
        | B       | B   |  # ← Cemetery not repeated!
```

#### Decision Matrix

| Data Type | Approach | Where to Change |
|-----------|----------|-----------------|
| **Cemetery** | Placeholder | `test-data.ts` or `.env` |
| **Credentials** | Placeholder | `test-data.ts` or `.env` |
| **Section A/B/C** | Scenario Outline | Examples table in `.feature` |
| **Price Range** | Scenario Outline | Examples table in `.feature` |

**Benefits:**
- ✅ Ganti cemetery: Edit 1 file (`test-data.ts`)
- ✅ Tambah section D: Tambah 1 row di Examples
- ✅ Best of both worlds!

#### Quick Decision Guide

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

**Dokumentasi lengkap:** 
- 📖 [Hybrid Approach Guide](docs/HYBRID-APPROACH-GUIDE.md) - **⭐ READ THIS!**
- 📖 [Data-Driven Testing Guide](docs/DATA-DRIVEN-TESTING-GUIDE.md)
- 📖 [Cucumber Structure Guide](CUCUMBER-STRUCTURE-GUIDE.md) - Detailed architecture
- ⚡ [Quick Reference: Add Test Data](docs/QUICK-REFERENCE-ADD-TEST-DATA.md)

### 💡 Workflow Recommendations

| Scenario | Action | File to Edit |
|----------|--------|--------------|
| **Development** | Ubah default values | `src/data/test-data.ts` |
| **Different Environment** | Override via env vars | Create `.env` file |
| **Regression Testing** | Use different data set | Create `.env` with new values |
| **CI/CD Pipeline** | Set environment variables | Pipeline config (GitHub Actions, etc.) |

### ✅ Best Practices

- ✅ **Never commit `.env`** - Add to `.gitignore`
- ✅ **Keep `.env.example` updated** - Document all available variables
- ✅ **Use descriptive variable names** - `TEST_ADVANCE_SECTION_A` not `SECTION`
- ✅ **Always provide default values** - Tests should work without `.env`
- ✅ **Document why values exist** - Add comments in `test-data.ts`

## 🎯 Element Selectors

All CSS selectors are organized in separate files under `src/selectors/` directory for better maintainability and reusability.

### Login Page Selectors (`src/selectors/p0/login.selectors.ts`)
- Email input: `[data-testid="login-mat-form-field-input-mat-input-element"]`
- Password input: `[data-testid="login-mat-form-field-input-password"]`
- Login button: `[data-testid="login-login-screen-button-mat-focus-indicator"]`
- Hide password button: `[data-testid="login-button-hide-password"]`

### Why Separate Selectors?
✅ **Reusability**: Share selectors across multiple page objects  
✅ **Maintainability**: Update selectors in one place when UI changes  
✅ **Readability**: Page objects focus on logic, not selector details  
✅ **Documentation**: Selectors are self-documenting with comments  

See [src/selectors/README.md](src/selectors/README.md) for more details.

3. **Failed login with empty credentials**
   - Login dengan field kosong

4. **Successful logout**
   - Test flow login dan logout

5. **Scenario Outline: Login with different credentials**
   - Test multiple scenarios sekaligus

## 🎯 Selector Strategy

Framework menggunakan `data-testid` selectors untuk stability:

```typescript
// Example dari ChronicleLoginPage.ts
this.emailInput = page.locator('[data-testid="login-email-input"]');
this.passwordInput = page.locator('[data-testid="login-password-input"]');
this.loginButton = page.locator('[data-testid="login-submit-button"]');
```

Contoh dari requirement:
```typescript
this.cemeteryName = page.locator('[data-testid="perfect-scrollbar-h3-cemetery-name"]');
```

## 📊 Reports

Setelah test run selesai, reports akan di-generate:

- **HTML Report**: `cucumber-report.html`
- **JSON Report**: `cucumber-report.json`
- **Screenshots**: `screenshots/` (jika test gagal)
- **Videos**: `videos/` (rekam test execution)

## 🔧 Configuration

## 🚀 Running Tests
```bash
 npm run test:headless -- --tags "@p0"
```

### Run all tests
```bash
npm test
```

### Run tests by priority
```bash
npm run test:p0   # Run P0 critical tests (smoke tests)
npm run test:p1   # Run P1 high priority tests
npm run test:p2   # Run P2 medium priority tests
```

### Run tests by tag
```bash
npm run test:login    # Run all login tests
npm run test:smoke    # Run smoke tests
```

### Run tests in parallel
```bash
npm run test:parallel
```

### Run with HTML report
```bash
npm run test:debug
```

## 📝 Available Test Scenarios

### P0 - Login Tests

1. **Successful login with valid credentials** (@p0 @login @smoke)
   - Verify user can login with valid credentials
   - Verify organization name is displayed: "astana tegal gundul"
   - Verify user email is displayed: "faris+astanaorg@chronicle.rip"

2. **Login with invalid credentials** (@p0 @login @negative)
   - Verify error message is shown for invalid credentials

3. **Login with empty email** (@p0 @login @negative)
   - Verify login button is disabled when email is empty

4. **Login with empty password** (@p0 @login @negative)
   - Verify login button is disabled when password is empty

## 🔧 Development Guide

### Adding New Tests

1. **Create feature file** in appropriate priority folder:
   ```
   src/features/p0/new-feature.feature
   ```

2. **Create selectors file** with real data-testid selectors:
   ```typescript
   // src/selectors/p0/new-feature.selectors.ts
   export const NewFeatureSelectors = {
     element: '[data-testid="real-testid-from-staging"]'
   } as const;
   ```

3. **Create page object** that imports selectors:
   ```typescript
   // src/pages/p0/NewFeaturePage.ts
   import { NewFeatureSelectors } from '../../selectors/p0/new-feature.selectors';
   
   export class NewFeaturePage {
     async clickElement() {
       await this.page.locator(NewFeatureSelectors.element).click();
     }
   }
   ```

4. **Create step definitions**:
   ```typescript
   // src/steps/p0/new-feature.steps.ts
   import { Given, When, Then } from '@cucumber/cucumber';
   import { NewFeaturePage } from '../../pages/p0/NewFeaturePage';
   ```

### Best Practices

- ✅ Always use real `data-testid` selectors from staging environment
- ✅ Click on input fields before filling (they may be readonly initially)
- ✅ Wait for network idle after navigation
- ✅ Use proper logging for debugging
- ✅ Organize tests by priority (p0, p1, p2)
- ✅ Tag scenarios appropriately (@smoke, @negative, @login, etc.)
- ✅ Test against real staging environment

### Important Notes

**Input Field Interaction:**
```typescript
// Chronicle inputs are readonly initially, must click first
await page.locator(selector).click();
await page.locator(selector).fill(value);
```

## 📦 Dependencies

- **@playwright/test**: Browser automation
- **@cucumber/cucumber**: BDD framework  
- **TypeScript**: Type-safe code
- **ts-node**: TypeScript execution

## 🏗️ Framework Architecture

### Core Components

- **BasePage**: Base class with common page methods
- **BrowserManager**: Singleton for browser instance management
- **Logger**: Structured logging utility
- **Config**: Environment configuration

### OOP Principles

- **Encapsulation**: Each Page Object encapsulates selectors and methods
- **Inheritance**: All pages extend BasePage
- **Abstraction**: BasePage abstracts Playwright complexity
- **Singleton**: BrowserManager uses singleton pattern

## 📊 Reports

After test execution, check:
- Console output for detailed logs
- `cucumber-report.html` for HTML report
- `cucumber-report.json` for JSON report

## 📚 Examples

See the P0 login implementation:
- **Feature file**: [src/features/p0/login.feature](src/features/p0/login.feature)
- **Selectors**: [src/selectors/p0/login.selectors.ts](src/selectors/p0/login.selectors.ts)
- **Page Object**: [src/pages/p0/LoginPage.ts](src/pages/p0/LoginPage.ts)
- **Step definitions**: [src/steps/p0/login.steps.ts](src/steps/p0/login.steps.ts)

### Example: Using Separated Selectors

**Selectors file** (`src/selectors/p0/login.selectors.ts`):
```typescript
export const LoginSelectors = {
  emailInput: '[data-testid="login-mat-form-field-input-mat-input-element"]',
  passwordInput: '[data-testid="login-mat-form-field-input-password"]',
  loginButton: '[data-testid="login-login-screen-button-mat-focus-indicator"]',
} as const;
```

**Page Object** (`src/pages/p0/LoginPage.ts`):
```typescript
import { LoginSelectors } from '../../selectors/p0/login.selectors';

export class LoginPage {
  async enterEmail(email: string) {
    await this.page.locator(LoginSelectors.emailInput).fill(email);
  }
}
```

This approach keeps selectors organized and easy to update when UI changes!
