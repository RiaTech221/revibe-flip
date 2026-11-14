#!/usr/bin/env bash
set -euo pipefail

# Contrôle CI (Bloc 1) : interdit toute trace de simulation, mock, démo ou résidu dans le code de production.
PATTERN='simulation|mock|demo|TODO|FIXME|lorem|admin123|password123'

TARGETS=(
  "backend/src/main"
  "frontend/src"
  "mobile/src"
)

FAILED=0

for dir in "${TARGETS[@]}"; do
  if [ -d "$dir" ]; then
    MATCHES=$(grep -rnEi "$PATTERN" "$dir" \
      --exclude-dir=node_modules \
      --exclude-dir=__tests__ \
      --exclude='*.test.*' \
      --exclude='*.spec.*' \
      --exclude='DevDataSeeder.java' || true)
    if [ -n "$MATCHES" ]; then
      echo "❌ Mots interdits détectés dans $dir :"
      echo "$MATCHES"
      FAILED=1
    fi
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo "Échec du contrôle de propreté production."
  exit 1
fi

echo "✅ Aucun mot interdit détecté dans le code de production."
