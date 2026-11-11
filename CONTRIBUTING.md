# 📘 Guide de Contribution & Workflow de Développement — ReVibe FliP

Bienvenue dans l'équipe d'ingénierie de **ReVibe FliP** !  
Ce document définit la méthode de travail standard, rigoureuse et professionnelle adoptée par l'équipe pour garantir la qualité, la stabilité et la traçabilité de tout le code produit sur la marketplace (Backend Spring Boot, Frontend Web React/Vite, Application Mobile Expo).

---

## 🌳 1. Architecture des Branches (Git Flow ReVibe)

Le dépôt utilise une stratégie de branches stricte et ordonnée :

```text
       [ feature/* ] ────────┐
       [ fix/*     ] ──────┐ │
                           ▼ ▼
[ main ] ──────────────► [ develop ] ────────► [ release ] ────────► [ deploy ] ────────► [ main ] (vX.Y.Z)
(Production stable)      (Intégration)        (Recette & QA)       (Déploiement)        (Version tagguée)
```

### Rôle de chaque branche :

| Branche | Rôle & Description | Origine | Fusionne vers | Accès direct |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | **Production stable**. Code testé, validé et audité. Chaque merge est taggué (`v1.0.0`). | — | — | ❌ **Strictement protégé** (PR uniquement) |
| **`develop`** | **Branche d'intégration principale**. C'est le tronc commun de développement quotidien. | `main` | `release` | ❌ **Protégé** (PR uniquement) |
| **`release`** | **Branche de recette / livraison**. Stabilisation finale, tests de bout en bout et gel des fonctionnalités avant déploiement. | `develop` | `deploy` & `main` | ❌ **Protégé** (Tech Lead) |
| **`deploy`** | **Branche de déploiement**. Déclenche automatiquement les pipelines CI/CD vers les serveurs cloud / staging. | `release` | — | ❌ **CI/CD automatisé** |
| **`feature/*`** | Développement d'une nouvelle fonctionnalité (ex: `feature/notification-push`). | `develop` | `develop` via PR | ✔️ Développeur assigné |
| **`fix/*`** ou **`bugfix/*`** | Correction d'une anomalie détectée sur develop. | `develop` | `develop` via PR | ✔️ Développeur assigné |
| **`hotfix/*`** | Correctif urgent en production. | `main` | `main` & `develop` | ✔️ Tech Lead |

---

## 🚀 2. Cycle de Travail Quotidien du Développeur

Chaque membre de l'équipe suit obligatoirement les 6 étapes suivantes :

### Étape 1 : Mettre à jour sa branche `develop` locale
Avant de commencer toute nouvelle tâche, assurez-vous d'avoir la dernière version validée :
```bash
git checkout develop
git pull origin develop
```

### Étape 2 : Créer sa sous-branche de travail
Ne travaillez **JAMAIS** directement sur `main`, `develop` ou `release` ! Créez toujours une sous-branche dédiée :
```bash
# Pour une nouvelle fonctionnalité :
git checkout -b feature/nom-de-la-tache

# Pour la correction d'un bug :
git checkout -b fix/nom-du-bug
```

*Conventions de nommage des branches :*
- `feature/auth-biometrique`
- `feature/seller-analytics`
- `fix/calcul-commission-pourcentage`
- `refactor/clean-architecture-orders`

---

### Étape 3 : Développer et valider en local (Règle 0 Défaut)
Avant tout commit, **vous devez valider la compilation sans erreur** :

* **Backend Spring Boot** :
  ```bash
  cd backend
  ./mvnw compile
  ./mvnw test
  ```
* **Frontend Web** :
  ```bash
  cd frontend
  npm run build
  ```
* **Mobile Expo** :
  ```bash
  cd mobile
  npm run lint
  ```

---

### Étape 4 : Rédiger des commits clairs (Conventional Commits)
Chaque message de commit doit être explicite et préfixé par son type :

* `feat:` Nouvelle fonctionnalité (ex: `feat(seller): ajout du filtre par période sur le dashboard`)
* `fix:` Correction d'un bug (ex: `fix(order): calcul des frais de séquestre sur les commandes multiples`)
* `refactor:` Refactorisation sans modification fonctionnelle (ex: `refactor(dto): séparation de OrderFunnelStepDto`)
* `style:` Ajustements cosmétiques (ex: `style(navbar): allègement des espacements et des puces`)
* `test:` Ajout ou correction de tests unitaires/intégration
* `docs:` Modification de la documentation
* `chore:` Maintenance, dépendances, configuration build

Exemple :
```bash
git add .
git commit -m "feat(chat): ajout de l'offre directe sous séquestre dans la messagerie"
```

---

### Étape 5 : Pousser sa sous-branche sur GitHub
```bash
git push -u origin feature/nom-de-la-tache
```

---

### Étape 6 : Ouvrir une Pull Request (PR) vers `develop`
1. Rendez-vous sur le dépôt GitHub de **ReVibe FliP** : `https://github.com/RiaTech221/revibe-flip`.
2. Cliquez sur le bouton **Compare & pull request**.
3. **Cible de la PR** : Assurez-vous que la branche de destination est bien **`develop`** (et non pas `main`) !
   - Base: `develop` ◄ Compare: `feature/nom-de-la-tache`
4. Remplissez le template de PR fourni automatiquement :
   - Expliquer ce qui a été fait.
   - Mentionner les tests réalisés (captures d'écran si UI).
5. Demandez une relecture (Code Review) à au moins un pair ou au Tech Lead.
6. Une fois la PR approuvée et les tests validés, le merge est réalisé en mode **Squash & Merge** ou **Rebase & Merge** pour garder un historique propre.

---

## 🔒 3. Processus de Release & Déploiement

1. **Cycle de Livraison (`develop` ➔ `release`)** :
   - À la fin d'un sprint ou d'une itération, une branche `release` est mise à jour depuis `develop`.
   - L'équipe QA effectue la recette finale sur l'environnement de staging.
   - Seuls des `fix/*` critiques peuvent être mergés sur `release`.
2. **Déploiement (`release` ➔ `deploy` ➔ `main`)** :
   - La branche `deploy` déclenche la mise en production.
   - Une fois déployé avec succès, `release` est mergée dans `main` et un tag de version est créé (ex: `git tag -a v1.2.0 -m "Release v1.2.0"`).
   - Les éventuels correctifs de release sont rétro-fusionnés dans `develop`.

---

## 🐳 5. Environnement Conteneurisé Docker (Bonnes Pratiques)

Le projet intègre une architecture Docker complète et conteneurisée selon les standards industriels :

* **`backend/Dockerfile`** : Build multi-stage optimisé (Maven/Temurin JDK 21 -> Runtime Temurin JRE 21 non-root).
* **`frontend/Dockerfile` & `frontend/nginx.conf`** : Build multi-stage (Node 20 -> Nginx Alpine ultra-léger avec routage SPA et proxy API/WebSocket).
* **`docker-compose.yml`** : Orchestrateur complet reliant MySQL 8.0, le Backend Spring Boot, le Frontend Nginx et l'interface Adminer.

### Lancer tout l'environnement en une seule commande :
```bash
docker compose up -d --build
```
* **Frontend Web** : `http://localhost` (ou `http://localhost:5173`)
* **Backend API** : `http://localhost:8080/api`
* **Base de données MySQL** : `localhost:3306`
* **Adminer (Web UI BDD)** : `http://localhost:8081`

### Arrêter les conteneurs :
```bash
docker compose down
```

---

## 🛡️ 6. Règles d'or de l'équipe

1. **Aucun commit direct sur `main` ou `develop`** : tout passe par une PR avec relecture.
2. **Ne jamais casser le build** : ne soumettez jamais une PR qui ne compile pas localement.
3. **Sécurité & Données** : ne jamais commiter de mots de passe, clés d'API Wave/Orange Money, ou fichiers `.env`.
4. **Communication** : discutez des choix d'architecture avec l'équipe avant de vous lancer dans de gros refactoring.
