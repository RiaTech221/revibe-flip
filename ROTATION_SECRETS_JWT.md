# Guide d'Exploitation : Rotation des Secrets de Signature JWT (SEC-05)

## 1. Contexte & Architecture des Jetons

Dans ReVibe FliP, l'authentification repose sur un modèle à double jeton conforme aux recommandations OWASP :

| Type de jeton | Durée de vie | Algorithme / Stockage | Rôle |
| :--- | :--- | :--- | :--- |
| **Access Token (JWT)** | **15 minutes** (`900000` ms) | HMAC-SHA256 signé via `REVIBE_JWT_SECRET` | Porté dans l'en-tête `Authorization: Bearer <token>` pour authentifier chaque requête API. |
| **Refresh Token** | **7 jours** (`604800000` ms) | Chaîne aléatoire cryptographique (48 octets), stockée sous forme de **hachage SHA-256** en base (`refresh_tokens`) | Utilisé exclusivement sur `/api/auth/refresh` pour obtenir un nouvel access token avec rotation à chaque usage. |

---

## 2. Règles de Sécurité au Démarrage (SEC-05)

1. **Aucun secret dans le code ni dans Git :**  
   `application.properties` et `.env.example` ne contiennent aucun secret de repli.
2. **Exigence stricte en production (`prod`) :**  
   L'application refuse de démarrer (`IllegalStateException`) si :
   - La variable d'environnement `REVIBE_JWT_SECRET` est absente ou vide ;
   - Le secret fait moins de 32 octets (256 bits) ;
   - Le secret correspond à la clé de test connue présente dans l'historique Git (`9a3f2c5d...`).
3. **Séparation Dev / Prod :**  
   En profil local (`dev`), si aucun secret n'est fourni, une clé éphémère aléatoire de 256 bits est générée en mémoire pour la session.

---

## 3. Procédure de Rotation Planifiée (Sans interruption de service)

Cette procédure est à exécuter périodiquement (ex: tous les 90 jours) dans le cadre de la politique de sécurité.

### Étape 1 : Générer un nouveau secret cryptographique fort
Sur votre terminal sécurisé, générez une clé aléatoire de 32 octets (256 bits minimum) encodée en hexadécimal ou base64 :
```bash
# Génération d'une clé hexadécimale de 64 caractères (32 octets / 256 bits)
openssl rand -hex 32
```

### Étape 2 : Mettre à jour la variable d'environnement sur Render
1. Connectez-vous au tableau de bord **Render** (ou votre hébergeur cloud).
2. Accédez à votre service backend **revibe-flip-backend**.
3. Allez dans **Environment Variables**.
4. Modifiez la valeur de la variable :
   - Clé : `REVIBE_JWT_SECRET`
   - Valeur : *`<la nouvelle clé générée à l'étape 1>`*
5. Cliquez sur **Save Changes**.

### Étape 3 : Redémarrage automatique
Render déclenche automatiquement un déploiement sans interruption (*Zero Downtime Deployment*).

### Impact sur les utilisateurs :
* **Access Tokens existants :** Les jetons d'accès émis avec l'ancienne clé échouent à la vérification de signature (`SignatureException`).
* **Expérience utilisateur transparente :** Le client (Web ou Mobile) intercepte l'erreur `401 Unauthorized`, appelle silencieusement l'endpoint `/api/auth/refresh` avec son refresh token valide, et reçoit un nouvel access token signé avec le nouveau secret. L'utilisateur ne subit aucune déconnexion.

---

## 4. Procédure de Rotation d'Urgence (En cas de fuite ou compromission)

Si le secret a été exposé (ex: journalisation anormale, fuite de variables d'environnement, accès non autorisé) :

### Étape 1 : Rotation immédiate du secret sur Render
Générer et injecter immédiatement un nouveau secret sur Render (voir Étape 1 et 2 ci-dessus).

### Étape 2 : Révocation globale des sessions (Obligatoire)
Pour empêcher un attaquant qui disposerait d'anciens refresh tokens ou qui aurait forgé des jetons de continuer à accéder au système, exécuter la requête SQL suivante directement sur la base de données de production :

```sql
-- Révocation immédiate de toutes les sessions actives
UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;
```
*(Alternative : `TRUNCATE TABLE refresh_tokens;`)*

### Résultat :
* Tous les utilisateurs (y compris l'attaquant) sont immédiatement déconnectés.
* Chaque utilisateur légitime devra se réauthentifier via son mot de passe et son OTP SMS.
