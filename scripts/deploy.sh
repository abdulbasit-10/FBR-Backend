#!/usr/bin/env bash
# Called over SSH by GitHub Actions; requires the existing checkout and PM2 app.
set -Eeuo pipefail

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ $# == 5 ]] || fail 'Expected: APP_DIR PM2_APP HEALTHCHECK_URL COMMIT APP_KIND'
app_dir=$1
pm2_app=$2
health_url=$3
target=$4
app_kind=$5
[[ $app_dir == /* && $app_dir != / ]] || fail 'APP_DIR must be an absolute application directory.'
[[ $target =~ ^[0-9a-f]{40}$ ]] || fail 'Invalid commit SHA.'
[[ $app_kind == backend || $app_kind == frontend ]] || fail 'Invalid application kind.'
[[ $health_url == http://* || $health_url == https://* ]] || fail 'Invalid health-check URL.'

# Non-interactive SSH may not load nvm; use the deployment user's installation.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
  nvm use 20.20.2 >/dev/null
fi
for command in git node npm pm2 curl flock; do
  command -v "$command" >/dev/null || fail "Required command missing: $command"
done
[[ $(node -p 'process.versions.node.split(".")[0]') == 20 ]] || fail 'Install/use Node.js 20 for CI/server consistency.'

cd -- "$app_dir"
app_dir=$(pwd -P)
[[ $(git rev-parse --show-toplevel) == "$app_dir" ]] || fail 'APP_DIR must be the repository root.'
lock_file=$(git rev-parse --git-path fbr-deploy.lock)
exec 9>"$lock_file"
flock -w 1200 9 || fail 'Another deployment is still running.'
[[ -z $(git status --porcelain) ]] || fail 'Server checkout has local changes. Commit/stash them before deployment.'

# Require exactly the intended PM2 process and its existing working directory.
pm2_id=$(pm2 jlist | node -e '
  const fs = require("fs");
  let data = "";
  process.stdin.on("data", chunk => data += chunk);
  process.stdin.on("end", () => {
    const apps = JSON.parse(data).filter(app => app.name === process.argv[1]);
    if (apps.length !== 1 || fs.realpathSync(apps[0].pm2_env.pm_cwd) !== process.argv[2]) {
      console.error("PM2_APP must identify one existing process whose cwd is APP_DIR.");
      process.exit(1);
    }
    const { spawnSync } = require("child_process");
    const interpreter = apps[0].pm2_env.exec_interpreter || "node";
    const runtime = spawnSync(interpreter, ["-p", "process.versions.node.split(\".\")[0]"], { encoding: "utf8" });
    if (runtime.status !== 0 || runtime.stdout.trim() !== "20") {
      console.error("PM2 app interpreter must use Node.js 20 too; switching the shell Node version alone is insufficient.");
      process.exit(1);
    }
    console.log(apps[0].pm_id);
  });
' "$pm2_app" "$app_dir")

if [[ $app_kind == backend ]]; then
  [[ -f .env ]] || fail 'Existing production .env is missing.'
else
  [[ -f .env.local || -f .env.production || -f .env.production.local || -f .env ]] || fail 'Existing frontend environment file is missing.'
fi

export GIT_TERMINAL_PROMPT=0
git fetch --no-tags origin main
remote_main=$(git rev-parse FETCH_HEAD)
if [[ $target != "$remote_main" ]]; then
  printf 'Skipping superseded commit %s; origin/main has moved.\n' "$target"
  exit 0
fi
previous=$(git rev-parse HEAD)
# Refuse replacement by an unrelated/older revision. No force pushes in production.
git merge-base --is-ancestor "$previous" "$target" || fail 'Production and main have diverged; reconcile before deploying.'
export NODE_ENV=production

healthcheck() {
  local attempt
  for attempt in {1..20}; do
    if curl --fail --silent --output /dev/null --connect-timeout 3 --max-time 8 "$health_url"; then
      return 0
    fi
    sleep 3
  done
  return 1
}

rollback() {
  local original_status=$?
  trap - ERR
  printf 'Deployment failed; restoring previous commit %s.\n' "$previous" >&2
  # Explicit && chain is intentional: rollback must stop if any step fails.
  if git checkout -B main "$previous" &&
    npm ci --include=dev &&
    npm run build &&
    pm2 restart "$pm2_id" --update-env &&
    healthcheck; then
    printf 'Previous release restored and health check passed.\n' >&2
  else
    printf 'ROLLBACK FAILED. Check PM2 logs and restore the application manually.\n' >&2
  fi
  exit "$original_status"
}
trap rollback ERR

git checkout -B main "$target"
npm ci --include=dev
if [[ $app_kind == frontend ]]; then
  node -e '
    require("@next/env").loadEnvConfig(process.cwd(), false);
    const value = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!value || !/^https?:$/.test(new URL(value).protocol)) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) API URL.");
    }
  '
fi
npm run build
# Schema changes require a separately reviewed migration/backup procedure.
# Never run seeders, migration undo, or database resets during deployment.
pm2 restart "$pm2_id" --update-env
healthcheck
trap - ERR
printf 'Deployed %s successfully.\n' "$target"
