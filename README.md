# ReVibe FliP
> **Redonner une seconde vie — marketplace africaine de seconde main**  
> *Lancement initial au Sénégal (Dakar & régions)*

![ReVibe FliP Logo](assets/logo.png)

---

## 🌟 Présentation du Projet

**ReVibe FliP** est une plateforme web et mobile de revente d'articles de seconde main (vêtements, chaussures, accessoires, tenues traditionnelles et Wax), conçue pour les réalités sénégalaises et africaines.

### Fonctionnalités principales :
- **Paiements Mobiles Locaux (PayTech)** : Intégration serveur PayTech (`https://doc.paytech.sn`) pour **Wave**, **Orange Money** et **Free Money**, avec vérification IPN SHA-256, contrôle de statut serveur et grand livre immuable (`ledger_entries`).
- **Conservation des Fonds jusqu'à Réception** : Le paiement de l'acheteur est conservé par ReVibe FliP jusqu'à la confirmation de réception (ou auto-confirmation après le délai paramétré, hors litige ouvert).
- **Frais de Validation (1%) & Commission (20%)** : Recalculés exclusivement côté serveur depuis la base de données.
- **Livraison Adaptée** : Choix entre **Livraison à domicile** et **Remise en main propre**, avec suivi pas à pas (`PENDING` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`).
- **Messagerie Acheteur-Vendeur** : Discussion instantanée liée à l'annonce via WebSocket STOMP authentifié par JWT.
- **Système de Confiance & Avis** : Évaluation 1 à 5 étoiles, score de confiance et signalements.
- **Back-Office Administrateur** : KPIs financiers, gestion et suspension des utilisateurs, modération des annonces, suivi des paiements/versements, litiges, CMS et **Journal d'Audit** dédié.

---

## 📚 Documentation & Références

- 🚀 **Guide de Déploiement en Production (VPS & Docker)** : [`DEPLOYMENT.md`](DEPLOYMENT.md)
- ⚙️ **Variables d'Environnement (Modèle)** : [`.env.example`](.env.example)
- 🌳 **Guide de Contribution & Git Workflow** : [`CONTRIBUTING.md`](CONTRIBUTING.md)
- ⚙️ **Pipelines CI/CD (GitHub Actions)** : [`.github/workflows/ci.yml`](.github/workflows/ci.yml) & [`.github/workflows/cd.yml`](.github/workflows/cd.yml)
- 📖 **Documentation Technique** : [`DOCUMENTATION_COMPLETE_REVIBE_FLIP.md`](DOCUMENTATION_COMPLETE_REVIBE_FLIP.md)
- 🧪 **Plan de Tests** : [`PLAN_DE_TESTS_ET_RECETTE.md`](PLAN_DE_TESTS_ET_RECETTE.md)

---

## 🏗️ Architecture & Stack Technique

- **Backend** : Java 21, Spring Boot 3.4.3, Spring Security 6 (JWT 15 min + Refresh Token rotatif en cookie `HttpOnly`), Spring Data JPA / Hibernate, Flyway (MySQL 8 en prod), WebSocket STOMP.
- **Base de données** :
  - **Développement (`dev`)** : H2 en mémoire (`jdbc:h2:mem:revibeflip_db`).
  - **Production (`prod`)** : MySQL 8.0 avec migrations Flyway (`ddl-auto=validate`).
- **Frontend Web** : React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Axios, STOMP.
- **Application Mobile** : React Native / Expo (TypeScript) dans `mobile/`.

---

## 🚀 Démarrage en Développement Local

### 1. Backend (profil `dev`)
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
- API REST : `http://localhost:8080/api`
- Swagger UI *(désactivé en prod)* : `http://localhost:8080/swagger-ui.html`
- Console H2 *(désactivée en prod)* : `http://localhost:8080/h2-console` (`jdbc:h2:mem:revibeflip_db`, user `sa`, mot de passe vide)
- En profil `dev`, `DevDataSeeder` initialise un jeu de données local de test (exclu du JAR de production `-Pprod`).

### 2. Frontend Web
```powershell
cd frontend
npm install
npm run dev
```
- Interface web : `http://localhost:5173`

### 3. Application Mobile (Expo)
```powershell
cd mobile
npm install
npm start
```

---

## 🔐 Déploiement en Production

### 1. Configuration `.env` obligatoire
Copiez `.env.example` vers `.env` et renseignez **toutes** les variables requises (au démarrage en `prod`, l'application refuse de démarrer si PayTech, SMS, JWT ou la BDD sont manquants) :
- **Base de données** : `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- **JWT & CORS** : `JWT_SECRET` (minimum 32 octets aléatoires), `CORS_ALLOWED_ORIGINS` (domaines exacts, sans `*`)
- **PayTech** : `PAYTECH_API_KEY`, `PAYTECH_API_SECRET`, `PAYTECH_ENV` (`test` ou `prod`), `PAYTECH_IPN_URL`, `PAYTECH_SUCCESS_URL`, `PAYTECH_CANCEL_URL`
- **SMS OTP** : `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID`
- **Bootstrap du 1er Administrateur** : `REVIBE_BOOTSTRAP_ADMIN_PHONE`, `REVIBE_BOOTSTRAP_ADMIN_EMAIL`, `REVIBE_BOOTSTRAP_ADMIN_PASSWORD` (min. 12 caractères avec majuscule, minuscule, chiffre et caractère spécial — changement imposé à la première connexion)

### 2. Build Production (sans données ni classes dev)
```bash
cd backend
./mvnw clean package -Pprod -DskipTests
```
*(Le profil Maven `-Pprod` exclut `DevDataSeeder` du JAR final.)*

### 3. Nettoyage pré-lancement & Lancement Docker Production
```bash
# Optionnel : nettoyer d'éventuelles données de test d'une base existante
mysql -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" < backend/scripts/cleanup-dev-data.sql

# Démarrer la stack de production (MySQL 8 + Backend + Frontend Nginx)
docker compose --profile prod up -d --build
```
*(Pour l'outil Adminer en dev uniquement : `docker compose --profile dev up -d adminer`.)*

### 4. Sauvegarde & Restauration chiffrées (AES-256-CBC)
```bash
./scripts/backup-db.sh
./scripts/restore-db.sh <fichier_backup.sql.gz.enc>
```

---

## 🧪 Tests & Contrôles Qualité

```powershell
# Suite de tests backend (incluant ProductionAuditSecurityTests)
cd backend
.\mvnw.cmd test

# Contrôle CI anti-résidus (mots interdits dans le code livré)
bash scripts/check-forbidden-words.sh

# Build & audit frontend
cd frontend
npm run build
npm audit --audit-level=high
```

---

## 🌳 Workflow Git

Toute évolution suit le flux strict :
`feature/<nom>` $\rightarrow$ `develop` $\rightarrow$ `main` $\rightarrow$ `deploy` $\rightarrow$ `release`.
