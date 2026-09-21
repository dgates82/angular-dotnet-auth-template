# Upgrading

## Upgrading a repo generated before v1.1.0

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

See [JWT Configuration](CONFIGURATION.md#jwt-configuration) in
`docs/CONFIGURATION.md` for the current shape.

## Upgrading Angular

`@fortawesome/angular-fontawesome`, `angularx-qrcode`, and `ngx-mask` release
major versions in lockstep with Angular's own major version rather than
independent semver — e.g. `ngx-mask@21.x` targets Angular 21. **Bump these
alongside your own `ng update`.**

<details>
<summary><b>Why a mismatch here won't fail locally</b></summary>

<br>

`npm install` will happily resolve a stale peer range without complaint; only
`npm ci` (used in CI) enforces it. So a mismatch can pass local
`npm install` and only surface once CI — or a teammate's clean clone — runs
`npm ci`.

</details>
