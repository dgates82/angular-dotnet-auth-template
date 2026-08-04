# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- SMS-based 2FA (Twilio), with a local mock for testing without a real account
- Configurable required profile fields and a shared password-strength component
- XML doc comments across the API, wired into Swagger

### Changed

- Restructured repo into sibling `/api` and `/client` folders, off the legacy
  nested-SPA-template layout
- Upgraded to .NET 10 and Angular 21 (standalone components)
- Replaced DataTables with Angular Material's `MatTable`
- Notification sender registration switched to an `AddXyz()` DI pattern
- Local SMS mock (`smsmock`) now pulls the prebuilt `twilio-mock` image from
  `dgates-mock-servers` instead of building a hand-rolled mock in this repo

### Removed

- Unused scaffolded Identity Razor Pages and dead controller actions

### Fixed

- Client-side routes no longer 404 on a hard refresh (SPA fallback route)
- `AddIdentity` was silently overriding JWT bearer as the default auth scheme,
  causing spurious 401s on authenticated endpoints

### Security

- `PasswordHash`/`SecurityStamp` no longer leak to the client via the JWT
