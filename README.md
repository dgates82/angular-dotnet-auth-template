# Angular and .NET Core Authentication Template

[![CI](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml/badge.svg)](https://github.com/dgates82/angular-dotnet-auth-template/actions/workflows/ci.yml)

This repository provides a template for an authentication system built with Angular 21 and .NET 10, using MySQL as the database. It offers a secure foundation for applications requiring user authentication, with options for self-registration and two-factor authentication (2FA).

## Technology Stack
- **Frontend:** Angular 21
- **Backend:** .NET 10
- **Database:** MySQL

## Project Structure
- `/api` — the .NET backend solution (`AngularDotNetAuthTemplate.sln`, `AngularDotNetAuthTemplate.Api/`)
- `/client` — the Angular frontend

The app runs as a single process: the API serves the Angular build output directly, so there's nothing to configure for cross-origin requests.

## Features
- User login and registration
- Optional self-registration
- Configurable two-factor authentication (2FA) options
- Secure password storage and management

## Getting Started

### Quickstart

The whole sequence, assuming Node/npm, .NET SDK 10, and Docker are already
installed. See the detailed sections below for what each step does and why.

```bash
git clone https://github.com/yourusername/angular-dotnet-auth-template.git
cd angular-dotnet-auth-template

docker compose up -d mysql mailpit

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

Follow these steps to set up and run the project locally.

### Prerequisites
- **Node.js** and **npm** for Angular
- **.NET SDK 10** for the backend
- **Docker** for database setup, and optionally for running the whole app (see below)
- **MySQL Client** (optional, for direct database access)

### Clone the Repository
```bash
git clone https://github.com/yourusername/angular-dotnet-auth-template.git  
cd angular-dotnet-auth-template  
```

### Backend Setup

#### Set Up MySQL and Mailpit Using Docker Compose

1. **Start MySQL and Mailpit** (from the repo root — `docker-compose.yml` also
   defines an `api` service, but leave it out for now; it needs the database
   migrated first, see below):
   ```bash
   docker compose up -d mysql mailpit
   ```
   This starts a `mysql` container with the database, user, and password already
   provisioned to match `appsettings.json`'s `DefaultConnection`, mapped to
   `localhost:3307`. No manual SQL setup needed.

   It also starts `mailpit`, a local SMTP catcher — the app's default
   `SmtpEmailConfigs` in `appsettings.json` point at it, so registration
   confirmation, password reset, and other outbound emails during local dev are
   caught instead of actually sent. View them at `http://localhost:8025`. To use
   a real provider instead (SendGrid/PostMark), swap the `IEmailSender`
   registration in `Program.cs` and supply your own API key via
   `appsettings.Development.json` or user-secrets — never commit real keys.

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
   default. Set `SeedAdmin:Email` and `SeedAdmin:Password` in
   `appsettings.Development.json` (gitignored) or as environment variables
   (`SeedAdmin__Email`, `SeedAdmin__Password`) before first run, and the app
   creates that user — pre-confirmed, in the `Admin` role — on startup. Safe
   to leave set across restarts; it only creates the user once.

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
it shares a Docker network with `mysql`/`mailpit`, so it can reach them by
service name instead of `localhost`. **Requires the database to already be
migrated** (see Backend Setup above) — the container doesn't run migrations
itself:
```bash
docker compose up -d --build api
```
Browse to `http://localhost:8080`.

Alternatively, to build/run the image standalone (e.g. to test the raw
production image outside this compose network), run from the repo root,
since the build needs both `api/` and `client/`, and point
`ConnectionStrings__DefaultConnection`/`SmtpEmailConfigs__Host` at wherever
your MySQL/SMTP actually are — `localhost` won't resolve to anything inside
the container:
```bash
docker build -f api/AngularDotNetAuthTemplate.Api/Dockerfile -t angular-dotnet-auth-template .
docker run -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e ConnectionStrings__DefaultConnection="Server=host.docker.internal;Port=3307;Database=AuthTemplate;User=webapp;Password=mypass" \
  -e SmtpEmailConfigs__Host=host.docker.internal \
  angular-dotnet-auth-template
```
The app listens on HTTP only inside the container (port 8080, matching the
.NET base image's default).

## Troubleshooting

**Port already in use.** A previous run may still be alive in the
background (e.g. a terminal or IDE session that got closed without
stopping the process cleanly) and still holding the port. Find and stop
it: `lsof -i :<port>` then `kill <pid>` (Linux/macOS), or on Windows
`Get-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess | Stop-Process`.

## Options

This template offers several configurable options to customize the authentication flow:

- **Allow Self-Registration**: Enable or disable user registration.
- **Enforce 2FA**: Enforce two-factor authentication for enhanced security.
- **2FA Options**:
  - **Authenticator App** (e.g., Google Authenticator)
  - **Email Verification**
  - **SMS Verification**

To modify these options, adjust the corresponding settings in the configuration files.

## License
This project is licensed under the MIT License.
