# Deployment (Google Cloud Run)

`.github/workflows/deploy-cloudrun.yml` builds the single-process image
(Kestrel serving the Angular build output, same as [Run with
Docker](../README.md#run-with-docker)) and deploys it to Cloud Run. It
triggers on pushing a `v*` tag — not on merge to `main` — so a deploy can be
cut from any branch while testing, independent of when something actually
merges. See issue #6 for the full pipeline rationale.

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
