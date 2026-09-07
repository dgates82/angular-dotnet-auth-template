# Angular and .NET Core Authentication Template

[![CI](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml/badge.svg)](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml)

This repository provides a template for an authentication system built with Angular 21 and .NET 10, using Entity Framework Core, tested against MySQL. It offers a secure foundation for applications requiring user authentication, with options for self-registration and two-factor authentication (2FA).

> Starter template, not a finished app — see
> [How to Use This Template](#how-to-use-this-template) to get started.

**[Live demo](https://angular-dotnet-auth-template-1019453023791.us-central1.run.app)**
— register an account and try 2FA yourself. No real email/SMS is sent;
confirmation and 2FA codes land in the public mock inboxes instead:
[SendGrid mock](https://sendgrid-mock-7qs7btajdq-uc.a.run.app) (email) and
[Twilio mock](https://twilio-mock-1019453023791.us-central1.run.app) (SMS) —
see [dgates-mock-servers](https://github.com/dgates82/dgates-mock-servers) for
how they work.

## How to Use This Template

1. Click **[Use this template](https://github.com/dgates82/angular-dotnet-auth-template/generate)**
   on GitHub to generate your own repository from this one — not a fork, a
   fresh repo with its own history.
2. Clone *your new repo* locally.
3. Follow [Running the Template As-Is](#running-the-template-as-is) to
   confirm it works before changing anything.
4. Work through [Customizing for Your Project](#customizing-for-your-project)
   to make it yours.

## Technology Stack
- **Frontend:** Angular 21
- **Backend:** .NET 10
- **Database:** EF Core, tested against MySQL (see [Database Provider](#database-provider) for swapping providers)

## Project Structure
- `/api` — the .NET backend solution (`AngularDotNetAuthTemplate.sln`, `AngularDotNetAuthTemplate.Api/`)
- `/client` — the Angular frontend
- `/e2e` — a [Playwright](https://playwright.dev) suite covering full auth flows (registration, login, 2FA, admin user management) end to end against the real, containerized app — see [Running the End-to-End Suite](#running-the-end-to-end-suite)

The app runs as a single process: the API serves the Angular build output directly, so there's nothing to configure for cross-origin requests.

## Features
- User login and registration
- Optional self-registration
- Configurable two-factor authentication (2FA) options
- Secure password storage and management

## Customizing for Your Project

This template is meant to be generated and adapted, not used as-is. Every
spot that needs a look before you ship is marked `TODO(template)` (in code
comments) or a literal `[Application Name]` placeholder (in copy that gets
sent to users). Find them all with:

```bash
git grep -n "TODO(template)"
git grep -n "\[Application Name\]" -- api client/src
```

What's currently marked:

| What | Where |
|---|---|
| App name in emails/SMS/authenticator | `Jwt2FaAuthCoreConfig.ApplicationName` in `appsettings.json`; Angular route `title`s in `app.routes.ts`; `<title>` in `index.html` |
| Logo and favicon | `client/src/assets/images/logo-small.png`, `client/src/favicon.ico` — replace in place, no code changes |
| Seeded admin account | `SeedAdmin` config — off by default, see [Backend Setup](#backend-setup) |
| `client/package.json`'s `"name"` | Still the Angular CLI default (`"angular"`) |
| Angular feature flags | `client/src/environments/environment.ts` / `environment.prod.ts` — see [Options](#options) |
| Business roles | `BusinessRoleNames` in `api/AngularDotNetAuthTemplate.Api/Data/DbSeeder.cs` |
| Legal placeholders | `LICENSE` copyright holder, `CONTRIBUTING.md` |
| Team-specific dev notes | `docs/LOCAL_DEV.md` — has real content already, plus a `TODO(template)` for anything specific to your own setup |
| JWT config | See [JWT Configuration](#jwt-configuration) |
| Cloud Run deploy pipeline | `.github/workflows/deploy-cloudrun.yml` points at the original author's own GCP project by design — see [Deployment](#deployment) |

### JWT Configuration

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

### Notification Senders

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
[Notification Provider Mocks](docs/LOCAL_DEV.md#notification-provider-mocks)
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

### Database Provider

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

### Upgrading Angular

`@fortawesome/angular-fontawesome`, `angularx-qrcode`, and `ngx-mask` release
major versions in lockstep with Angular's own major version rather than
independent semver — e.g. `ngx-mask@21.x` targets Angular 21. **Bump these
alongside your own `ng update`.**

<details>
<summary><b>Why a mismatch here won't fail locally</b></summary>

<br>

`npm install` will happily resolve a stale peer range without complaint; only
`npm ci` (used in CI, see the badge above) enforces it. So a mismatch can pass
local `npm install` and only surface once CI — or a teammate's clean clone —
runs `npm ci`.

</details>

## Running the Template As-Is

### Quickstart

The whole sequence, assuming Node/npm, .NET SDK 10, and Docker are already
installed, and you've already generated your own repo via
[Use this template](https://github.com/dgates82/angular-dotnet-auth-template/generate).

```bash
git clone https://github.com/yourusername/your-generated-repo.git
cd your-generated-repo

docker compose up -d mysql sendgridmock smsmock

cd api
dotnet tool restore
cd AngularDotNetAuthTemplate.Api
dotnet ef database update
cd ../..

cd client
npm install
ng build
cd ..

dotnet run --project api/AngularDotNetAuthTemplate.Api
```

**Available at:**
- App: https://localhost:7249
- SendGrid mock (dev inbox — confirmation/reset emails land here instead of a real inbox): http://localhost:3040
- SMS mock (dev inbox for SMS 2FA codes): http://localhost:3030

### Prerequisites
- **Node.js** and **npm** for Angular
- **.NET SDK 10** for the backend
- **Docker** for database setup, and optionally for running the whole app
- **MySQL Client** (optional, for direct database access)

### Backend Setup

**1. Start MySQL, the SendGrid mock, and the SMS mock** (from the repo root):
```bash
docker compose up -d mysql sendgridmock smsmock
```

This provisions the database, user, and password to match `appsettings.json`'s
`DefaultConnection` (mapped to `localhost:3307`), plus local catchers for
email and SMS so a fresh clone works with no external accounts.

<details>
<summary><b>What each container does</b></summary>

<br>

`docker-compose.yml` also defines an `api` service — leave it out for now; it
needs the database migrated first (see below).

`sendgridmock` is a local catcher implementing the SendGrid REST API. The
sender registered via `AddSendGridEmailSender` points at it, so registration
confirmation, password reset, and other outbound emails during local dev are
caught instead of actually sent. View them at `http://localhost:3040`.

`smsmock` plays the same role for SMS 2FA — the prebuilt
[`twilio-mock`](https://github.com/dgates82/dgates-mock-servers/tree/main/twilio-mock)
image implementing the Twilio REST API. `TwilioSmsConfigs.BaseUrlOverride`
points the sender registered via `AddTwilioSmsSender` at it, so 2FA codes are
caught instead of going through a real Twilio account. View them at
`http://localhost:3030`. To use a real Twilio account, set
`TwilioSmsConfigs.AccountSid`/`AuthToken`/`FromNumber` and clear
`BaseUrlOverride`.

</details>

**2. Install the EF Core CLI tool** (one-time per clone):
```bash
cd api
dotnet tool restore
```

(Why a separate step at all? See
[docs/LOCAL_DEV.md](docs/LOCAL_DEV.md#why-dotnet-tool-restore-is-a-separate-step).)

**3. Run migrations** (from `api/AngularDotNetAuthTemplate.Api/` — `dotnet ef`
resolves the target project from the current directory):
```bash
cd AngularDotNetAuthTemplate.Api
dotnet ef database update
```

**4. (Optional) Bootstrap an admin account.** There's no seeded user by
default. Set `SeedAdmin:Email` and `SeedAdmin:Password` before first run and
the app creates that user — pre-confirmed, in the `Admin` role — on startup.
Safe to leave set across restarts; it only creates the user once.

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

Want to develop against SMTP/Mailpit, Postmark, or SNS instead of the two
default mocks? See
[Notification Provider Mocks](docs/LOCAL_DEV.md#notification-provider-mocks)
in `docs/LOCAL_DEV.md`.

### Frontend Setup

```bash
cd client
npm install
ng build
```

Outputs to `client/dist/browser`, which the API serves as static files.

### Run the Solution

Open `api/AngularDotNetAuthTemplate.sln` in your IDE and run the
`AngularDotNetAuthTemplate.Api` project, or from the repo root:
```bash
dotnet run --project api/AngularDotNetAuthTemplate.Api
```

### Run with Docker

The Dockerfile builds the Angular client and the API together into a single
image. The easiest way to run it locally is via the `api` service already
defined in `docker-compose.yml` — it shares a Docker network with
`mysql`/`sendgridmock`/`smsmock`, so it can reach them by service name.
**Requires the database to already be migrated** (see Backend Setup) — the
container doesn't run migrations itself.

```bash
docker compose up -d --build api
```
Browse to `http://localhost:8080`.

Testing the raw production image outside this compose network? See
[Running the Production Image Standalone](docs/LOCAL_DEV.md#running-the-production-image-standalone)
in `docs/LOCAL_DEV.md`.

### Running the End-to-End Suite

`/e2e` exercises full auth flows through a real browser against the actual
containerized app — not mocks, and not a bare `dotnet run`/`ng serve` port.

```bash
docker compose up -d --build api   # start the full stack first
cd e2e
npm install
npx playwright install --with-deps chromium
npm test
```

Runs headless against Chromium by default — the same suite CI runs on every
push/PR. For interactive debugging (and a `npm test` flag gotcha worth
knowing about), see
[End-to-End Suite: Interactive Debugging](docs/LOCAL_DEV.md#end-to-end-suite-interactive-debugging)
in `docs/LOCAL_DEV.md`.

## Options

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

## Upgrading

<details>
<summary><b>Upgrading a repo generated before v1.1.0</b></summary>

<br>

The JWT config shape changed when auth/JWT/2FA logic moved into
`DGates.Identity.Jwt2Fa`:

- `JwtConfigs` is now `Jwt2FaConfig`
- The same three keys are now PascalCase: `securityKey`→`SecurityKey`,
  `validIssuer`→`ValidIssuer`, `validAudience`→`ValidAudience`
- A new `AdminRoleName` key was added
- A brand-new `Jwt2FaAuthCoreConfig` block was added. If you'd customized the
  `[Application Name]` placeholder directly in the now-deleted
  `AccountController.cs`, that value moves to
  `Jwt2FaAuthCoreConfig.ApplicationName`

See [JWT Configuration](#jwt-configuration) for the current shape.

</details>

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the Cloud Run deploy
pipeline, its free-tier ceiling, and what to set up if you're deploying your
own generated copy of this template.

## Troubleshooting

See [Troubleshooting](docs/LOCAL_DEV.md#troubleshooting) in `docs/LOCAL_DEV.md`.

## License
This project is licensed under the MIT License.
