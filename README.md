# ReVibe FliP — Version 1 (MVP)
> **Redonner une seconde vie — marketplace africaine de seconde main**  
> *Lancement initial au Sénégal (Dakar & régions)*

![ReVibe FliP Logo](assets/logo.png)

---

## 🌟 Présentation du Projet

**ReVibe FliP** est une plateforme mobile et web de revente d'articles de seconde main (vêtements, chaussures, accessoires, tenues traditionnelles et Wax), conçue sur mesure pour les réalités africaines et sénégalaises.

### Points forts de la Version 1 (MVP) :
- **Paiements Mobiles Locaux** : Intégration adaptée au Sénégal avec **Wave**, **Orange Money** et **Free Money**.
- **Sécurisation par Séquestre (Escrow)** : L'argent de l'acheteur est bloqué temporairement et n'est libéré au vendeur qu'après confirmation de la bonne réception de l'article.
- **Frais de Validation (1%)** : 1% du montant de la commande prélevé pour la protection escrow et la prévention anti-fraude.
- **Modèle Économique (Commission de 20%)** : Commission plateforme de 20% prélevée sur chaque vente réalisée.
- **Livraison Adaptée** : Choix entre **Livraison à domicile** (moto coursier urbain) et **Remise en main propre** gratuite.
- **Suivi Pas à Pas** : Chronologie en temps réel (`PENDING` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`).
- **Messagerie Acheteur-Vendeur** : Discussion instantanée liée directement à l'annonce du produit via WebSocket STOMP.
- **Système de Confiance & Avis** : Évaluation 1 à 5 étoiles, calcul automatique du score de confiance et badges vérifiés.
- **Back-Office Administrateur** : Tableau de bord des KPIs financiers, gestion et suspension des utilisateurs, modération des annonces et traitement des litiges/signalements.

---

## 📚 Documentation Complète & Assurance Qualité

- 📖 **Documentation Technique Exhaustive (Fichier par fichier)** : [`DOCUMENTATION_COMPLETE_REVIBE_FLIP.md`](DOCUMENTATION_COMPLETE_REVIBE_FLIP.md)
- 🧪 **Plan de Tests & Cahier de Recette E2E (13 Classes JUnit 5 & Scénarios UAT)** : [`PLAN_DE_TESTS_ET_RECETTE.md`](PLAN_DE_TESTS_ET_RECETTE.md)

---

Toute l'ingénierie logicielle et la modélisation complète de la **Version 1 (MVP)** sont regroupées dans le sous-dossier `conception-uml/` :

| Fichier | Description |
|---|---|
| `conception-uml/DOSSIER_COMPLET_UML_REVIBE_FLIP_V1.html` | **22 Diagrammes UML & Architecture** (style Visual Paradigm en thème mauve, acteurs stickmen, héritage, `«include»`/`«extend»`, composition/agrégation, fragments `alt`/`opt`/`loop`/`par`, barres `Fork/Join`, déploiement 3D, téléchargeables en PDF/SVG) |
| `conception-uml/DESCRIPTIONS_TEXTUELLES_USE_CASES_V1.md` | **Fiches descriptives textuelles complètes** des 18 Cas d'Utilisation (`UC-01` à `UC-18`) : préconditions, postconditions, scénarios nominaux, alternatifs et d'exception |
| `conception-uml/USER_STORIES_BACKLOG_V1.md` | **Product Backlog Agile Scrum complet** : 10 Epics, 36 User Stories (`US-01` à `US-36`), critères d'acceptation Gherkin (`Given/When/Then`), Story Points, DoR/DoD et Sprint Planning |
| `conception-uml/PROTOTYPE_COMPLET_REVIBE_FLIP_V1.html` | **Prototype interactif HTML End-to-End** avec portail d'authentification/OTP en page d'accueil et 3 interfaces distinctes dédiées (**Acheteur**, **Vendeur**, **Admin Back-Office**) |

---

## 🏗️ Architecture & Stack Technique

- **Backend** : Java 21, Spring Boot 3.4.3, Spring Security 6 (JWT), Spring Data JPA / Hibernate, WebSocket STOMP, Swagger OpenAPI 3.
- **Configuration** : `application.properties` (Profils `dev` H2 en mémoire/fichier et `mysql`).
- **Base de données** : H2 pour exécution immédiate sans dépendance + MySQL 8.0 supporté via Docker.
- **Frontend Web** : React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Axios, STOMP.
- **Application Mobile** : React Native / Expo (TypeScript) structuré dans `mobile/`.

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend (Spring Boot)
Depuis le dossier `backend` :

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

- L'API démarre sur : **`http://localhost:8080`**
- Documentation interactive Swagger : **`http://localhost:8080/swagger-ui.html`**
- Console H2 : **`http://localhost:8080/h2-console`** *(JDBC URL: `jdbc:h2:mem:revibeflipdb`, user: `sa`, pas de mot de passe)*

---

### 2. Démarrer le Frontend Web (React + TypeScript)
Depuis le dossier `frontend` :

```powershell
cd frontend
npm install
npm run dev
```

- L'application Web est accessible sur : **`http://localhost:5173`**
- Le logo épuré, le panier mono-vendeur et le passage en caisse sécurisé y sont immédiatement opérationnels.

---

### 3. Démarrer l'Application Mobile (React Native / Expo)
Depuis le dossier `mobile` :

```powershell
cd mobile
npm start
```

---

### 4. (Optionnel) Démarrer MySQL 8 avec Docker Compose
Pour exécuter la base de données MySQL 8 et l'interface Adminer :

```bash
docker compose up -d
```
Puis lancer le backend avec le profil MySQL :
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=mysql
```

---

## 👥 Comptes de Démonstration Préconfigurés

Au premier démarrage, le backend initialise automatiquement les pays africains, les catégories et des comptes tests sénégalais :

| Rôle | Nom | Téléphone | Email | Mot de passe | Description |
|---|---|---|---|---|---|
| **Administrateur** | Super Admin | `+221770000000` | `admin@revibeflip.com` | `Admin1234!` | Accès complet au Back-Office |
| **Vendeuse** | Aminata Diallo | `+221771112233` | `aminata@revibeflip.com` | `Passer123!` | Vendeuse Dakar (Note 4.9 ★) |
| **Vendeur** | Moussa Ndiaye | `+221774445566` | `moussa@revibeflip.com` | `Passer123!` | Vendeur Dakar (Note 4.8 ★) |
| **Acheteur** | Fatou Sow | `+221778889900` | `fatou@revibeflip.com` | `Passer123!` | Acheteuse Dakar Almadies |

---

## 🧪 Tests Automatisés

Le backend inclut une suite complète de tests d'intégration validant le parcours de bout en bout :
- Inscription et validation du code OTP par SMS
- Publication d'annonce et gestion du catalogue
- Calcul rigoureux des montants (1% de frais de validation + 20% de commission plateforme + livraison)
- Paiement mobile Wave / Orange Money et mise sous séquestre (Escrow)
- Progression du suivi de livraison et confirmation de réception
- Déblocage automatique des fonds au vendeur et notation 5 étoiles

Pour relancer la suite de tests :
```powershell
cd backend
.\mvnw.cmd test
```
