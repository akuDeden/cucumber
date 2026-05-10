# login Snapshots

Login page & state setelah login — berbagai environment.

| File | Environment | State | Keterangan |
|------|------------|-------|------------|
| `login-form-state.yaml` | production | Form tampil | Login form aktif (Email + Password field visible) — **gunakan ini untuk cari selector login form** |
| `login-after-second-click.yml` | project | Form tampil | Login form setelah klik Login di nav — field Email + Password + button LOGIN |
| `login-page.yml` | production | Sebelum klik | Homepage public — Login link di nav bar, form belum terbuka |
| `login-page-production.yml` | production | Form tampil | Login form — production env |
| `login-page-testdev.yml` | dev | Form tampil | Login form — dev/test env |
| `login-invalid-credentials.yml` | project | Error | Login form setelah submit kredensial salah |
| `login-invalid-after-wait.yml` | project | Error | Login form setelah error + wait |
| `login-aus.yml` | project-aus | Logged in | Dashboard setelah login berhasil di project-aus |
| `project-login.yml` | project | Form tampil | Login form — project env (versi 1) |
| `project-login2.yml` | project | Form tampil | Login form — project env (versi 2) |
| `project-login3.yml` | project | Form tampil | Login form — project env (versi 3) |
| `project-login4.yml` | project | Form tampil | Login form — project env (versi 4) |
| `project-loggedin.yml` | project | Form tampil | Login form state — project |
| `prod-login.yml` | production | Form tampil | Login form — production |
| `after-login-dashboard.yml` | project | Logged in | Dashboard setelah login berhasil — project |
| `after-login-dev.yml` | dev | Logged in | Dashboard setelah login berhasil — dev |

**Key selectors** (dari `login-form-state.yaml`):
- Email field: `data-testid="login-mat-form-field-input-mat-input-element"` (readonly → click dulu)
- Password field: `data-testid="login-mat-form-field-input-password"` (readonly → click dulu)
- LOGIN button: `data-testid="login-login-screen-button-mat-focus-indicator"`
