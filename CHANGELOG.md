# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Assignable roles now come from `GET api/admin/roles` (backed by `RoleManager`)
  instead of a hardcoded list in `environment.ts`. The two had drifted: the admin
  role dropdown offered "Tech"/"Manager", but `DbSeeder` only ever created "Admin",
  so assigning either threw an unhandled error. `DbSeeder` now seeds the app's
  business roles too, and is the one place to edit them.
- Setting a password for the first time (admin-created user) no longer redirects to
  2FA enrollment. That redirect never had anything to authenticate with -
  `ResetPasswordAsync` doesn't establish a session the way login does - so it was
  removed rather than gated: `login.component.ts`'s `onLoginResponse()` already
  enforces `is2FaRequired` correctly, with a real session, the next time this user
  actually logs in.

## [1.0.0] - 2026-08-04

### Added

- SMS-based 2FA (Twilio), with a local mock for testing without a real account
- Configurable required profile fields and a shared password-strength component
- XML doc comments across the API, wired into Swagger

### Changed

- Restructured repo into sibling `/api` and `/client` folders, off the legacy
  nested-SPA-template layout
- Upgraded to .NET 10 and Angular 21 (standalone components)
- Replaced DataTables with Angular Material's `MatTable`
- Notification sender registration switched to an `AddXyz()` DI pattern,
  backed by the extracted `DGates.Identity.NotificationProviders` package
  (now on its stable `1.0.0` release)
- Local SMS mock (`smsmock`) now pulls the prebuilt `twilio-mock` image from
  `dgates-mock-servers` instead of building a hand-rolled mock in this repo
- Added optional `sendgridmock`/`postmarkmock`/`localstack` (SNS) services to
  `docker-compose.yml`, with matching `BaseUrlOverride`/`ServiceUrlOverride`
  defaults, so every implemented notification provider can be developed
  against locally, not just the two wired up by default

### Removed

- Unused scaffolded Identity Razor Pages and dead controller actions

### Fixed

- Client-side routes no longer 404 on a hard refresh (SPA fallback route)
- `AddIdentity` was silently overriding JWT bearer as the default auth scheme,
  causing spurious 401s on authenticated endpoints

### Security

- `PasswordHash`/`SecurityStamp` no longer leak to the client via the JWT
