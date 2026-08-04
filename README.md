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

- **App name in emails/SMS/authenticator app** —
  `api/AngularDotNetAuthTemplate.Api/Controllers/API/AccountController.cs`
  has `[Application Name]` in the confirmation, password reset, and 2FA
  email/SMS copy, plus the issuer name shown in authenticator apps
  (`GenerateQrCodeUri`). The Angular route `title`s in
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
  `allowSelfRegister`, `twoFaMethods`, `requiredProfileFields`, and
  `availableRoles` in `client/src/environments/environment.ts` /
  `environment.prod.ts` — see [Options](#options) below.
- **`LICENSE`'s copyright holder**, **`CONTRIBUTING.md`**, and
  **`docs/LOCAL_DEV.md`** — all still placeholders from the template itself.
- **JWT config** — see [JWT Configuration](#jwt-configuration) below.

### JWT Configuration

`JwtConfigs.securityKey` in `appsettings.json` ships with an obviously-fake
default (`...ReplaceMe`); replace it with a real secret before any real
deployment, and never commit the real value. `validIssuer`/`validAudience`
in the same block are just internal labels the client and server need to
agree on, but worth updating to reflect your actual app/API name too.

Via `appsettings.Development.json` (gitignored):
```json
{
  "JwtConfigs": {
    "securityKey": "some-long-random-secret-value",
    "validIssuer": "YourAppAPI",
    "validAudience": "https://localhost:7249"
  }
}
```

Or via environment variables:
```bash
export JwtConfigs__securityKey="some-long-random-secret-value"
export JwtConfigs__validIssuer="YourAppAPI"
export JwtConfigs__validAudience="https://localhost:7249"
```

### Notification Senders

The default `IEmailSender`/`ISmsSender` registrations in `Program.cs` are
marked `TODO(template)`. Email defaults to SMTP (pointed at the Mailpit
container so a fresh clone works with no external account), with
`SendGridEmailSender`/`PostMarkEmailSender` already implemented but
commented out — swap the registration and supply your own API key via
`appsettings.Development.json` or user-secrets to switch providers. SMS only
has one implementation, `TwilioSmsSender`; swap it out entirely if you need
a different provider. Never commit real provider credentials.

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
   `TwilioSmsSender` at it, so 2FA codes sent via SMS are caught instead of
   going through a real Twilio account — view them at `http://localhost:3030`.
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
