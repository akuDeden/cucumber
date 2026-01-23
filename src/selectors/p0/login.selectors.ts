/**
 * Login Page Selectors
 * Real selectors from staging.chronicle.rip
 * All selectors use data-testid attributes
 */

export const LoginSelectors = {
  // Input fields
  emailInput: '[data-testid="login-mat-form-field-input-mat-input-element"]',
  passwordInput: '[data-testid="login-mat-form-field-input-password"]',
  
  // Buttons
  loginButton: '[data-testid="login-login-screen-button-mat-focus-indicator"]',
  hidePasswordButton: '[data-testid="login-button-hide-password"]',
  forgotPasswordButton: 'button:has-text("Forgot password?")',
  signUpButton: 'button:has-text("Sign up for free")',
  backToAppButton: 'button:has-text("Back to app")',
  
  // Social login buttons
  googleLoginButton: 'div:has(img[alt="google"])',
  microsoftLoginButton: 'div:has(img[alt="microsoft"])',
  ssoLoginButton: 'div:has(img[alt="sso"])',
  
  // Remember me checkbox
  rememberMeCheckbox: 'input[type="checkbox"]',
  
  // Error messages
  errorMessage: '[data-testid="login-snackbar-error-div-left"] span',
  
  // Success indicators (Dashboard after login)
  organizationName: 'div:has-text("astana tegal gundul")',
  userEmail: 'div:has-text("faris+astanaorg@chronicle.rip")',
  
  // Login page elements
  loginPageTitle: 'h1:has-text("Login to your account"), h2:has-text("Login to your account")',
  continueWithText: 'p:has-text("Continue with")',
  useChronicleAccountText: 'p:has-text("Or use Chronicle account")',
} as const;

/**
 * URLs related to login
 */
export const LoginUrls = {
  loginPage: '/login',
  dashboardPattern: '/customer-organization/',
} as const;
