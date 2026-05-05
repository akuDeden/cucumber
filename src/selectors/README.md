# Selectors Directory

This directory contains all CSS selectors organized by priority level. Separating selectors from page objects makes the code more maintainable and reusable.

## Structure

```
selectors/
├── p0/              # Critical functionality selectors
│   └── login.selectors.ts
├── p1/              # High priority selectors
└── p2/              # Medium priority selectors
```

## Benefits

1. **Reusability**: Selectors can be shared across multiple page objects and tests
2. **Maintainability**: Update selectors in one place when UI changes
3. **Readability**: Page objects focus on logic, not selector details
4. **Documentation**: Selectors are self-documenting with comments

## Naming Convention

### File Naming
- Use kebab-case: `login.selectors.ts`, `dashboard.selectors.ts`
- Group by feature/page: One file per page or feature

### Selector Naming
- Use camelCase for selector names
- Be descriptive: `emailInput`, `loginButton`, `errorMessage`
- Group related selectors with comments

### Constants Naming
- Use PascalCase for exported objects: `LoginSelectors`, `DashboardSelectors`
- Use PascalCase for URL constants: `LoginUrls`, `DashboardUrls`

## Example Usage

### Define Selectors

```typescript
// src/selectors/p0/login.selectors.ts
export const LoginSelectors = {
  // Input fields
  emailInput: '[data-testid="login-email-input"]',
  passwordInput: '[data-testid="login-password-input"]',
  
  // Buttons
  loginButton: '[data-testid="login-button"]',
} as const;

export const LoginUrls = {
  loginPage: '/login',
  dashboardPattern: '/dashboard/',
} as const;
```

### Use in Page Object

```typescript
// src/pages/p0/LoginPage.ts
import { LoginSelectors, LoginUrls } from '../../selectors/p0/login.selectors';

export class LoginPage {
  async enterEmail(email: string) {
    await this.page.locator(LoginSelectors.emailInput).fill(email);
  }
  
  async navigate() {
    await this.page.goto(`${BASE_URL}${LoginUrls.loginPage}`);
  }
}
```

## Best Practices

1. **Always use data-testid**: Prefer `[data-testid="..."]` over classes or IDs
2. **Document selectors**: Add comments to group related selectors
3. **Use const assertions**: Add `as const` to prevent modifications
4. **Keep organized**: Group by functionality (inputs, buttons, messages, etc.)
5. **Real selectors only**: Extract selectors from actual staging/production environment

## Selector Priority Guidelines

### P0 Selectors
- Critical user flows (login, logout, core features)
- Must be stable and reliable
- High test coverage required

### P1 Selectors
- Important features
- Frequently used functionality
- Medium test coverage

### P2 Selectors
- Secondary features
- Edge cases
- Lower test coverage acceptable

## Maintenance

When UI changes:
1. Inspect the new element in staging/production
2. Update the selector in the appropriate file
3. Run affected tests to verify
4. Document the change if significant

## Current Selectors

### P0 - Login Selectors
- **File**: `p0/login.selectors.ts`
- **Page**: Login page (project.chronicle.rip/login)
- **Elements**: Email input, password input, login button, error messages, dashboard elements

More selectors will be added as new features are automated.
