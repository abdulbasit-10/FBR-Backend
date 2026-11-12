# Automatic Hetzner deployment

Push to this repository's `main` branch to validate and deploy this application.
Pull requests only validate. The frontend and backend are separate repositories;
configure and push each independently. GitHub Actions also has a manual Run workflow
button (select `main`). A production environment requiring reviewers will pause
instead of deploying automatically; leave required reviewers off if fully automatic
updates are desired, and restrict environment deployment branches to `main`.

## Files and purpose

- `.github/workflows/deploy.yml`: installs locked dependencies, runs checks/build,
  and deploys successful `main` revisions through verified SSH.
- `scripts/deploy.sh`: runs the existing checkout/npm/PM2 update procedure on Linux,
  checks health and attempts to restore the previous revision after failure.
- `.nvmrc`: pins CI to the existing server version, Node.js 20.20.2.
- `.gitattributes`: keeps workflow and shell files in Linux-compatible LF format.
- This document: one-time configuration, operating instructions and limitations.

## One-time GitHub configuration

In THIS repository, open Settings > Environments > New environment and create
`production`. Add the secrets and variables below to that environment. The two
repositories have different DEPLOY_PATH, PM2_APP_NAME and HEALTHCHECK_URL values.

Secrets:

| Name | Value |
| --- | --- |
| `HETZNER_HOST` | Server IPv4 address or DNS name (no `https://`) |
| `HETZNER_USER` | Existing deployment user that owns the checkout and PM2 process |
| `HETZNER_SSH_KEY` | Dedicated unencrypted SSH private key for this workflow |
| `HETZNER_KNOWN_HOSTS` | Verified server SSH public host-key entry/entries in known_hosts format |

Variables:

| Name | Value |
| --- | --- |
| `HETZNER_SSH_PORT` | Optional SSH port; defaults to `22` |
| `DEPLOY_PATH` | Actual absolute path of this application's existing Git checkout on Hetzner |
| `PM2_APP_NAME` | Exact existing PM2 application name; must identify one process |
| `HEALTHCHECK_URL` | Local URL of this service, e.g. backend `http://127.0.0.1:BACKEND_PORT/health`, frontend `http://127.0.0.1:FRONTEND_PORT/` |

Replace example ports with the actual production ports. Use distinct service URLs
so a healthy frontend cannot accidentally stand in for a failing backend.

FRONTEND ONLY: add repository Actions variables `NEXT_PUBLIC_API_BASE_URL` (the
absolute public backend API URL including `/api/v1`) and optionally
`BACKEND_INTERNAL_URL` (backend origin used by rewrites). CI validation falls back
to `https://example.invalid/api/v1` when the public URL is absent; that value is
ONLY for compile validation and is never deployed. The server builds the app using
its EXISTING production env files, which must contain the real API URL. Next.js
inlines NEXT_PUBLIC values at build time; changing them requires another build.
Do not put database credentials, JWT secrets or private keys into public variables.

## One-time server preparation

Run as the SAME Linux user that currently manages the PM2 application:

```bash
whoami
node --version
pm2 list
pm2 describe YOUR_EXISTING_APP_NAME
cd /actual/path/to/this/repository
pwd -P
git remote -v
git status --short
```

Confirm all of the following before enabling the first deployment:

1. `origin` points to the matching GitHub repository, and production HEAD is an
   ancestor of `main`. Commit/push or otherwise reconcile server-only source changes.
   The script refuses dirty checkouts and divergent history; it never runs git clean.
2. PM2 contains exactly one process named PM2_APP_NAME and its execution cwd is
   DEPLOY_PATH. It must start the production app (`dist/server.js`/`npm start` for
   backend, `next start`/`npm start` for frontend), not a dev watcher. Existing PM2
   ports, arguments and environment remain in use. Cluster configurations need a
   tailored rollout and are deliberately rejected by this single-process script.
3. Keep the existing server Node.js 20.20.2 and PM2 installation. No Node upgrade
   is required for this pipeline. CI uses Node 20.20.2 from `.nvmrc`; the script
   verifies the shell and PM2 app interpreter both use Node major version 20.
   If using nvm, the script loads `$HOME/.nvm/nvm.sh` and selects 20.20.2.
4. Linux has bash, git, curl and flock (usually supplied by util-linux). The user
   can write the checkout, install dependencies and restart their PM2 process.
5. Preserve backend `.env`, `uploads/`, `logs/` and frontend production env files
   on the server. Ensure runtime data is ignored by Git. Do not commit secrets.
6. The server can reach GitHub and the npm registry non-interactively. For private
   repositories, configure a READ-ONLY GitHub deploy key for the SERVER to fetch
   origin; test `GIT_TERMINAL_PROMPT=0 git fetch origin main`. This is separate from
   the key allowing GitHub Actions to SSH INTO Hetzner. Verify GitHub's SSH host key
   if origin uses SSH. Do not embed access tokens into committed remote URLs.
7. The configured health URL succeeds with `curl --fail URL`. No database or
   reverse-proxy changes are needed for this pipeline.

Create a dedicated GitHub-Actions-to-Hetzner key on a trusted machine:

```bash
ssh-keygen -t ed25519 -C github-actions-fbr -f ./github-actions-fbr
```

Use an empty passphrase for this dedicated CI key. Add its PUBLIC `.pub` contents
to the deployment user's `~/.ssh/authorized_keys` on Hetzner (directory permissions
700, file 600); add the PRIVATE key only to HETZNER_SSH_KEY. Never commit either
private keys or live env files. Configure PM2 startup/save once using your existing
server maintenance procedure if reboot persistence is not already configured.

For HETZNER_KNOWN_HOSTS, collect the server public key with `ssh-keyscan -p PORT
HOST` on a trusted machine and verify its SHA256 fingerprint through the Hetzner
console/server's `/etc/ssh/ssh_host_ed25519_key.pub`. Store verified entries only;
for nonstandard ports the entry is `[HOST]:PORT`. The workflow does NOT disable
host verification or blindly trust a new key during each run.

## What happens on every main push

1. GitHub runs npm ci and the validation/build checks with Node 20.20.2.
2. Only successful main runs enter the production job. SSH secrets are not used
   by pull requests. Concurrent deployments are serialized; the server also uses
   a per-checkout flock lock.
3. The script checks repository cleanliness, PM2 name/cwd, Node version and env
   file presence before touching application files.
4. It fetches main. If this run's SHA is already superseded, it skips deployment;
   the newer push's run will deploy instead. It never deploys an unvalidated newer
   commit by accidentally pulling the latest tip.
5. It checks out the exact commit on main, runs npm ci --include=dev and npm run
   build, then restarts only the named PM2 process with --update-env.
6. It checks health up to 20 times. A build/restart/health failure attempts to
   restore the previous commit, reinstall/rebuild and restart it. GitHub still
   marks the attempted deployment failed even when rollback succeeds.

Frontend currently has 60 pre-existing lint errors and 30 warnings. Its lint step
reports failures as advisory; TypeScript and production build are mandatory.
Backend lint is mandatory (its existing warnings do not fail lint). Neither
repository currently defines an automated test suite, so none is invented here.
After frontend lint cleanup, remove continue-on-error to make lint mandatory.

## Database and availability

This matches the current in-place PM2 deployment procedure. It can cause downtime
while dependencies/build output are replaced and during PM2 restart; it is not a
zero-downtime release system. The validated source is rebuilt on the server using
its production env; CI build artifacts are not copied between operating systems.

No migrations or seeders run automatically. Schema-changing updates need a
reviewed database backup and migration plan BEFORE pushing the dependent app
change; use backward-compatible migrations. Code rollback cannot undo database
changes. Avoid pushing code requiring an unapplied migration. A later migration
automation step can be added after confirming the production backup procedure.

Rollback rebuilds the previous source; it requires available dependencies, disk
space and a functioning SSH session. A timeout, killed SSH session, machine reboot
or dependency outage may need manual recovery. Do not cancel an active deployment.
If a newer push's validation fails after an older run was superseded, the server
keeps its last deployed revision; fix the latest commit or rerun a healthy main run.

## First run and troubleshooting

Commit/push these pipeline files in BOTH repositories once GitHub/server settings
are ready. Watch each repository's Actions > CI and deploy to Hetzner. Verify both
services and an authenticated application flow after the first deployment.
Subsequent main pushes require no manual PowerShell deployment commands.

On failure, inspect GitHub logs first. On Hetzner use `pm2 logs APP_NAME --lines 100`
and `git log -1 --oneline` inside DEPLOY_PATH. If rollback also fails, use your
existing manual recovery procedure; do not assume the service has recovered.
For an SSH host-key change, verify it through Hetzner before updating the secret.
