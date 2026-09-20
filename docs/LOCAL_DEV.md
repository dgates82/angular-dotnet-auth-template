# Local Development

Operational detail that isn't needed to evaluate or do a first run of the
template — see the root README's [Quickstart](../README.md#quickstart) for
that. This file is for once you're actually developing against it, including
the native (non-Docker) setup and the end-to-end suite.

TODO(template): keep adding to this — IDE run configurations, seeding data,
or troubleshooting notes specific to your own team's machine setup.

## Project Structure

- `/api` — the .NET backend solution (`AngularDotNetAuthTemplate.sln`, `AngularDotNetAuthTemplate.Api/`)
- `/client` — the Angular frontend
- `/e2e` — a [Playwright](https://playwright.dev) suite covering full auth flows (registration, login, 2FA, admin user management) end to end against the real, containerized app — see [Running the End-to-End Suite](#running-the-end-to-end-suite)

The app runs as a single process: the API serves the Angular build output
directly, so there's nothing to configure for cross-origin requests.

## Backend Setup

For hot-reload development (not the containerized path — see the root
README's [Quickstart](../README.md#quickstart) if you just want it running).

**1. Start MySQL, the SendGrid mock, and the SMS mock** (from the repo root):
```bash
docker compose up -d mysql sendgridmock smsmock
```

This provisions the database, user, and password to match `appsettings.json`'s
`DefaultConnection` (mapped to `localhost:3307`), plus local catchers for
email and SMS so a fresh clone works with no external accounts.

`docker-compose.yml` also defines an `api` service — leave it out for now; it
needs the database migrated first (see below).

**2. Install the EF Core CLI tool** (one-time per clone):
```bash
cd api
dotnet tool restore
```

(Why a separate step at all? See
[Why dotnet tool restore Is a Separate Step](#why-dotnet-tool-restore-is-a-separate-step)
below.)

**3. Run migrations** (from `api/AngularDotNetAuthTemplate.Api/` — `dotnet ef`
resolves the target project from the current directory):
```bash
cd AngularDotNetAuthTemplate.Api
dotnet ef database update
```

**4. (Optional) Bootstrap an admin account.** See
[Seeded Admin Account](CONFIGURATION.md#seeded-admin-account) in
`docs/CONFIGURATION.md`.

Want to develop against SMTP/Mailpit, Postmark, or SNS instead of the two
default mocks? See [Notification Provider Mocks](#notification-provider-mocks)
below.

## Frontend Setup

```bash
cd client
npm install
ng build
```

Outputs to `client/dist/browser`, which the API serves as static files.

## Run the Solution

Open `api/AngularDotNetAuthTemplate.sln` in your IDE and run the
`AngularDotNetAuthTemplate.Api` project, or from the repo root:
```bash
dotnet run --project api/AngularDotNetAuthTemplate.Api
```

Available at `https://localhost:7249` (see [Ports](#ports) below for how this
differs from the Docker path).

## Ports

Native `dotnet run` uses `https://localhost:7249` (the dev cert port from
`launchSettings.json`); Docker uses `http://localhost:8080` (the .NET base
image default). Not unified yet — just be aware they're different if you're
switching between the two.

## Notification Provider Mocks

`docker-compose.yml` defines a mock for every notification provider this
template supports, so you can develop against any of them without a real
account. This table is the single source of truth for which are wired up by
default — nothing above it should ever need to restate that:

| Service | Default? | Config (`appsettings.json`) | View sent messages |
|---|---|---|---|
| `sendgridmock` | Yes | `SendGridEmailConfigs.BaseUrlOverride = http://localhost:3040` | `http://localhost:3040` or `curl http://localhost:3040/api/messages` |
| `smsmock` (Twilio) | Yes | `TwilioSmsConfigs.BaseUrlOverride = http://localhost:3030` | `http://localhost:3030` or `curl http://localhost:3030/api/messages` |
| `mailpit` | No | `SmtpEmailConfigs.Host = localhost`, `.Port = 1025` | `http://localhost:8025` or `curl http://localhost:8025/api/v1/messages` |
| `postmarkmock` | No | `PostMarkEmailConfigs.BaseUrlOverride = http://localhost:3050` | `http://localhost:3050` or `curl http://localhost:3050/api/messages` |
| `localstack` (SNS) | No | `SnsSmsConfigs.ServiceUrlOverride = http://localhost:4566` | `curl http://localhost:4566/_aws/sns/sms-messages` |

`mailpit` is the one exception to "config port == view port": it's real SMTP,
not a REST mock, so mail actually gets *delivered* on 1025 and the web UI/API
for reading it back lives on a separate port, 8025.

Every config value above is already set in `appsettings.json` — to switch
providers, start the one you want (`docker compose up -d <service>`, the two
marked Default above are already running if you followed
[Backend Setup](#backend-setup) above) and uncomment the matching
`AddXyz...Sender` in `Program.cs`. See
[Notification Senders](CONFIGURATION.md#notification-senders) in
`docs/CONFIGURATION.md` for how switching providers works.

Everything except `mailpit` (the third-party
[axllent/mailpit](https://github.com/axllent/mailpit) image) and `localstack`
(the official [LocalStack](https://www.localstack.cloud/) image, running only
the SNS service) is published from
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

## Running the End-to-End Suite

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
push/PR. For interactive debugging, see below.

## End-to-End Suite: Interactive Debugging

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

## Running the Production Image Standalone

To test the raw production image outside the `docker-compose.yml` network,
run from the repo root (the build needs both `api/` and `client/`) and point
the config at wherever your MySQL/SendGrid/SMS mock actually are — `localhost`
won't resolve to anything inside the container:

```bash
docker build -f api/AngularDotNetAuthTemplate.Api/Dockerfile -t angular-dotnet-auth-template .
docker run -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e ConnectionStrings__DefaultConnection="Server=host.docker.internal;Port=3307;Database=AuthTemplate;User=webapp;Password=mypass" \
  -e TwilioSmsConfigs__BaseUrlOverride="http://host.docker.internal:3030" \
  -e SendGridEmailConfigs__BaseUrlOverride="http://host.docker.internal:3040" \
  angular-dotnet-auth-template
```

The app listens on HTTP only inside the container (port 8080, matching the
.NET base image's default).

## Why `dotnet tool restore` Is a Separate Step

`Microsoft.EntityFrameworkCore.Tools` in the `.csproj` only wires up the
Visual Studio Package Manager Console cmdlets. The `dotnet ef` command itself
comes from a separate tool package, pinned in `api/.config/dotnet-tools.json`
— hence the one-time `dotnet tool restore` per clone (see
[Backend Setup](#backend-setup) above).

## Troubleshooting

**Port already in use.** A previous run may still be alive in the background
and still holding the port. Find and stop it: `lsof -i :<port>` then
`kill <pid>` (Linux/macOS), or on Windows
`Get-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess | Stop-Process`.
