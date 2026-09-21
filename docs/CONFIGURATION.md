# Configuration

Reference for the configuration surface you'll actually touch before shipping
a generated copy of this template: JWT signing, notification providers, the
database provider, the seeded admin account, and the Angular-side feature
flags.

## JWT Configuration

**The one thing you must change before deploying:** `Jwt2FaConfig.SecurityKey`
in `appsettings.json` ships with an obviously-fake default (`...ReplaceMe`).
Replace it with a real secret via `appsettings.Development.json`,
user-secrets, or an environment variable — never commit the real value.

```json
{
  "Jwt2FaConfig": {
    "SecurityKey": "some-long-random-secret-value",
    "ValidIssuer": "YourAppAPI",
    "ValidAudience": "https://localhost:7249",
    "AdminRoleName": "Admin"
  }
}
```

Or via environment variables:
```bash
export Jwt2FaConfig__SecurityKey="some-long-random-secret-value"
export Jwt2FaConfig__ValidIssuer="YourAppAPI"
export Jwt2FaConfig__ValidAudience="https://localhost:7249"
```

<details>
<summary><b>What each key does, and where the rest of the config lives</b></summary>

<br>

`ValidIssuer`/`ValidAudience` are internal labels the client and server need
to agree on — worth updating to reflect your actual app/API name.
`AdminRoleName` is the Identity role treated as admin for the package's
admin-only endpoints.

A separate `Jwt2FaAuthCoreConfig` block carries the app name substituted
into emails/SMS and the authenticator issuer (`ApplicationName`), plus the
frontend links those emails point at (`FrontendBaseUrl` and the two `*Path`
templates).

JWT issuance and multi-channel 2FA (Authenticator/TOTP, Email, SMS) are
provided by
[`DGates.Identity.Jwt2Fa`](https://github.com/dgates82/DGates.Identity.Jwt2Fa),
a NuGet package referenced from `AngularDotNetAuthTemplate.Api.csproj`, not
implemented in this repo. Real, claims-bearing JWTs plus multi-channel 2FA
delivery — not just "Identity as a JSON API" — is the whole point of the
package. See its own README for the full configuration surface
(per-email/SMS subject/body overrides, etc.).

Fixes and new capabilities land in the package and reach generated repos via
an ordinary package update, not a template re-sync.

</details>

## Notification Senders

**To switch email or SMS providers:** uncomment the registration you want in
`Program.cs` (all are already written, just commented out), then supply that
provider's credentials via `appsettings.Development.json` or user-secrets.
Never commit real credentials.

| Channel | Default | Also available |
|---|---|---|
| Email | `AddSendGridEmailSender` (points at the sendgrid-mock container) | `AddSmtpEmailSender`, `AddPostMarkEmailSender` |
| SMS | `AddTwilioSmsSender` (points at the local Twilio mock) | `AddSnsSmsSender` (AWS SNS) |

Every alternative provider already has a local mock wired up, so you can
switch providers and develop against them with no real account — see
[Notification Provider Mocks](LOCAL_DEV.md#notification-provider-mocks)
in `docs/LOCAL_DEV.md`.

<details>
<summary><b>Where these come from, and how the mock overrides work</b></summary>

<br>

Email and SMS sending are provided by
[`DGates.Identity.NotificationProviders`](https://github.com/dgates82/DGates.Identity.NotificationProviders),
a NuGet package referenced from `AngularDotNetAuthTemplate.Api.csproj`, not
implemented in this repo. Fixes and new providers land in the package and
reach generated repos via an ordinary package update, not a template
re-sync.

Each alternative provider's `BaseUrlOverride`/`ServiceUrlOverride` in
`appsettings.json` already points at that provider's mock, so switching a
provider in `Program.cs` works against the mock with no further config
changes. Clear the override and supply real credentials once you're ready to
hit the real service.

</details>

## Database Provider

**MySQL is the only provider this template ships with and tests against**
(via `Pomelo.EntityFrameworkCore.MySql`), wired up in a single
`options.UseMySql(...)` call in `Program.cs`.

To swap providers (SQL Server, PostgreSQL, SQLite, etc.):
1. Reference that provider's NuGet package instead of Pomelo's
2. Change the `UseMySql` call to the provider's equivalent (`UseSqlServer`, `UseNpgsql`, etc.)
3. Regenerate the EF Core migrations from scratch — the ones shipped here are
   MySQL-specific and won't apply as-is

<details>
<summary><b>Why the migrations need regenerating</b></summary>

<br>

The app code itself is provider-agnostic — no raw SQL, no MySQL-specific
query syntax anywhere. The migrations aren't: see the
`MySqlModelBuilderExtensions` calls in `Migrations/`, which are emitted by
the Pomelo provider and have no equivalent in other providers.

</details>

## Seeded Admin Account

There's no seeded user by default. Set `SeedAdmin:Email` and
`SeedAdmin:Password` before first run and the app creates that user —
pre-confirmed, in the `Admin` role — on startup. Safe to leave set across
restarts; it only creates the user once.

```json
{
  "SeedAdmin": {
    "Email": "admin@example.com",
    "Password": "ChangeMe123!"
  }
}
```

Or via environment variables:
```bash
export SeedAdmin__Email="admin@example.com"
export SeedAdmin__Password="ChangeMe123!"
```

## Angular Feature Flags

Configurable in `client/src/environments/environment.ts` and
`environment.prod.ts`:

| Option | What it does |
|---|---|
| `allowSelfRegister` | Enable or disable user registration |
| `is2FaRequired` | Force all users through 2FA setup |
| `show2FaBanner` | Show a dismissible 2FA-setup nudge for users who haven't enabled it |
| `twoFaMethods` | Which 2FA methods are offered: authenticator app, email, SMS |
| `requiredProfileFields` | Which fields (name, phone, mailing address) are mandatory on register/edit forms. Email is always required — it's the account's login name |
| `allowUserEdit` | Whether admins can edit other users |
