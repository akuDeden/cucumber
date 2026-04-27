# login Snapshots

Login page & state setelah login — berbagai environment.

| File | Environment | State | Keterangan |
|------|------------|-------|------------|
| `login-form-state.yaml` | production | Form tampil | Login form aktif (Email + Password field visible) — **gunakan ini untuk cari selector login form** |
| `login-after-second-click.yml` | staging | Form tampil | Login form setelah klik Login di nav — field Email + Password + button LOGIN |
| `login-page.yml` | production | Sebelum klik | Homepage public — Login link di nav bar, form belum terbuka |
| `login-page-production.yml` | production | Form tampil | Login form — production env |
| `login-page-testdev.yml` | dev | Form tampil | Login form — dev/test env |
| `login-invalid-credentials.yml` | staging | Error | Login form setelah submit kredensial salah |
| `login-invalid-after-wait.yml` | staging | Error | Login form setelah error + wait |
| `login-aus.yml` | staging-aus | Logged in | Dashboard setelah login berhasil di staging-aus |
| `staging-login.yml` | staging | Form tampil | Login form — staging env (versi 1) |
| `staging-login2.yml` | staging | Form tampil | Login form — staging env (versi 2) |
| `staging-login3.yml` | staging | Form tampil | Login form — staging env (versi 3) |
| `staging-login4.yml` | staging | Form tampil | Login form — staging env (versi 4) |
| `staging-loggedin.yml` | staging | Form tampil | Login form state — staging |
| `prod-login.yml` | production | Form tampil | Login form — production |
| `after-login-dashboard.yml` | staging | Logged in | Dashboard setelah login berhasil — staging |
| `after-login-dev.yml` | dev | Logged in | Dashboard setelah login berhasil — dev |

**Key selectors** (dari `login-form-state.yaml`):
- Email field: `data-testid="login-mat-form-field-input-mat-input-element"` (readonly → click dulu)
- Password field: `data-testid="login-mat-form-field-input-password"` (readonly → click dulu)
- LOGIN button: `data-testid="login-login-screen-button-mat-focus-indicator"`
