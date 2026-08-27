# Local Development

Operational detail that isn't needed to evaluate or do a first run of the
template — see the root README's
[Running the Template As-Is](../README.md#running-the-template-as-is) for
that. This file is for once you're actually developing against it.

TODO(template): keep adding to this — IDE run configurations, seeding data,
or troubleshooting notes specific to your own team's machine setup.

## Ports

Native `dotnet run` uses `https://localhost:7249` (the dev cert port from
`launchSettings.json`); Docker uses `http://localhost:8080` (the .NET base
image default). Not unified yet — just be aware they're different if you're
switching between the two.

## Notification Provider Mocks

`mysql`, `sendgridmock`, and `smsmock` (see the root README's
[Backend Setup](../README.md#backend-setup)) back the providers wired up by
default. `docker-compose.yml` also defines mocks for every *other* provider
this template supports, so you can develop against any of them without a
real account:

```bash
docker compose up -d mailpit postmarkmock localstack
```

| Service | Port | View sent messages |
|---|---|---|
| `mailpit` | 8025 | `http://localhost:8025` or `curl http://localhost:8025/api/v1/messages` |
| `postmarkmock` | 3050 | `http://localhost:3050` or `curl http://localhost:3050/api/messages` |
| `localstack` (SNS) | 4566 | `curl http://localhost:4566/_aws/sns/sms-messages` |

Each has its `Host`/`BaseUrlOverride`/`ServiceUrlOverride` already pointed at
it in `appsettings.json` — just uncomment the matching `AddXyz...Sender` in
`Program.cs`. See the root README's
[Notification Senders](../README.md#notification-senders) for how switching
providers works.

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

## Why `dotnet tool restore` Is a Separate Step

`Microsoft.EntityFrameworkCore.Tools` in the `.csproj` only wires up the
Visual Studio Package Manager Console cmdlets. The `dotnet ef` command itself
comes from a separate tool package, pinned in `api/.config/dotnet-tools.json`
— hence the one-time `dotnet tool restore` per clone (see the root README's
[Backend Setup](../README.md#backend-setup)).

## Troubleshooting

**Port already in use.** A previous run may still be alive in the background
and still holding the port. Find and stop it: `lsof -i :<port>` then
`kill <pid>` (Linux/macOS), or on Windows
`Get-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess | Stop-Process`.
