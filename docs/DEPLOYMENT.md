# Deployment (Google Cloud Run)

`.github/workflows/deploy-cloudrun.yml` builds the single-process image
(Kestrel serving the Angular build output, same as [Run with
Docker](../README.md#run-with-docker)) and deploys it to Cloud Run. It
triggers on pushing a `v*` tag — not on merge to `main` — so a deploy can be
cut from any branch while testing, independent of when something actually
merges. See issue #6 for the full pipeline rationale.

## Version display

`VERSION` is a Docker build arg, set to `${{ github.ref_name }}` by
`deploy-cloudrun.yml` and shown in a small footer on every page. Empty for
local/CI builds, which never pass it — no build-time value, no footer
rendered. Same `app-info.json` mechanism as the demo banner below.

## Demo banner

`DEMO_BANNER_ENABLED`/`DEMO_BANNER_REPO_URL`/`DEMO_MOCK_EMAIL_URL`/
`DEMO_MOCK_SMS_URL` are Docker build args (not repo variables — see the
Dockerfile). The `Dockerfile`'s own defaults are `false`/empty, so a plain
`docker build` with no build-args never shows the banner. `deploy-cloudrun.yml`
itself, however, already passes `DEMO_BANNER_ENABLED=true` and a repo URL
(via `${{ github.server_url }}/${{ github.repository }}`, so it always points
at whichever repo is actually running the workflow) — since that workflow
file is inherited as-is by generated repos, **the banner is on by default for
any deployment that uses this workflow unmodified**, not opt-in. If you don't
want "this is a demo" showing on your own deployment, remove or flip those
four `--build-arg` lines in the "Build and push image" step.

## Free tier

Cloud Run's always-free tier (per project, per month, us-central1 and a
handful of other regions) covers:

- 2 million requests
- 180,000 vCPU-seconds
- 360,000 GiB-seconds of memory
- 1 GiB of network egress from North America

This template's default deploy config (1 vCPU, 512Mi, scale-to-zero) fits
comfortably within that for a demo/portfolio deployment with light traffic —
Cloud Run only bills for vCPU/memory while a request is actively being
served, and scales to zero (no cost) when idle. Usage beyond the free tier
bills per the [Cloud Run pricing page](https://cloud.google.com/run/pricing).

The Aiven MySQL instance and any deployed notification mocks
(`sendgrid-mock`, `twilio-mock`, etc.) are separate services with their own
cost/free-tier terms — this section covers the Cloud Run compute for the
`angular-dotnet-auth-template` service itself only.

## Using this for your own deployment

### Why a generated repo can't deploy into the original project

Two things stop it:

- **Nothing is configured.** The `deploy` job only runs when `GCP_PROJECT_ID` is
  set. Generated repos don't inherit Actions variables or secrets, so pushing a
  `v*` tag skips the job.
- **GCP checks the caller.** Deploys authenticate with Workload Identity Federation
  (OIDC, no stored keys), and the WIF provider trusts only the original repository.
  If someone copies the original values into their own repo, the token GCP receives
  carries their repository claim, and the `auth` step is rejected.

To deploy your own copy, create your own GCP project and a WIF provider scoped to
your repository, then set the variables and secrets listed in
[the setup steps](#using-this-for-your-own-deployment).

**1. GCP project setup** — with the CLI authenticated against your own
project:
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iam.googleapis.com iamcredentials.googleapis.com
gcloud artifacts repositories create angular-dotnet-auth-template \
  --repository-format=docker --location=us-central1
```

**2. Workload Identity Federation, scoped to your repo** — the
`attributeCondition` below is what prevents any other repo (including the
original) from assuming this identity:
```bash
gcloud iam workload-identity-pools create github-pool --location=global

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='YOUR_GITHUB_USER/YOUR_REPO_NAME'"

gcloud iam service-accounts create github-deployer

gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USER/YOUR_REPO_NAME"
```

Grant `github-deployer` `roles/run.admin`, `roles/artifactregistry.writer`,
and `roles/iam.serviceAccountUser` (needed so it can deploy revisions that
run as the Cloud Run runtime identity).

**3. Secrets the workflow reads at deploy time** (`gcloud secrets create
<name> --data-file=-`, then `gcloud secrets add-iam-policy-binding <name>
--member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com"
--role=roles/secretmanager.secretAccessor` — the **Cloud Run runtime service
account**, not `github-deployer`, needs read access to each one, or the
revision fails to start):
- `db-connection-string` — a full ADO.NET connection string for a
  MySQL-compatible database reachable from Cloud Run
- `jwt2fa-security-key` — the JWT signing key
- `seed-admin-password` — only needed if you keep the `SeedAdmin__*` lines in
  the workflow (see below); drop them if you don't want a bootstrap admin
  auto-created on every deploy

**4. Set these Actions variables** (Settings → Secrets and variables →
Actions → Variables) with your own project's values —
`deploy-cloudrun.yml`'s `env:` block and `auth` step read them directly, and
the job skips entirely until all six are set:
- `GCP_PROJECT_ID`, `GCP_REGION`, `CLOUD_RUN_SERVICE`,
  `ARTIFACT_REGISTRY_REPOSITORY` — your GCP project ID, the Cloud Run
  region, and the service/repository names you created in step 1
- `WORKLOAD_IDENTITY_PROVIDER`, `DEPLOY_SERVICE_ACCOUNT` — the full provider
  path and service account email from step 2

If you don't want a bootstrap admin auto-created on every deploy, remove the
`SeedAdmin__*` lines entirely (and skip the `seed-admin-password` secret
above).

**5. Repo variables/secrets to set** (Settings → Secrets and variables →
Actions — these are *not* copied when generating from a template):
- `CLOUD_RUN_URL` — chicken-and-egg on the very first deploy, since the URL
  doesn't exist until Cloud Run assigns it; deploy once with this unset
  (email links and the JWT audience will be wrong), then set it from the
  output URL and redeploy
- `SEED_ADMIN_EMAIL` — the bootstrap admin's email if you kept the
  `SeedAdmin__*` lines in the workflow; paired with the `seed-admin-password`
  secret above
- `SENDGRID_MOCK_URL`, `TWILIO_MOCK_URL` — only if you're also deploying the
  notification mocks as their own Cloud Run services (see [Notification
  Provider Mocks](LOCAL_DEV.md#notification-provider-mocks)); otherwise
  point `SendGridEmailConfigs`/`TwilioSmsConfigs` at a real provider via
  their own config keys instead
- `AIVEN_PROJECT`, `AIVEN_SERVICE_NAME`, and secret `AIVEN_API_TOKEN` — only
  if you're using Aiven for MySQL and want the pipeline's auto pause/resume
  handling (the "Power on Aiven MySQL" / "Wait for Aiven MySQL" steps);
  otherwise delete those two steps and point `db-connection-string` at
  whatever MySQL-compatible host you're using instead
