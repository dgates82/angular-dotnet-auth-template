# Customizing for Your Project

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
| Seeded admin account | `SeedAdmin` config — off by default, see [Seeded Admin Account](CONFIGURATION.md#seeded-admin-account) |
| `client/package.json`'s `"name"` | Still the Angular CLI default (`"angular"`) |
| Angular feature flags | `client/src/environments/environment.ts` / `environment.prod.ts` — see [Angular Feature Flags](CONFIGURATION.md#angular-feature-flags) |
| Business roles | `BusinessRoleNames` in `api/AngularDotNetAuthTemplate.Api/Data/DbSeeder.cs` |
| Legal placeholders | `LICENSE` copyright holder, `CONTRIBUTING.md` |
| Team-specific dev notes | `docs/LOCAL_DEV.md` — has real content already, plus a `TODO(template)` for anything specific to your own setup |
| JWT config | See [JWT Configuration](CONFIGURATION.md#jwt-configuration) |
| Cloud Run deploy pipeline | `.github/workflows/deploy-cloudrun.yml` skips until you set the `GCP_PROJECT_ID` Actions variable. A deploy also needs the other GCP/WIF, Aiven, and mock-URL variables and secrets — see [Deploy your own](../README.md#deploy-your-own-cloud-run) |
| SonarQube Cloud static analysis | Set `SONAR_TOKEN` (secret) and `SONAR_PROJECT_KEY`/`SONAR_ORG` (repo variables) for your own project |
| `README.md` | Replace with your own project's README; the badges, demo links, and GIF describe the template |
