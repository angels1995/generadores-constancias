#!/bin/bash
set -Eeuo pipefail
umask 077
project=/var/www/constancias-api
branch=${1:?Falta rama}
expected=${2:?Falta commit esperado}
[[ "$branch" =~ ^[a-zA-Z0-9][a-zA-Z0-9/_-]*$ ]]
[[ "$expected" =~ ^[a-f0-9]{40}$ ]]
test "$(id -u)" = 0
exec 9>/var/lock/generadores-constancias-deploy.lock
flock -n 9 || { echo 'Ya hay otro despliegue en curso.'; exit 1; }
cd "$project"
git_app() { runuser -u appuser -- git "$@"; }
test -z "$(git_app status --porcelain)" || { echo 'VPS con cambios pendientes: se detuvo antes de git pull. Revisar y conservarlos primero.'; exit 1; }
test "$(git_app branch --show-current)" = "$branch" || { echo 'La rama del VPS no coincide. Revisa la rama antes de desplegar.'; exit 1; }
test "$(git_app remote get-url origin)" = 'git@github.com:angels1995/generadores-constancias.git'
# La identidad SSH de lectura GitHub ya está instalada en root.
# El checkout y sus archivos siguen siendo de appuser; no se copian llaves.
git -c safe.directory="$project" fetch origin "$branch"
chown -R appuser:appuser .git
test "$(git_app rev-parse FETCH_HEAD)" = "$expected" || { echo 'La rama publicada cambió. Revisa y reintenta.'; exit 1; }
before=$(git_app rev-parse HEAD)
git_app merge-base --is-ancestor "$before" "$expected" || { echo 'Actualización no fast-forward: se detuvo.'; exit 1; }
test -x /opt/constancias-essalud-demo-venv/bin/python
/opt/constancias-essalud-demo-venv/bin/python -c 'import reportlab'
backup=/root/generadores-backups/$(date +%Y%m%d-%H%M%S)
mkdir -p "$backup"
tar --exclude=./.git --exclude=./node_modules --exclude=./tmp --exclude=./output -cf "$backup/privado.tar" .
printf '%s\n' "$before" > "$backup/commit-anterior.txt"
changed=0
config_changed=0
rollback() {
  code=$?
  if [ "$changed" = 1 ]; then
    if git_app diff --quiet && git_app diff --cached --quiet; then
      # Checkout conservador: Git se niega a sobrescribir archivos pendientes.
      git_app checkout --detach "$before" >> "$backup/rollback.log" 2>&1 || true
      if [ "$(git_app rev-parse HEAD)" = "$before" ]; then
        if [ "$config_changed" = 1 ]; then
          tar -xf "$backup/privado.tar" ./config/recursos-pdf.json
          chown appuser:appuser config/recursos-pdf.json
        fi
        runuser -u appuser -- npm ci --omit=dev >> "$backup/rollback.log" 2>&1 || true
        pm2 restart constancias-api >> "$backup/rollback.log" 2>&1 || true
      fi
    fi
  fi
  echo "Despliegue detenido. Respaldo privado: $backup. Revisa rollback.log y la rama antes de reintentar."
  exit "$code"
}
trap rollback ERR
changed=1
git_app merge --ff-only FETCH_HEAD
test "$(git_app rev-parse HEAD)" = "$expected"
if ! git_app diff --quiet "$before" "$expected" -- config/recursos-pdf.example.json; then
  node -e "JSON.parse(require('fs').readFileSync('config/recursos-pdf.example.json','utf8'))"
  config_changed=1
  install -o appuser -g appuser -m 644 config/recursos-pdf.example.json config/recursos-pdf.json
fi
if ! git_app diff --quiet "$before" "$expected" -- package.json package-lock.json; then
  runuser -u appuser -- npm ci --omit=dev
fi
node --check src/app.js
export ESSALUD_DEMO_PYTHON=/opt/constancias-essalud-demo-venv/bin/python
node --test tests/*.test.js > "$backup/tests.log" 2>&1
node scripts/migrar-essalud.mjs > "$backup/migracion.log" 2>&1
node scripts/migrar-documentos.mjs >> "$backup/migracion.log" 2>&1
pm2 restart constancias-api > "$backup/pm2.log" 2>&1
for attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:3000/health > "$backup/health.json"; then break; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:3000/health
trap - ERR
echo "Despliegue confirmado. Commit: $expected. Respaldo privado: $backup"
