---
trigger: always_on
---

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

### 2. Centralized Test Data
- All test data lives in `src/data/test-data.ts`
- Use environment variables with fallback defaults:
```typescript
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || 'default@example.com',
    password: process.env.TEST_PASSWORD || 'default123'
  }
};
```
- In feature files, use placeholders: `<TEST_EMAIL>`, `<TEST_PASSWORD>`
- In step definitions, replace placeholders:
```typescript
const email = emailParam.replace('<TEST_EMAIL>', LOGIN_DATA.valid.email);
```

### 3. Adding New Scenarios - Quick Flow

**Step 1:** Determine priority (p0/p1/p2) and access level (public/authenticated)

**Step 2:** Add test data (if needed) to `src/data/test-data.ts`

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
  
  Scenario: Do something
    Given I am on homepage
    When I perform action with "<TEST_DATA>"
    Then I see result
```

**Step 5:** Create step definitions `src/steps/p{X}/{feature}.steps.ts`:
```typescript
import { When, Then } from '@cucumber/cucumber';
import { TEST_DATA } from '../../data/test-data.js';

When('I perform action with {string}', async function (data: string) {
  const actual = data.replace('<TEST_DATA>', TEST_DATA.field);
  await this.page.fill('input', actual);
});
```

**Step 6:** Run test: `npm test -- --tags "@feature-name"`

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
- **DO**: Add `@public` or `@authenticated` tag to all features
- **DO**: Use dynamic steps for runtime-dependent values
- **DON'T**: Mix public/authenticated in same file
- **DON'T**: Hardcode test data in feature files or steps
- **DON'T**: Guess selectors - verify with MCP Playwright first
- **DON'T**: Create authenticated scenarios without proper Background setup

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
import { FEATURE_DATA } from '../../data/test-data.js';
```

### Page Object Pattern
```typescript
import { BasePage } from '../../core/BasePage.js';
import { FeatureSelectors } from '../../selectors/p0/feature.selectors.js';

export class FeaturePage extends BasePage {
  async performAction() {
    await this.page.click(FeatureSelectors.button);
  }
}
```

---

**For complete details, see CUCUMBER-STRUCTURE-GUIDE.md**
