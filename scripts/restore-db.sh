#!/usr/bin/env bash
set -euo pipefail

# Restauration d'une sauvegarde chiffrée AES-256 vers MySQL ReVibe FliP.
# Usage : BACKUP_ENCRYPTION_KEY=... MYSQL_PASSWORD=... ./scripts/restore-db.sh backups/revibeflip_YYYYMMDD_HHMMSS.sql.gz.enc

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <fichier_backup.sql.gz.enc>"
  exit 1
fi

BACKUP_FILE="$1"
: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY doit être défini}"
: "${MYSQL_DATABASE:=revibeflip}"
: "${MYSQL_USER:=revibeflip_user}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD doit être défini}"

openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in "$BACKUP_FILE" \
  | gunzip \
  | docker exec -i -e MYSQL_PWD="$MYSQL_PASSWORD" revibeflip-mysql mysql -u "$MYSQL_USER" "$MYSQL_DATABASE"

echo "Restauration terminée depuis : $BACKUP_FILE"
