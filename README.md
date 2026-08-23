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
- **Database:** EF Core, tested against MySQL (see [Customizing for Your Project](#customizing-for-your-project) for swapping providers)

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

- **App name in emails/SMS/authenticator app** — `appsettings.json`'s
  `Jwt2FaAuthCoreConfig.ApplicationName` has `[Application Name]`, substituted
  into the confirmation, password reset, and 2FA email/SMS copy (see [JWT
  Configuration](#jwt-configuration) below) and the issuer name shown in
  authenticator apps. The Angular route `title`s in
  `client/src/app/app.routes.ts` and `client/src/index.html`'s default
  `<title>` use the same placeholder.
- **Logo and favicon** — `client/src/assets/images/logo-small.png` (used
  across the login/register/2FA pages) and `client/src/favicon.ico` are
  both placeholders; replace the files in place, no code changes needed.
- **Seeded admin account** — off by default; see `SeedAdmin` in
  [Backend Setup](#set-up-mysql-mailpit-and-the-sms-mock-using-docker-compose)
  below.
- **`client/package.json`'s `"name"`** — still the Angular CLI default
  (`"angular"`); harmless to leave, but worth renaming if you're publishing
  this as its own project.
- **Angular feature flags** — `is2FaRequired`, `allowUserEdit`,
  `allowSelfRegister`, `twoFaMethods`, and `requiredProfileFields` in
  `client/src/environments/environment.ts` / `environment.prod.ts` — see
  [Options](#options) below.
- **Business roles** — `BusinessRoleNames` in
  `api/AngularDotNetAuthTemplate.Api/Data/DbSeeder.cs` (`"Tech"`/`"Manager"`
  by default); the admin role-assignment UI reads whatever's actually in the
  database via `GET api/admin/roles`, so this is the one place to edit them.
- **`LICENSE`'s copyright holder**, **`CONTRIBUTING.md`**, and
  **`docs/LOCAL_DEV.md`** — all still placeholders from the template itself.
- **JWT config** — see [JWT Configuration](#jwt-configuration) below.

### JWT Configuration

> **Upgrading a repo generated before v1.1.0?** This section's config shape
> changed when auth/JWT/2FA logic moved into `DGates.Identity.Jwt2Fa`.
> `JwtConfigs` is now `Jwt2FaConfig`, with the same three keys but
> PascalCase (`securityKey`→`SecurityKey`, `validIssuer`→`ValidIssuer`,
> `validAudience`→`ValidAudience`), plus a new `AdminRoleName` key. There's
> also a brand-new `Jwt2FaAuthCoreConfig` block that didn't exist before —
> if you'd customized the `[Application Name]` placeholder directly in the
> now-deleted `AccountController.cs`, that value moves to
> `Jwt2FaAuthCoreConfig.ApplicationName` instead.

JWT issuance and multi-channel 2FA (Authenticator/TOTP, Email, SMS) are
provided by
[`DGates.Identity.Jwt2Fa`](https://github.com/dgates82/DGates.Identity.Jwt2Fa),
a NuGet package referenced from `AngularDotNetAuthTemplate.Api.csproj`, not
implemented in this repo. Real, claims-bearing JWTs plus multi-channel 2FA
delivery — not just "Identity as a JSON API" — is the whole point of the
package; see its own README for the full pitch and config surface. Fixes and
new capabilities land in the package and reach generated repos via an
ordinary package update, not a template re-sync.

`Jwt2FaConfig.SecurityKey` in `appsettings.json` ships with an obviously-fake
default (`...ReplaceMe`); replace it with a real secret before any real
deployment, and never commit the real value. `ValidIssuer`/`ValidAudience`
in the same block are just internal labels the client and server need to
agree on, but worth updating to reflect your actual app/API name too.
`AdminRoleName` is the Identity role treated as admin for the package's
admin-only endpoints, and `Jwt2FaAuthCoreConfig` (the block below it)
carries the app name substituted into emails/SMS/authenticator issuer
(`ApplicationName`) plus the frontend links those emails point at
(`FrontendBaseUrl` and the two `*Path` templates) — see the package's own
README for the rest of its configuration surface (per-email/SMS
subject/body overrides, etc.).

Via `appsettings.Development.json` (gitignored):
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

### Notification Senders

Email and SMS sending are provided by
[`DGates.Identity.NotificationProviders`](https://github.com/dgates82/DGates.Identity.NotificationProviders),
a NuGet package referenced from `AngularDotNetAuthTemplate.Api.csproj`, not
implemented in this repo. Fixes and new providers land in the package and
reach generated repos via an ordinary package update, not a template
re-sync.

The default registrations in `Program.cs` are marked `TODO(template)`.
Email defaults to `AddSmtpEmailSender` (pointed at the Mailpit container so
a fresh clone works with no external account), with
`AddSendGridEmailSender`/`AddPostMarkEmailSender` already called but
commented out. SMS defaults to `AddTwilioSmsSender`, with `AddSnsSmsSender`
(AWS SNS) already called but commented out. Uncomment the extension method
for the provider you want and supply your own API key/credentials via
`appsettings.Development.json` or user-secrets to switch providers. Each
alternative provider's `BaseUrlOverride`/`ServiceUrlOverride` in
`appsettings.json` already points at that provider's mock (see [Notification
Provider Mocks](#notification-provider-mocks) below), so switching a
provider in `Program.cs` works against the mock with no further config
changes — only clear the override and supply real credentials once you're
ready to hit the real service. Never commit real provider credentials.

### Database Provider

The app only uses EF Core's provider-agnostic APIs — no raw SQL, no
MySQL-specific query syntax anywhere in the codebase. MySQL (via
`Pomelo.EntityFrameworkCore.MySql`) is the only provider this template
ships with and has been tested against, wired up in the single
`options.UseMySql(...)` call in `Program.cs`. Swapping to another EF Core
provider (SQL Server, PostgreSQL, SQLite, etc.) means: referencing that
provider's NuGet package instead of Pomelo's, changing that one `UseMySql`
call to the provider's equivalent (`UseSqlServer`, `UseNpgsql`, etc.), and
regenerating the EF Core migrations from scratch for the new provider —
the ones shipped here are MySQL-specific (see the
`MySqlModelBuilderExtensions` calls in `Migrations/`) and won't apply as-is
against a different database.

### Upgrading Angular

`@fortawesome/angular-fontawesome`, `angularx-qrcode`, and `ngx-mask` all
release major versions in lockstep with Angular's own major version rather
than independent semver — e.g. `ngx-mask@21.x` targets Angular 21,
`ngx-mask@22.x` targets Angular 22. When you run your own `ng update` in the
future, bump these alongside it. `npm install` will happily resolve a stale
peer range without complaint; only `npm ci` (used in CI, see the badge
above) enforces it, so a mismatch here can pass local `npm install` and only
surface once CI (or a teammate's clean clone) runs `npm ci`.

## Running the Template As-Is

### Quickstart

The whole sequence, assuming Node/npm, .NET SDK 10, and Docker are already
installed, and you've already generated your own repo via
[Use this template](https://github.com/dgates82/angular-dotnet-auth-template/generate)
(see [How to Use This Template](#how-to-use-this-template)). See the
detailed sections below for what each step does and why.

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
- SMS mock (dev inbox for SMS 2FA codes — see below): http://localhost:3030

Follow these steps to set up and run the project locally.

### Prerequisites
- **Node.js** and **npm** for Angular
- **.NET SDK 10** for the backend
- **Docker** for database setup, and optionally for running the whole app (see below)
- **MySQL Client** (optional, for direct database access)

### Clone Your Repository

Once you've generated your own repo from this template (see
[How to Use This Template](#how-to-use-this-template)), clone it locally:
```bash
git clone https://github.com/yourusername/your-generated-repo.git
cd your-generated-repo
```

### Backend Setup

#### Set Up MySQL, Mailpit, and the SMS Mock Using Docker Compose

1. **Start MySQL, Mailpit, and the SMS mock** (from the repo root —
   `docker-compose.yml` also defines an `api` service, but leave it out for
   now; it needs the database migrated first, see below):
   ```bash
   docker compose up -d mysql mailpit smsmock
   ```
   This starts a `mysql` container with the database, user, and password already
   provisioned to match `appsettings.json`'s `DefaultConnection`, mapped to
   `localhost:3307`. No manual SQL setup needed.

   It also starts `mailpit`, a local SMTP catcher — the app's default
   `SmtpEmailConfigs` in `appsettings.json` point at it, so registration
   confirmation, password reset, and other outbound emails during local dev are
   caught instead of actually sent. View them at `http://localhost:8025`. To use
   a real provider instead, see [Notification Senders](#notification-senders)
   below.

   `smsmock` plays the same role for SMS 2FA: the prebuilt
   [`twilio-mock`](https://github.com/dgates82/dgates-mock-servers/tree/main/twilio-mock)
   image implementing the Twilio REST API. The app's
   default `TwilioSmsConfigs.BaseUrlOverride` in `appsettings.json` points
   the sender registered via `AddTwilioSmsSender` at it, so 2FA codes sent
   via SMS are caught instead of going through a real Twilio account — view
   them at `http://localhost:3030`.
   To use a real Twilio account instead, set `TwilioSmsConfigs.AccountSid`/
   `AuthToken`/`FromNumber` to real values and clear `BaseUrlOverride` via
   `appsettings.Development.json` or user-secrets — never commit real
   credentials.

2. **Install the EF Core CLI tool** (one-time per clone — `Microsoft.EntityFrameworkCore.Tools`
   in the `.csproj` only wires up the Visual Studio Package Manager Console
   cmdlets; the `dotnet ef` command itself comes from a separate tool
   package, pinned in `api/.config/dotnet-tools.json`):
   ```bash
   cd api
   dotnet tool restore
   ```

3. **Run Migrations** (from `api/AngularDotNetAuthTemplate.Api/` — `dotnet ef`
   resolves the target project from the current directory):
   ```bash
   cd AngularDotNetAuthTemplate.Api
   dotnet ef database update
   ```

4. **(Optional) Bootstrap an admin account.** There's no seeded user by
   default. Set `SeedAdmin:Email` and `SeedAdmin:Password` before first run,
   and the app creates that user — pre-confirmed, in the `Admin` role — on
   startup. Safe to leave set across restarts; it only creates the user once.

   Via `appsettings.Development.json` (gitignored):
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

`mysql`, `mailpit`, and `smsmock` (above) back the providers wired up by
default. Everything below except `localstack` (the official LocalStack
image) is published from
[`dgates-mock-servers`](https://github.com/dgates82/dgates-mock-servers), a
shared repo of GHCR-published mock servers used by both this template and
`DGates.Identity.NotificationProviders`. `docker-compose.yml` here defines
mocks for every other provider this template implements, so you can develop
against any of them without a real account — start whichever ones you need
alongside the services above:
```bash
docker compose up -d sendgridmock postmarkmock localstack
```
- `sendgridmock` — [`sendgrid-mock`](https://github.com/dgates82/dgates-mock-servers/tree/main/sendgrid-mock),
  a SendGrid-compatible REST API. `SendGridEmailConfigs.BaseUrlOverride`
  already points at it (`http://localhost:3040`) — uncomment
  `AddSendGridEmailSender` in `Program.cs` to use it. View sent messages at
  `http://localhost:3040`, or `curl http://localhost:3040/api/messages`.
- `postmarkmock` — [`postmark-mock`](https://github.com/dgates82/dgates-mock-servers/tree/main/postmark-mock),
  a Postmark-compatible REST API. `PostMarkEmailConfigs.BaseUrlOverride`
  already points at it (`http://localhost:3050`) — uncomment
  `AddPostMarkEmailSender` in `Program.cs` to use it. View sent messages at
  `http://localhost:3050`, or `curl http://localhost:3050/api/messages`.
- `localstack` — the official [LocalStack](https://www.localstack.cloud/) image, running only
  the SNS service, for AWS SNS SMS sending. `SnsSmsConfigs.ServiceUrlOverride`
  already points at it (`http://localhost:4566`) with LocalStack's standard
  `test`/`test` fake credentials — uncomment `AddSnsSmsSender` in
  `Program.cs` to use it. LocalStack has no web UI for this; view sent
  messages with `curl http://localhost:4566/_aws/sns/sms-messages`
  (LocalStack's own introspection endpoint — SNS SMS has no real delivery to
  observe, even against LocalStack).

If you're running the `api` service itself via Docker Compose (not
`dotnet run` on the host), the `BaseUrlOverride`/`ServiceUrlOverride` values
above won't resolve — `localhost` inside that container means the container
itself, not a sibling mock container. `docker-compose.yml`'s `api` service
already overrides each one to the mock's Compose service name
(e.g. `http://postmarkmock:3050`) so this works out of the box; the
`http://localhost:PORT` values above are what to use from the host machine
(e.g. from a browser, or `dotnet run`).

See [Notification Senders](#notification-senders) above for how to swap
providers, and never commit real provider credentials.

### Frontend Setup

1. Navigate to the `client` folder and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Build the Angular application:
   ```bash
   ng build
   ```

   This outputs to `client/dist/browser`, which the API serves as static files.

### Run the Solution

Open `api/AngularDotNetAuthTemplate.sln` in your IDE and run the `AngularDotNetAuthTemplate.Api` project, or from the repo root:
```bash
dotnet run --project api/AngularDotNetAuthTemplate.Api
```

### Run with Docker

The Dockerfile builds the Angular client and the API together into a single
image (`api/AngularDotNetAuthTemplate.Api/Dockerfile`). The easiest way to run
it locally is via the `api` service already defined in `docker-compose.yml` —
it shares a Docker network with `mysql`/`mailpit`/`smsmock`, so it can reach
them by service name instead of `localhost`. **Requires the database to already be
migrated** (see Backend Setup above) — the container doesn't run migrations
itself:
```bash
docker compose up -d --build api
```
Browse to `http://localhost:8080`.

Alternatively, to build/run the image standalone (e.g. to test the raw
production image outside this compose network), run from the repo root,
since the build needs both `api/` and `client/`, and point
`ConnectionStrings__DefaultConnection`/`SmtpEmailConfigs__Host`/
`TwilioSmsConfigs__BaseUrlOverride` at wherever your MySQL/SMTP/SMS mock
actually are — `localhost` won't resolve to anything inside the container:
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

### Running the End-to-End Suite

`/e2e` exercises full auth flows through a real browser against the actual containerized
app — not mocks, and not a bare `dotnet run`/`ng serve` port. Start the full stack first:
```bash
docker compose up -d --build api
```
Then, from `/e2e`:
```bash
npm install
npx playwright install --with-deps chromium
npm test
```
Runs headless, against Chromium, by default — the same suite that runs in CI on every
push/PR. For interactive debugging, call Playwright directly rather than through `npm
test`: npm only forwards flags placed after a bare `npm test` if you separate them with
`--`, so `npm test --headed` silently runs as `playwright test headed`, which finds no
matching test files instead of doing what you'd expect.
```bash
npx playwright test --headed
npx playwright test --ui
```
If Chromium isn't installable on your machine, `npx playwright install --with-deps
firefox` plus `npx playwright test --project firefox` is a local-only fallback — CI
always installs and runs Chromium only.

## Options

This template offers several configurable options to customize the authentication flow:

- **Allow Self-Registration**: Enable or disable user registration.
- **Enforce 2FA**: Enforce two-factor authentication for enhanced security.
- **2FA Options**:
  - **Authenticator App** (e.g., Google Authenticator)
  - **Email Verification**
  - **SMS Verification**
- **Required Profile Fields**: Choose which fields (name, phone number,
  mailing address) are mandatory on the register-user, edit-user, and
  edit-profile forms. Email is always required, since it's the account's
  login name.

To modify these options, adjust the corresponding settings in the configuration files
(`client/src/environments/environment.ts` and `environment.prod.ts`).

## Troubleshooting

**Port already in use.** A previous run may still be alive in the
background (e.g. a terminal or IDE session that got closed without
stopping the process cleanly) and still holding the port. Find and stop
it: `lsof -i :<port>` then `kill <pid>` (Linux/macOS), or on Windows
`Get-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess | Stop-Process`.

## License
This project is licensed under the MIT License.
