#!/usr/bin/env bash
set -euo pipefail

# Sauvegarde chiffrée AES-256 de la base MySQL de production ReVibe FliP.
# Prérequis : BACKUP_ENCRYPTION_KEY, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD définis.

: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY doit être défini}"
: "${MYSQL_DATABASE:=revibeflip}"
: "${MYSQL_USER:=revibeflip_user}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD doit être défini}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz.enc"

docker exec -e MYSQL_PWD="$MYSQL_PASSWORD" revibeflip-mysql \
  mysqldump --single-transaction --routines --triggers -u "$MYSQL_USER" "$MYSQL_DATABASE" \
  | gzip -9 \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -out "$OUT_FILE"

echo "Sauvegarde chiffrée créée : $OUT_FILE"
