#!/bin/bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
branch=trabajo/generadores
expected=$(git -c safe.directory="$PWD" ls-remote origin "refs/heads/$branch" | cut -f1)
[[ "$expected" =~ ^[a-f0-9]{40}$ ]] || { echo 'No se pudo consultar el commit publicado.'; exit 1; }
exec bash scripts/desplegar-servidor.sh "$branch" "$expected"
