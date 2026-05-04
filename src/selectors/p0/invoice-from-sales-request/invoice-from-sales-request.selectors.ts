export const InvoiceFromSalesRequestSelectors = {
  // Request table rows
  tableRow: 'mat-row, tr[mat-row]',

  // Generate Invoice button (uppercase text as rendered in Angular)
  generateInvoiceButton: 'button:has-text("GENERATE INVOICE"), [data-testid*="generate-invoice"]',

  // Loading overlay
  loadingOverlay: 'text=Loading Resources, Please Wait...',

  // Navigation — Sales menu item in sidebar/nav
  salesNavItem: 'a:has-text("Sales"), button:has-text("Sales")',

  // Toast / snackbar for success or error feedback
  toast: 'simple-snack-bar, snack-bar-container, .mat-snack-bar-container, [role="alert"], .mat-mdc-snack-bar-container',

  // Access error text (inline or dialog)
  accessErrorText: "You don't have access",
  accessErrorSalesRequestText: "You don't have access to this sales request",

  // Invoice API endpoint fragment (used to intercept response)
  invoiceCreateEndpoint: '/api/v1/invoices/create-from-sales-request/',
};
