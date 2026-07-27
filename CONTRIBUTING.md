# Contributing

- Open an issue before starting significant work, so the approach can be
  agreed on before code gets written.
- Branch names follow `type/issue-number-short-description`, e.g.
  `fix/40-jwt-bearer-default-scheme`, `chore/38-add-provider-style-sender-registration`.
- Commit messages and PR titles follow `type: lowercase description`
  (`feat:`, `fix:`, `docs:`, `chore:`, `style:`).
- Prefer merge commits over squash when merging into `main`.

## Before opening a PR

CI runs an API build + test job and a client build job (see the badge in
`README.md`) — both need to pass. To check locally first:

**API** (needs `docker compose up -d mysql mailpit smsmock` running first — the
integration tests exercise real auth/2FA flows against them):
```bash
cd api
dotnet test AngularDotNetAuthTemplate.sln
```

**Client:**
```bash
cd client
npm run build
npm test
```

## Local development

See [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) for environment-specific setup
notes beyond the root README's [Running the Template As-Is](README.md#running-the-template-as-is)
section.
