# Angular and .NET Core Authentication Template

[![CI](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml/badge.svg)](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml)

This repository provides a template for an authentication system built with Angular 21 and .NET 10, using Entity Framework Core, tested against MySQL. It offers a secure foundation for applications requiring user authentication, with options for self-registration and two-factor authentication (2FA).

> Starter template, not a finished app — see
> [How to Use This Template](#how-to-use-this-template) to get started.

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
| Legal/docs placeholders | `LICENSE` copyright holder, `CONTRIBUTING.md`, `docs/LOCAL_DEV.md` |
| JWT config | See [JWT Configuration](#jwt-configuration) |

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
| Email | `AddSmtpEmailSender` (points at the Mailpit container) | `AddSendGridEmailSender`, `AddPostMarkEmailSender` |
| SMS | `AddTwilioSmsSender` (points at the local Twilio mock) | `AddSnsSmsSender` (AWS SNS) |

Every alternative provider already has a local mock wired up, so you can
switch providers and develop against them with no real account — see
[Notification Provider Mocks](#notification-provider-mocks).

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

docker compose up -d mysql mailpit smsmock

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
- Mailpit (dev inbox — confirmation/reset emails land here instead of a real inbox): http://localhost:8025
- SMS mock (dev inbox for SMS 2FA codes): http://localhost:3030

### Prerequisites
- **Node.js** and **npm** for Angular
- **.NET SDK 10** for the backend
- **Docker** for database setup, and optionally for running the whole app
- **MySQL Client** (optional, for direct database access)

### Backend Setup

**1. Start MySQL, Mailpit, and the SMS mock** (from the repo root):
```bash
docker compose up -d mysql mailpit smsmock
```

This provisions the database, user, and password to match `appsettings.json`'s
`DefaultConnection` (mapped to `localhost:3307`), plus local catchers for
email and SMS so a fresh clone works with no external accounts.

<details>
<summary><b>What each container does</b></summary>

<br>

`docker-compose.yml` also defines an `api` service — leave it out for now; it
needs the database migrated first (see below).

`mailpit` is a local SMTP catcher. The app's default `SmtpEmailConfigs` point
at it, so registration confirmation, password reset, and other outbound
emails during local dev are caught instead of actually sent. View them at
`http://localhost:8025`.

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

<details>
<summary><b>Why this is a separate step</b></summary>

<br>

`Microsoft.EntityFrameworkCore.Tools` in the `.csproj` only wires up the
Visual Studio Package Manager Console cmdlets. The `dotnet ef` command itself
comes from a separate tool package, pinned in `api/.config/dotnet-tools.json`.

</details>

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

#### Notification Provider Mocks

`mysql`, `mailpit`, and `smsmock` back the providers wired up by default.
`docker-compose.yml` also defines mocks for every *other* provider this
template supports, so you can develop against any of them without a real
account:

```bash
docker compose up -d sendgridmock postmarkmock localstack
```

| Service | Port | View sent messages |
|---|---|---|
| `sendgridmock` | 3040 | `http://localhost:3040` or `curl http://localhost:3040/api/messages` |
| `postmarkmock` | 3050 | `http://localhost:3050` or `curl http://localhost:3050/api/messages` |
| `localstack` (SNS) | 4566 | `curl http://localhost:4566/_aws/sns/sms-messages` |

Each has its `BaseUrlOverride`/`ServiceUrlOverride` already pointed at it in
`appsettings.json` — just uncomment the matching `AddXyz...Sender` in
`Program.cs`. See [Notification Senders](#notification-senders) above.

<details>
<summary><b>Where these images come from, and a Docker networking caveat</b></summary>

<br>

Everything except `localstack` (the official
[LocalStack](https://www.localstack.cloud/) image, running only the SNS
service) is published from
[`dgates-mock-servers`](https://github.com/dgates82/dgates-mock-servers), a
shared repo of GHCR-published mock servers used by both this template and
`DGates.Identity.NotificationProviders`. LocalStack uses its standard
`test`/`test` fake credentials, and has no web UI for SNS — the `curl`
endpoint above is its own introspection API, since SNS SMS has no real
delivery to observe.

**If you're running the `api` service via Docker Compose** (not `dotnet run`
on the host), the `http://localhost:PORT` values above won't resolve —
`localhost` inside that container means the container itself, not a sibling
mock container. `docker-compose.yml`'s `api` service already overrides each
one to the mock's Compose service name (e.g. `http://postmarkmock:3050`), so
this works out of the box. The `localhost` values are what to use from the
host machine (a browser, or `dotnet run`).

</details>

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
`mysql`/`mailpit`/`smsmock`, so it can reach them by service name.
**Requires the database to already be migrated** (see Backend Setup) — the
container doesn't run migrations itself.

```bash
docker compose up -d --build api
```
Browse to `http://localhost:8080`.

<details>
<summary><b>Building and running the image standalone</b></summary>

<br>

To test the raw production image outside this compose network, run from the
repo root (the build needs both `api/` and `client/`) and point the config at
wherever your MySQL/SMTP/SMS mock actually are — `localhost` won't resolve to
anything inside the container:

```bash
docker build -f api/AngularDotNetAuthTemplate.Api/Dockerfile -t angular-dotnet-auth-template .
docker run -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e ConnectionStrings__DefaultConnection="Server=host.docker.internal;Port=3307;Database=AuthTemplate;User=webapp;Password=mypass" \
  -e TwilioSmsConfigs__BaseUrlOverride="http://host.docker.internal:3030" \
  -e SmtpEmailConfigs__Host=host.docker.internal \
  angular-dotnet-auth-template
```

The app listens on HTTP only inside the container (port 8080, matching the
.NET base image's default).

</details>

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
push/PR.

<details>
<summary><b>Interactive debugging, and a <code>npm test</code> flag gotcha</b></summary>

<br>

For interactive debugging, call Playwright directly rather than through
`npm test`:

```bash
npx playwright test --headed
npx playwright test --ui
```

npm only forwards flags placed after a bare `npm test` if you separate them
with `--`, so `npm test --headed` silently runs as `playwright test headed`,
which finds no matching test files instead of doing what you'd expect.

If Chromium isn't installable on your machine, `npx playwright install
--with-deps firefox` plus `npx playwright test --project firefox` is a
local-only fallback — CI always installs and runs Chromium only.

</details>

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

## Troubleshooting

**Port already in use.** A previous run may still be alive in the background
and still holding the port. Find and stop it: `lsof -i :<port>` then
`kill <pid>` (Linux/macOS), or on Windows
`Get-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess | Stop-Process`.

## License
This project is licensed under the MIT License.
