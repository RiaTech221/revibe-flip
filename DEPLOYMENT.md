# Guide de Déploiement en Production (VPS Hostinger & Docker) — ReVibe FliP

Ce guide détaille pas à pas la procédure complète pour déployer, sécuriser, mettre à jour et maintenir la plateforme **ReVibe FliP** sur un serveur **VPS Hostinger** (Ubuntu 22.04 LTS / 24.04 LTS ou Debian 12).

---

## 1. Architecture de Déploiement sur le VPS

L'application repose sur une architecture conteneurisée **Docker Compose** prête pour la production :

| Conteneur | Technologie | Rôle | Port Interne | Exposition |
| :--- | :--- | :--- | :--- | :--- |
| **`revibeflip-frontend`** | Nginx Alpine + React 18 | Serveur Web frontal, Reverse-Proxy (`/api`, `/ws`, `/uploads`) | `80` | Public (`80` / `443`) |
| **`revibeflip-backend`** | Java 21 JRE (Non-root) + Spring Boot 3 | API REST, Paiements PayTech, Grand livre, WebSocket STOMP | `8080` | Réseau interne Docker |
| **`revibeflip-mysql`** | MySQL 8.0 | Base de données relationnelle persistante (Flyway) | `3306` | Réseau interne Docker |
| **`revibeflip-adminer`** | Adminer | Interface d'administration BDD (profil `dev` uniquement) | `8080` | `8081` (désactivé en `prod`) |

### Volumes Persistants
- **`mysql_data`** : Conserve toutes les données clients, commandes, grand livre des transactions et messages.
- **`uploads_data`** : Conserve toutes les photos d'articles et avatars téléversés par les utilisateurs dans `/app/uploads`.

---

## 2. Préparation du VPS Hostinger (Première Installation)

### 2.1 Connexion SSH au VPS
Depuis votre terminal local (PowerShell, Terminal macOS/Linux) :

```bash
ssh root@<IP_DE_VOTRE_VPS_HOSTINGER>
```

### 2.2 Mise à jour du système et outils de base
```bash
apt update && apt upgrade -y
apt install -y git curl ufw nano ca-certificates gnupg
```

### 2.3 Installation officielle de Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Vérifiez l'installation :
```bash
docker --version
docker compose version
```

### 2.4 Configuration du Pare-feu (UFW)
Autorisez uniquement le trafic SSH, HTTP et HTTPS :
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

---

## 3. Déploiement de ReVibe FliP (Branche `deploy`)

Conformément à notre méthodologie Gitflow, le serveur de production utilise exclusivement la branche **`deploy`**.

### 3.1 Clonage du dépôt
```bash
mkdir -p /opt/revibe-flip
cd /opt/revibe-flip
git clone -b deploy https://github.com/RiaTech221/revibe-flip.git .
```

### 3.2 Configuration des variables d'environnement (`.env`)
Copiez le modèle `.env.example` vers `.env` :
```bash
cp .env.example .env
```

Générez une clé secrète JWT cryptographique de 64 caractères :
```bash
openssl rand -hex 32
```

Éditez le fichier `.env` :
```bash
nano .env
```

Adaptez les valeurs critiques suivantes pour la production (voir aussi `.env.example`) :
```dotenv
SPRING_PROFILES_ACTIVE=prod

# Base de données MySQL (utilisateur applicatif non-root)
DB_NAME=revibeflip
DB_USERNAME=revibeflip_user
DB_PASSWORD=<MOT_DE_PASSE_BDD_ROBUSTE>
MYSQL_ROOT_PASSWORD=<MOT_DE_PASSE_ROOT_ROBUSTE>

# Clé secrète JWT (min. 32 octets aléatoires : openssl rand -hex 32)
JWT_SECRET=<COLLEZ_VOTRE_CLE_SECRETE_ICI>
JWT_EXPIRATION_MS=900000
CORS_ALLOWED_ORIGINS=https://revibeflip.com,https://www.revibeflip.com

# PayTech (https://doc.paytech.sn)
PAYTECH_API_KEY=<VOTRE_CLE_API_PAYTECH>
PAYTECH_API_SECRET=<VOTRE_SECRET_PAYTECH>
PAYTECH_ENV=prod
PAYTECH_IPN_URL=https://revibeflip.com/api/payments/ipn
PAYTECH_SUCCESS_URL=https://revibeflip.com/orders/payment-return?status=success
PAYTECH_CANCEL_URL=https://revibeflip.com/orders/payment-return?status=cancel
PAYTECH_TRANSFER_CALLBACK_URL=https://revibeflip.com/api/payments/transfer-ipn

# SMS OTP & Bootstrap du 1er Administrateur
SMS_API_URL=<URL_API_SMS>
SMS_API_KEY=<CLE_API_SMS>
SMS_SENDER_ID=ReVibeFliP
REVIBE_BOOTSTRAP_ADMIN_PHONE=+221XXXXXXXXX
REVIBE_BOOTSTRAP_ADMIN_EMAIL=admin@revibeflip.com
REVIBE_BOOTSTRAP_ADMIN_PASSWORD=<MOT_DE_PASSE_ADMIN_12_CHARS_FORT>
```

Enregistrez dans `nano` avec `Ctrl+O`, `Entrée`, puis quittez avec `Ctrl+X`.

### 3.3 Construction et démarrage des services (profil `prod`)
```bash
docker compose --profile prod up -d --build
```

### 3.4 Vérification de l'état des conteneurs
```bash
docker compose ps
```
Tous les services doivent afficher le statut `Up` (et `healthy` pour `revibeflip-mysql`).

Pour suivre les journaux (logs) du backend en direct :
```bash
docker compose logs -f backend
```

Votre plateforme est maintenant accessible sur :
- **Site Web & API** : `http://<IP_DE_VOTRE_VPS_HOSTINGER>`

---

## 4. Mise en place d'un Nom de Domaine & HTTPS (SSL Let's Encrypt)

Si vous possédez un nom de domaine (ex: `revibeflip.com` chez Hostinger) :

1. Dans la **Zone DNS Hostinger**, créez deux entrées :
   - Type **A** | Nom : `@` | Pointe vers : `<IP_DE_VOTRE_VPS_HOSTINGER>`
   - Type **A** | Nom : `www` | Pointe vers : `<IP_DE_VOTRE_VPS_HOSTINGER>`
2. Pour activer le cadenas HTTPS automatiquement, vous pouvez placer **Caddy** ou **Nginx + Certbot** devant le port du frontend, ou monter les certificats Let's Encrypt dans le conteneur `frontend`.

---

## 5. Procédure de Mise à Jour (Livraison Continue Gitflow)

À chaque nouvelle version validée et fusionnée dans la branche **`deploy`** sur GitHub, connectez-vous au VPS et exécutez :

```bash
cd /opt/revibe-flip

# 1. Récupérer la dernière version stable de la branche deploy
git pull origin deploy

# 2. Reconstruire et relancer uniquement les conteneurs modifiés sans perte de données
docker compose --profile prod up -d --build

# 3. Nettoyer les anciennes images Docker inutilisées
docker image prune -f
```

> **Note importante** : Vos données MySQL (`mysql_data`) et les photos d'articles (`uploads_data`) sont stockées dans des volumes Docker externes aux conteneurs et sont **intégralement préservées** lors des mises à jour.

---

## 5 bis. Protection Cloudflare (WAF, Anti-Bot, SSL/TLS & Masquage IP)

Pour protéger la plateforme contre les bots, attaques DDoS et scans automatisés tout en masquant l'IP réelle du VPS :

1. **DNS & Proxy Cloudflare (Nuage orange)** :
   - Ajoutez votre domaine dans Cloudflare, vérifiez les enregistrements DNS (`A` vers l'IP du VPS) avec le **proxy activé (nuage orange)** et basculez les serveurs de noms chez votre registrar.
2. **SSL/TLS en mode `Full (strict)`** :
   - Conservez un certificat Let's Encrypt ou un certificat Cloudflare Origin sur votre VPS (Nginx / reverse-proxy) et réglez **SSL/TLS → Full (strict)** sur Cloudflare.
3. **WAF & Anti-Bot Cloudflare** :
   - Activez **Bot Fight Mode** et les règles WAF gérées Cloudflare (plan gratuit suffisant pour démarrer).
   - *(Recommandé)* Activez **Cloudflare Turnstile** en renseignant `REVIBE_TURNSTILE_ENABLED=true` et `REVIBE_TURNSTILE_SECRET_KEY=...` dans `.env` : le backend vérifiera automatiquement le jeton `X-Turnstile-Token` sur `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/resend-otp` et `/api/contact`.
   - `frontend/nginx.conf` et `RateLimitFilter` résolvent déjà l'IP réelle du visiteur via `CF-Connecting-IP` (empêchant le contournement par spoofing `X-Forwarded-For`).
4. **Pare-feu serveur (UFW) restreint aux IP Cloudflare** :
   - Pour empêcher toute attaque directe sur l'IP du VPS en contournant Cloudflare, n'autorisez les ports `80` et `443` **que** depuis les plages IPv4/IPv6 officielles de Cloudflare (`https://www.cloudflare.com/ips/`), tout en gardant votre accès SSH sécurisé :
   ```bash
   for ip in $(curl -s https://www.cloudflare.com/ips-v4); do ufw allow proto tcp from "$ip" to any port 80,443; done
   for ip in $(curl -s https://www.cloudflare.com/ips-v6); do ufw allow proto tcp from "$ip" to any port 80,443; done
   ufw reload
   ```

---

## 6. Sauvegarde (Backup) et Restauration

### 6.1 Sauvegarder la base de données MySQL
```bash
docker exec revibeflip-mysql mysqldump -u root -p'VOTRE_MYSQL_ROOT_PASSWORD' revibeflip > backup_revibeflip_$(date +%F).sql
```

### 6.2 Sauvegarder les photos d'annonces (`uploads_data`)
```bash
docker run --rm -v revibe-flip_uploads_data:/uploads -v $(pwd):/backup alpine tar czf /backup/backup_uploads_$(date +%F).tar.gz -C /uploads .
```

### 6.3 Restaurer une sauvegarde MySQL
```bash
cat backup_revibeflip_YYYY-MM-DD.sql | docker exec -i revibeflip-mysql mysql -u root -p'VOTRE_MYSQL_ROOT_PASSWORD' revibeflip
```

---

## 7. Commandes de Maintenance et Dépannage

| Action | Commande |
| :--- | :--- |
| Voir l'état de tous les conteneurs | `docker compose ps` |
| Voir les logs du backend | `docker compose logs -f --tail=100 backend` |
| Voir les logs du frontend Nginx | `docker compose logs -f --tail=100 frontend` |
| Redémarrer uniquement le backend | `docker compose restart backend` |
| Arrêter toute la plateforme | `docker compose down` |
| Vérifier l'espace disque et RAM du VPS | `df -h && free -m && docker stats --no-stream` |

---

## 8. Sécurité, Intégrations Externes & Runbook d'Incident (Production)

### 8.1 Services externes requis avant mise en production
1. **PayTech (`https://doc.paytech.sn`)** :
   - Renseigner `PAYTECH_API_KEY`, `PAYTECH_API_SECRET`, `PAYTECH_ENV=prod`, `PAYTECH_IPN_URL`, `PAYTECH_SUCCESS_URL`, `PAYTECH_CANCEL_URL`, `PAYTECH_TRANSFER_CALLBACK_URL`.
   - L'application refuse de démarrer en profil `prod` si une variable PayTech obligatoire manque (`PayTechConfigValidator`).
   - Confirmer avec PayTech : l'activation du module Transfert (`/transfer/transferFund`), le support des remboursements automatisés ou manuels via dashboard, la liste des moyens de paiement actifs (`Wave`, `Orange Money`, `Free Money`), et les modalités de conservation des fonds.
2. **Fournisseur SMS / OTP** :
   - Renseigner `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID`.
   - L'application refuse de démarrer en profil `prod` sans configuration SMS valide (`SmsConfigValidator`).
3. **Premier administrateur** :
   - Définir `REVIBE_BOOTSTRAP_ADMIN_PHONE` et `REVIBE_BOOTSTRAP_ADMIN_PASSWORD` (mot de passe fort >= 12 caractères) pour le premier démarrage, puis supprimer ces variables. Le changement de mot de passe est imposé à la première connexion.

### 8.2 Migrations Flyway & Sauvegardes Chiffrées
- En production, `SPRING_JPA_DDL_AUTO=validate` et `spring.flyway.enabled=true` exécutent les scripts dans `backend/src/main/resources/db/migration/`.
- Avant toute mise à jour, exécuter une sauvegarde chiffrée AES-256 :
  ```bash
  BACKUP_ENCRYPTION_KEY="<cle-forte>" MYSQL_PASSWORD="<mdp>" ./scripts/backup-db.sh
  ```
- Planifier via `cron` quotidien (ex: `0 3 * * *`) avec rétention 30 jours hors du VPS.

### 8.3 Supervision & Alertes
- **Healthcheck backend** : `GET /actuator/health` (seul endpoint Actuator exposé en prod, sans détails sensibles).
- **Réconciliation financière** : tâche planifiée quotidienne comparant le grand livre immuable (`ledger_entries`) aux statuts PayTech et alertant l'administration en cas d'écart.
- **Surveillance recommandée** : sonde Uptime (ex. UptimeRobot / Prometheus + Grafana) sur `/actuator/health`, alertes disque (> 80%), CPU/RAM, et rotation des logs Docker.

### 8.4 Runbook d'Incident
1. **Fuite de secret / clé compromise** :
   - Générer immédiatement une nouvelle clé (`REVIBE_JWT_SECRET`, `PAYTECH_API_SECRET`, `SMS_API_KEY`), mettre à jour `.env`, redémarrer `backend` (`docker compose up -d --force-recreate backend`). La rotation de `REVIBE_JWT_SECRET` invalide instantanément tous les JWT actifs.
2. **Écart de paiement ou IPN non reçu** :
   - Vérifier les logs backend (aucune donnée sensible journalisée), consulter la page `/orders/:id` (vérification serveur `get-status`), ou relancer la réconciliation dans l'espace Admin (`/api/admin/ledger`).
3. **Versement vendeur en état `MANUAL_REQUIRED` ou `FAILED`** :
   - Consulter le grand livre Admin (`/api/admin/ledger`), effectuer le virement depuis le dashboard PayTech si l'API transfert est indisponible, puis régulariser.
