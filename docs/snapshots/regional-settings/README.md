# Regional Settings Snapshots

Captured during debugging of the Regional Settings BDD feature (dev env, org 257 — Astana Tegal Gundul).

## Files

| File | Page / State | When to Use |
|------|-------------|-------------|
| `dev-login.yaml` | Dev login page (initial) | Login form selector reference for dev |
| `dev-login2.yaml` | Dev login page (after email fill) | Verify email field state |
| `dev-dashboard.yaml` | Dev dashboard after login | Top-right user dropdown selector reference |
| `dashboard-loaded.yaml` | Dashboard fully loaded | Confirm landing URL pattern after login |
| `dashboard-top-right.yaml` | Top-right user info area | Button ref for cemetery/org dropdown |
| `dev-dropdown.yaml` | User info dropdown open | `my-organisation` menu item selector |
| `dropdown-open.yaml` | User info dropdown expanded | Alternative dropdown state ref |
| `dev-org.yaml` | Org settings page (initial) | Org settings page structure |
| `dev-org-settings.yaml` | Org settings page (before login) | Public redirect check |
| `org-settings.yaml` | Organisation settings loaded | Tab selectors for org settings page |
| `regional-settings.yaml` | Regional Settings tab active | Input field selectors (`data-testid`) |
| `fresh-regional.yaml` | Regional Settings — fresh load | Baseline field values |
| `clean-start.yaml` | Regional Settings — clean state | Before any label edits |
| `before-save.yaml` | Regional Settings after fill (attempt 1) | Save button visibility check |
| `before-save2.yaml` | Regional Settings after fill (attempt 2) | Save button second attempt |
| `check-save-btn.yaml` | Save button area | `data-testid` for save/cancel toolbar |
| `after-fill.yaml` | After using `fill()` | Shows save button NOT appearing (fill bug) |
| `after-type.yaml` | After using `type` | Intermediate typing state |
| `after-sequentially.yaml` | After `pressSequentially()` | Shows save button appearing (correct method) |
| `after-save-click.yaml` | After clicking Save | Post-save state |
| `scroll-top.yaml` | Page scrolled to top | Toolbar visibility after scroll |
| `fields-check.yaml` | Field values during debug | Input value inspection |
| `verify-fields.yaml` | Field values after save | Post-save assertion reference |
| `verify-saved.yaml` | Saved state verification | Confirm labels persisted |
| `final-check.yaml` | Final state after full flow | End-to-end flow verification |
| `dev-full.yaml` | Full page snapshot (dev) | Complete accessibility tree for dev env |

## Key Findings from Debugging

- Top-right dropdown button is `mat-expansion-panel-header` (Angular Material), NOT `<button>` HTML
- Must use `getByRole('button', { name: /@/ })` — CSS `button` selector misses it
- `fill()` does NOT trigger Angular dirty state — save button never appears
- `focus() + selectText() + pressSequentially()` correctly triggers dirty state
- `waitForResponse` MUST be set up BEFORE `click({ force: true })` on save button
