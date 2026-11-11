# 📑 Dossier des Descriptions Textuelles des Cas d'Utilisation — ReVibe FliP (V1 MVP)

> **Projet** : ReVibe FliP — Marketplace africaine de seconde main (Lancement Sénégal)  
> **Version** : 1.0 (MVP)  
> **Méthodologie** : Ingénierie des Exigences & Spécification UML 2.5 (Format Alistair Cockburn)  
> **Couverture** : 100 % des Cas d'Utilisation Front-Office (Visiteur, Acheteur, Vendeur) & Back-Office (Administrateur)

---

## Table des Matières

1. [Matrice Récapitulative des Cas d'Utilisation (UC-01 à UC-18)](#1-matrice-récapitulative-des-cas-dutilisation-uc-01-à-uc-18)
2. [Module 1 : Authentification, OTP SMS & Gestion de Compte](#2-module-1--authentification-otp-sms--gestion-de-compte)
   - [UC-01 : S'inscrire et vérifier son compte par OTP SMS](#uc-01--sinscrire-et-vérifier-son-compte-par-otp-sms)
   - [UC-02 : Se connecter, se déconnecter et réinitialiser son mot de passe](#uc-02--se-connecter-se-déconnecter-et-réinitialiser-son-mot-de-passe)
   - [UC-03 : Gérer son profil, sa photo et ses adresses](#uc-03--gérer-son-profil-sa-photo-et-ses-adresses)
3. [Module 2 : Marketplace, Catalogue & Gestion des Annonces](#3-module-2--marketplace-catalogue--gestion-des-annonces)
   - [UC-04 : Créer et publier une annonce](#uc-04--créer-et-publier-une-annonce)
   - [UC-05 : Gérer ses annonces (Modifier, Désactiver, Réactiver, Supprimer)](#uc-05--gérer-ses-annonces-modifier-désactiver-réactiver-supprimer)
   - [UC-06 : Rechercher et filtrer des articles dans le catalogue](#uc-06--rechercher-et-filtrer-des-articles-dans-le-catalogue)
   - [UC-07 : Consulter la fiche détail d'un produit et le profil vendeur](#uc-07--consulter-la-fiche-détail-dun-produit-et-le-profil-vendeur)
4. [Module 3 : Messagerie Temps Réel (WebSocket / STOMP)](#4-module-3--messagerie-temps-réel-websocket--stomp)
   - [UC-08 : Contacter un vendeur et échanger par messagerie instantanée](#uc-08--contacter-un-vendeur-et-échanger-par-messagerie-instantanée)
5. [Module 4 : Commandes, Paiement Mobile (1% & Escrow) & Livraison](#5-module-4--commandes-paiement-mobile-1--escrow--livraison)
   - [UC-09 : Passer une commande et choisir le mode de livraison](#uc-09--passer-une-commande-et-choisir-le-mode-de-livraison)
   - [UC-10 : Effectuer le paiement Mobile Money (Wave, Orange Money, Free Money) & Séquestre (Escrow)](#uc-10--effectuer-le-paiement-mobile-money-wave-orange-money-free-money--séquestre-escrow)
   - [UC-11 : Traiter la commande, remettre l'article et suivre les 5 statuts de livraison](#uc-11--traiter-la-commande-remettre-larticle-et-suivre-les-5-statuts-de-livraison)
   - [UC-12 : Confirmer la réception de l'article et déclencher le déblocage des fonds](#uc-12--confirmer-la-réception-de-larticle-et-déclencher-le-déblocage-des-fonds)
6. [Module 5 : Confiance, Évaluations & Signalements](#6-module-5--confiance-évaluations--signalements)
   - [UC-13 : Évaluer le vendeur (Note de 1 à 5 et avis)](#uc-13--évaluer-le-vendeur-note-de-1-à-5-et-avis)
   - [UC-14 : Signaler un article ou un utilisateur](#uc-14--signaler-un-article-ou-un-utilisateur)
7. [Module 6 : Back-Office Administrateur & Supervision](#7-module-6--back-office-administrateur--supervision)
   - [UC-15 : Consulter le Dashboard statistique et le suivi des commissions (1%)](#uc-15--consulter-le-dashboard-statistique-et-le-suivi-des-commissions-1)
   - [UC-16 : Administrer les utilisateurs (Recherche, Consultation, Suspension, Réactivation)](#uc-16--administrer-les-utilisateurs-recherche-consultation-suspension-réactivation)
   - [UC-17 : Administrer le catalogue (Modération des annonces & CRUD Catégories)](#uc-17--administrer-le-catalogue-modération-des-annonces--crud-catégories)
   - [UC-18 : Superviser les commandes/paiements et traiter les signalements & litiges](#uc-18--superviser-les-commandespaiements-et-traiter-les-signalements--litiges)

---

## 1. Matrice Récapitulative des Cas d'Utilisation (UC-01 à UC-18)

| ID | Intitulé du Cas d'Utilisation | Acteur Primaire | Acteurs Secondaires | Priorité V1 | Relations UML |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01** | S'inscrire et vérifier son compte par OTP SMS | Visiteur | Passerelle SMS OTP | Critique | `«include»` Validation OTP & Choix Pays, `«extend»` Email |
| **UC-02** | Se connecter, se déconnecter et réinitialiser son MDP | Visiteur / Utilisateur | Passerelle SMS OTP | Critique | `«extend»` Mot de passe oublié (`«include»` OTP) |
| **UC-03** | Gérer son profil, sa photo et ses adresses | Utilisateur (`ROLE_USER`) | Cloud Storage | Haute | `«extend»` Upload photo de profil |
| **UC-04** | Créer et publier une annonce | Vendeur (`ROLE_USER`) | Cloud Storage | Critique | `«include»` Upload 1..N photos |
| **UC-05** | Modifier, désactiver, réactiver ou supprimer une annonce | Vendeur (`ROLE_USER`) | Cloud Storage | Haute | — |
| **UC-06** | Rechercher et filtrer des articles dans le catalogue | Acheteur / Visiteur | — | Critique | `«extend»` Filtres V1 (Catégorie, Prix, Taille, État, Pays) |
| **UC-07** | Consulter la fiche détail d'un produit | Acheteur / Visiteur | — | Critique | Point d'extension vers `UC-08` et `UC-09` |
| **UC-08** | Contacter un vendeur et échanger en temps réel | Acheteur & Vendeur | Broker STOMP / Push | Critique | `«extend»` depuis `UC-07` |
| **UC-09** | Passer une commande et choisir le mode de livraison | Acheteur (`ROLE_USER`) | — | Critique | `«include»` Choix livraison & `UC-10` Paiement |
| **UC-10** | Payer par Mobile Money (1% frais) & Séquestre Escrow | Acheteur (`ROLE_USER`) | Wave / Orange Money / Free | Critique | `«include»` dans `UC-09` |
| **UC-11** | Préparer, remettre et suivre la livraison (5 statuts) | Vendeur & Acheteur | Service Notifications | Critique | — |
| **UC-12** | Confirmer la réception et libérer les fonds (Escrow) | Acheteur (`ROLE_USER`) | Prestataire Paiement | Critique | Point d'extension vers `UC-13` |
| **UC-13** | Évaluer le vendeur (Note de 1 à 5 et commentaire) | Acheteur (`ROLE_USER`) | Vendeur | Haute | `«extend»` depuis `UC-12` |
| **UC-14** | Signaler un article ou un utilisateur | Utilisateur (`ROLE_USER`) | Back-Office Admin | Haute | — |
| **UC-15** | Consulter le Dashboard KPI et les commissions | Administrateur (`ROLE_ADMIN`) | — | Haute | `«include»` Vérification `ROLE_ADMIN` |
| **UC-16** | Gérer les utilisateurs (Suspension / Réactivation) | Administrateur (`ROLE_ADMIN`) | — | Haute | `«include»` Vérification `ROLE_ADMIN` |
| **UC-17** | Modérer les annonces et gérer les catégories | Administrateur (`ROLE_ADMIN`) | — | Haute | `«include»` Vérification `ROLE_ADMIN` |
| **UC-18** | Superviser les transactions et arbitrer les litiges | Administrateur (`ROLE_ADMIN`) | Prestataire Paiement | Critique | `«include»` Vérification `ROLE_ADMIN` |

---

## 2. Module 1 : Authentification, OTP SMS & Gestion de Compte

### UC-01 : S'inscrire et vérifier son compte par OTP SMS

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-01** |
| **Titre** | S'inscrire sur ReVibe FliP et activer son compte via vérification OTP SMS |
| **Référence CDC** | Sections 4.1 et 4.2 (Inscription & Vérification OTP) |
| **Objectif métier** | Permettre à un visiteur de créer un compte sécurisé rattaché à un numéro de téléphone vérifié d'un pays africain (Sénégal en V1). |
| **Acteur primaire** | **Visiteur** (Futur Acheteur / Vendeur) |
| **Acteurs secondaires** | **Passerelle SMS OTP** (Système externe d'envoi de SMS) |
| **Relations UML** | - `«include»` : Sélectionner le pays de résidence et adapter l'indicatif téléphonique<br>- `«include»` : Valider le code OTP par SMS<br>- `«extend»` : Renseigner une adresse email (facultatif) |
| **Déclencheur** | Le visiteur clique sur le bouton « S'inscrire / Créer un compte » sur l'application Web ou Mobile. |
| **Préconditions** | 1. Le visiteur dispose d'un numéro de téléphone mobile actif.<br>2. La liste des pays africains actifs (dont le Sénégal `+221`) est chargée en base (`COUNTRIES`). |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche le formulaire d'inscription et propose la liste des pays africains.<br>**2.** Le visiteur sélectionne son pays de résidence (ex: Sénégal) ; le système adapte automatiquement l'indicatif téléphonique (`+221`).<br>**3.** Le visiteur saisit son **Prénom**, son **Nom**, son **Numéro de téléphone**, éventuellement son **Adresse email**, ainsi que son **Mot de passe** et sa **Confirmation de mot de passe**, puis valide.<br>**4.** Le système vérifie la conformité des champs, s'assure que le numéro de téléphone n'est pas déjà inscrit, et hache le mot de passe avec `BCrypt`.<br>**5.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système enregistre l'utilisateur en base avec le statut `PENDING_OTP` (`phone_verified = false`) et crée une entrée `OtpVerification` (code haché à 6 chiffres, durée de validité : 5 minutes).<br>&nbsp;&nbsp;&nbsp;• Le système sollicite la **Passerelle SMS** pour envoyer le code OTP par SMS au numéro indiqué.<br>**6.** Le système affiche l'écran de saisie du code OTP.<br>**7.** Le visiteur saisit le code OTP reçu par SMS et valide.<br>**8.** Le système vérifie que le code correspond et n'est pas expiré.<br>**9.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système passe le statut du compte à `ACTIVE` (`phone_verified = true`, rôle `ROLE_USER`).<br>&nbsp;&nbsp;&nbsp;• Le système génère un jeton d'authentification `JWT` (Access Token + Refresh Token).<br>**10.** Le système redirige l'utilisateur connecté vers la page d'accueil de la marketplace. |
| **Scénarios Alternatifs (`alt` / `opt`)** | **A1 — Adresse email facultative renseignée (`opt` à l'étape 3)** :<br>1. Le visiteur saisit une adresse email.<br>2. Le système vérifie son format et son unicité en base avant de poursuivre à l'étape 4.<br><br>**A2 — Demande de renvoi d'un nouveau code OTP (`alt` à l'étape 7)** :<br>1. Le visiteur n'a pas reçu le SMS après 60 secondes et clique sur « Renvoyer le code ».<br>2. Le système invalide l'ancien code, génère un nouveau code OTP de 6 chiffres et relance l'étape 5. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Numéro de téléphone ou Email déjà utilisé (Étape 4)** :<br>Le système rejette la demande (`HTTP 409 Conflict`) et affiche : *« Ce numéro de téléphone est déjà associé à un compte. »*<br><br>**E2 — Mot de passe et confirmation différents ou trop faibles (Étape 4)** :<br>Le système renvoie `HTTP 400 Bad Request` et indique les règles de sécurité attendues.<br><br>**E3 — Code OTP erroné ou expiré (Étape 8)** :<br>Le système incrémente le compteur d'essais (`attempts`). Si `attempts < 3`, le système invite l'utilisateur à réessayer. Si `attempts == 3` ou si le délai de 5 minutes est dépassé, le code est verrouillé (`HTTP 429 Too Many Requests`) et l'utilisateur doit demander un nouveau code. |
| **Postconditions (Fin)** | - **En cas de succès** : Le compte `User` est créé en base à l'état `ACTIVE`, le téléphone est certifié, le mot de passe est haché, et l'utilisateur possède un `JWT` valide.<br>- **En cas d'échec** : Le compte reste en `PENDING_OTP` (non utilisable pour acheter/vendre) ou n'est pas créé. |
| **Compléments & Règles Métier** | - **RG-AUTH-01** : Le mot de passe n'est jamais stocké ni journalisé en clair (`BCryptPasswordEncoder`).<br>- **RG-AUTH-02** : Le numéro est normalisé au format international `E.164` (ex: `+221771234567`). |

---

### UC-02 : Se connecter, se déconnecter et réinitialiser son mot de passe

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-02** |
| **Titre** | Connexion par identifiants, déconnexion et récupération de mot de passe oublié |
| **Référence CDC** | Section 4.3 (Connexion et profil) & Section 16 (Sécurité JWT) |
| **Objectif métier** | Authentifier un utilisateur inscrit pour lui donner accès aux fonctionnalités sécurisées selon son rôle (`ROLE_USER` ou `ROLE_ADMIN`). |
| **Acteur primaire** | **Utilisateur** (`ROLE_USER` ou `ROLE_ADMIN`) |
| **Acteurs secondaires** | **Passerelle SMS OTP** (en cas de mot de passe oublié) |
| **Déclencheur** | L'utilisateur accède à l'écran de connexion ou clique sur « Se déconnecter ». |
| **Préconditions** | L'utilisateur possède un compte existant en base de données. |
| **Scénario Nominal (Flux Principal)** | **1.** L'utilisateur sélectionne son pays (indicatif), saisit son numéro de téléphone (ou email) et son mot de passe.<br>**2.** Le système recherche le compte correspondant et vérifie le hachage `BCrypt` du mot de passe.<br>**3.** Le système vérifie que le statut du compte est `ACTIVE` et que `phone_verified == true`.<br>**4.** Le système génère un token `JWT` contenant l'identifiant et le rôle (`ROLE_USER` ou `ROLE_ADMIN`) et journalise la connexion.<br>**5.** Le client Web/Mobile stocke le token de manière sécurisée et redirige l'utilisateur vers son espace. |
| **Scénarios Alternatifs (`alt` / `opt`)** | **A1 — Mot de passe oublié (`extend` à l'étape 1)** :<br>1. L'utilisateur clique sur « Mot de passe oublié » et saisit son numéro de téléphone.<br>2. Le système génère et envoie un code OTP par SMS (`purpose = RESET_PASSWORD`).<br>3. L'utilisateur saisit le code OTP reçu ainsi que son nouveau mot de passe et sa confirmation.<br>4. Le système valide l'OTP, met à jour le `password_hash` en base et confirme la réinitialisation.<br><br>**A2 — Déconnexion** :<br>1. L'utilisateur clique sur « Se déconnecter ».<br>2. Le système révoque la session / supprime le token côté client et ferme la connexion WebSocket STOMP active. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Identifiants incorrects (Étape 2)** :<br>Le système renvoie `HTTP 401 Unauthorized` avec un message générique (*« Identifiants incorrects »*) pour éviter l'énumération de comptes.<br><br>**E2 — Compte suspendu par l'administrateur (Étape 3)** :<br>Si `status == SUSPENDED`, le système refuse l'accès (`HTTP 403 Forbidden`) et informe l'utilisateur que son compte a été suspendu.<br><br>**E3 — Compte non vérifié par OTP (Étape 3)** :<br>Si `status == PENDING_OTP`, le système redirige l'utilisateur vers l'écran de validation OTP (`UC-01`). |
| **Postconditions (Fin)** | L'utilisateur dispose d'une session authentifiée par `JWT` (ou sa session est fermée en cas de déconnexion). |
| **Compléments & Règles Métier** | - **RG-SEC-01** : Tous les endpoints protégés exigent l'en-tête `Authorization: Bearer <JWT>`. |

---

### UC-03 : Gérer son profil, sa photo et ses adresses

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-03** |
| **Titre** | Consulter et modifier son profil personnel, sa photo et son carnet d'adresses |
| **Référence CDC** | Section 4.3 (Modification des informations personnelles, Photo de profil, Consultation annonces/commandes/évaluations) |
| **Objectif métier** | Permettre à l'utilisateur de maintenir ses informations à jour et de suivre toute son activité sur la plateforme. |
| **Acteur primaire** | **Utilisateur Authentifié** (`ROLE_USER`) |
| **Acteurs secondaires** | **Stockage Cloud Images** (S3 / Cloudinary) |
| **Déclencheur** | L'utilisateur ouvre la rubrique « Mon Profil » sur le Web ou l'application Mobile. |
| **Préconditions** | L'utilisateur est connecté avec un compte `ACTIVE`. |
| **Scénario Nominal (Flux Principal)** | **1.** Le système récupère et affiche les informations du profil (Prénom, Nom, Téléphone, Pays, Email, Photo de profil, Note moyenne, Nombre d'avis) ainsi que les onglets : *Mes Annonces*, *Mes Commandes*, *Mes Évaluations*, *Mes Adresses*.<br>**2.** L'utilisateur modifie ses informations personnelles (Prénom, Nom, Email, ou ajoute/modifie une adresse de livraison) et éventuellement sélectionne une nouvelle photo de profil.<br>**3.** Si une photo est jointe, le système l'uploade vers le **Stockage Cloud** et récupère l'URL sécurisée.<br>**4.** Le système valide les données et met à jour les entités `User` et `Address` en base MySQL.<br>**5.** Le système confirme la mise à jour et rafraîchit l'affichage du profil. |
| **Scénarios Alternatifs (`alt`)** | **A1 — Changement de mot de passe depuis le profil** : L'utilisateur saisit son mot de passe actuel et son nouveau mot de passe ; le système vérifie l'ancien avant de hacher le nouveau. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Format ou taille d'image invalide (Étape 3)** : Si le fichier dépasse la taille maximale (ex: 5 Mo) ou n'est pas une image (`JPG/PNG/WEBP`), le système renvoie `HTTP 400 Bad Request`. |
| **Postconditions (Fin)** | Les informations du profil, la photo et les adresses sont persistées et visibles. |
| **Compléments & Règles Métier** | - Le changement de numéro de téléphone principal nécessite une re-vérification par code OTP SMS. |

---

## 3. Module 2 : Marketplace, Catalogue & Gestion des Annonces

### UC-04 : Créer et publier une annonce

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-04** |
| **Titre** | Créer une annonce de seconde main et la publier sur la marketplace |
| **Référence CDC** | Sections 5.1 et 5.2 (Création et Gestion des annonces) |
| **Objectif métier** | Permettre à un vendeur de mettre en vente un article (vêtement, chaussure, accessoire) avec photos et caractéristiques complètes. |
| **Acteur primaire** | **Vendeur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Stockage Cloud Images** (S3 / Cloudinary) |
| **Relations UML** | `«include»` : Uploader une ou plusieurs photos obligatoires |
| **Déclencheur** | Le vendeur clique sur « Vendre un article / Publier une annonce ». |
| **Préconditions** | 1. Le vendeur est connecté et son compte est `ACTIVE`.<br>2. Des catégories actives existent en base de données (`CATEGORIES`). |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche le formulaire de création d'annonce.<br>**2.** Le vendeur sélectionne **une ou plusieurs photos** de l'article (obligatoire).<br>**3.** Le vendeur renseigne les champs obligatoires : **Titre**, **Catégorie**, **Prix** (en FCFA / XOF), **État** (`NEW_WITH_TAGS`, `LIKE_NEW`, `GOOD`, `FAIR`) et **Description**.<br>**4.** Le vendeur renseigne les informations complémentaires prévues : **Taille**, **Marque**, **Couleur** et **Localisation** (Ville/Quartier).<br>**5.** Le vendeur clique sur « Publier l'annonce ».<br>**6.** Le système valide les données entrantes (`Jakarta Bean Validation`).<br>**7.** *En parallèle (`par`)* : Le système compresse et téléverse les N photos vers le **Stockage Cloud** et récupère leurs URLs.<br>**8.** Le système enregistre l'entité `Product` avec le statut `ACTIVE` et les entités `ProductImage` associées (en marquant la première comme image principale `is_main = true`).<br>**9.** Le système retourne la fiche de l'annonce publiée (`HTTP 201 Created`). |
| **Scénarios Alternatifs (`alt`)** | **A1 — Enregistrement en brouillon (`DRAFT` à l'étape 5)** :<br>1. Le vendeur clique sur « Enregistrer comme brouillon ».<br>2. Le système sauvegarde l'annonce avec le statut `DRAFT` (non visible dans le catalogue public). |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Aucune photo fournie ou champ obligatoire manquant (Étape 6)** :<br>Le système bloque la publication (`HTTP 400 Bad Request`) et indique qu'au moins une photo et un prix strictement positif sont exigés.<br><br>**E2 — Échec du service de stockage d'images (Étape 7)** :<br>La transaction en base est annulée (rollback) et le système affiche un message d'erreur technique (`HTTP 503`). |
| **Postconditions (Fin)** | L'annonce est persistée en base au statut `ACTIVE` (ou `DRAFT`), illustrée par ses photos, et immédiatement indexée dans le catalogue de recherche. |
| **Compléments & Règles Métier** | - **RG-PROD-01** : Les statuts recommandés par le cahier des charges sont `DRAFT`, `ACTIVE`, `SOLD`, `INACTIVE` (complétés par `RESERVED` durant le paiement d'une commande). |

---

### UC-05 : Gérer ses annonces (Modifier, Désactiver, Réactiver, Supprimer)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-05** |
| **Titre** | Modifier, désactiver, réactiver ou supprimer une annonce existante |
| **Référence CDC** | Section 5.2 (Gestion des annonces) |
| **Objectif métier** | Donner au vendeur le contrôle complet sur le cycle de vie de ses annonces. |
| **Acteur primaire** | **Vendeur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Stockage Cloud Images** |
| **Déclencheur** | Le vendeur sélectionne l'une de ses annonces depuis son espace « Mes Annonces ». |
| **Préconditions** | 1. L'utilisateur connecté est bien le propriétaire (`seller_id`) de l'annonce.<br>2. L'annonce n'est ni vendue (`SOLD`), ni engagée dans une commande en cours (`RESERVED`). |
| **Scénario Nominal (Flux Principal — Modification)** | **1.** Le vendeur choisit « Modifier l'annonce ».<br>**2.** Le système affiche les données actuelles de l'annonce.<br>**3.** Le vendeur modifie le prix, la description, les caractéristiques ou les photos et valide.<br>**4.** Le système vérifie la propriété (`seller_id == currentUserId`), met à jour `Product` et `ProductImage`, et horodate `updated_at`. |
| **Scénarios Alternatifs (`alt`)** | **A1 — Publier un brouillon (`DRAFT` → `ACTIVE`)** : Le vendeur vérifie que tous les champs obligatoires sont remplis et passe l'annonce en ligne.<br>**A2 — Désactiver une annonce (`ACTIVE` → `INACTIVE`)** : L'annonce est retirée temporairement du catalogue public sans être supprimée.<br>**A3 — Réactiver une annonce (`INACTIVE` → `ACTIVE`)** : L'annonce redevient visible dans le catalogue.<br>**A4 — Supprimer une annonce** : L'annonce est supprimée (ou marquée supprimée) et retirée définitivement de l'affichage. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Tentative de modification par un tiers non propriétaire** : Le système renvoie `HTTP 403 Forbidden`.<br>**E2 — Annonce déjà vendue (`SOLD`) ou en cours de commande (`RESERVED`)** : Le système interdit la modification du prix ou la suppression (`HTTP 409 Conflict`). |
| **Postconditions (Fin)** | Le statut ou le contenu de l'annonce est mis à jour en base et reflété immédiatement dans le catalogue. |
| **Compléments & Règles Métier** | - Une annonce `INACTIVE` ou `DRAFT` n'apparaît jamais dans les résultats de recherche des acheteurs. |

---

### UC-06 : Rechercher et filtrer des articles dans le catalogue

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-06** |
| **Titre** | Parcourir le catalogue, rechercher par mot-clé et appliquer les filtres V1 |
| **Référence CDC** | Section 6 (Catalogue, recherche et filtres) |
| **Objectif métier** | Permettre aux acheteurs de trouver rapidement les articles disponibles correspondant à leurs critères. |
| **Acteur primaire** | **Acheteur** ou **Visiteur** |
| **Relations UML** | `«extend»` : Filtrer par catégorie, prix min/max, taille, état et pays/localisation du vendeur |
| **Déclencheur** | L'utilisateur ouvre la page Catalogue ou saisit une recherche. |
| **Préconditions** | Aucune (accessible publiquement sur Web et Mobile). |
| **Scénario Nominal (Flux Principal)** | **1.** L'utilisateur accède au catalogue.<br>**2.** *En parallèle (`par`)* : Le système interroge la base pour récupérer la liste paginée des annonces ayant le statut `ACTIVE` et le nombre total de résultats.<br>**3.** Le système affiche sous forme de grille les cartes produits contenant : **Photo principale**, **Titre**, **Prix**, **État**, **Localisation** et **Nom/Note du vendeur**.<br>**4.** L'utilisateur saisit un **mot-clé** dans la barre de recherche.<br>**5.** Le système filtre les articles actifs dont le titre, la description ou la marque correspondent au mot-clé. |
| **Scénarios Alternatifs (`opt` / `alt`)** | **A1 — Application des Filtres V1 (`extend` à l'étape 4)** :<br>L'utilisateur affine sa recherche en combinant un ou plusieurs filtres V1 :<br>• **Catégorie** (ex: Vêtements, Chaussures, Accessoires)<br>• **Fourchette de prix** (Prix minimum / Prix maximum)<br>• **Taille**<br>• **État de l'article**<br>• **Pays / Localisation du vendeur**<br>Le système exécute la requête multicritères et rafraîchit la liste.<br><br>**A2 — Aucun résultat trouvé** :<br>Le système affiche un écran vide invitant l'utilisateur à élargir ses filtres. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Prix minimum supérieur au prix maximum** : Le système signale l'incohérence des bornes de prix (`HTTP 400`). |
| **Postconditions (Fin)** | La liste des articles disponibles correspondant aux critères est affichée à l'utilisateur. |
| **Compléments & Règles Métier** | - Seules les annonces dont `ProductStatus == ACTIVE` et dont le vendeur a un compte `ACTIVE` sont retournées. |

---

### UC-07 : Consulter la fiche détail d'un produit et le profil vendeur

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-07** |
| **Titre** | Afficher la fiche détaillée d'un article et les informations de confiance du vendeur |
| **Référence CDC** | Section 7 (Fiche détail produit) |
| **Objectif métier** | Fournir à l'acheteur toutes les informations visuelles, descriptives et de réputation nécessaires avant de contacter le vendeur ou d'acheter. |
| **Acteur primaire** | **Acheteur** ou **Visiteur** |
| **Relations UML** | Point d'extension pour `UC-08` (Contacter le vendeur), `UC-09` (Acheter) et `UC-14` (Signaler l'annonce). |
| **Déclencheur** | L'utilisateur clique sur une carte produit depuis le catalogue. |
| **Préconditions** | L'article existe en base de données. |
| **Scénario Nominal (Flux Principal)** | **1.** Le système charge les données complètes de l'annonce et de son vendeur.<br>**2.** Le système affiche :<br>&nbsp;&nbsp;&nbsp;• La **galerie de photos** (carrousel zoomable)<br>&nbsp;&nbsp;&nbsp;• Le **titre** et le **prix**<br>&nbsp;&nbsp;&nbsp;• La **description** complète<br>&nbsp;&nbsp;&nbsp;• L'**état**, la **taille**, la **marque**, la **couleur** et la **catégorie**<br>&nbsp;&nbsp;&nbsp;• La **localisation**<br>&nbsp;&nbsp;&nbsp;• Les **informations du vendeur** avec sa **note moyenne** (sur 5) et son **nombre d'évaluations**<br>**3.** Le système présente les deux boutons d'actions principales : **« Contacter le vendeur »** et **« Acheter »** (ainsi que l'option « Signaler »). |
| **Scénarios Alternatifs (`alt`)** | **A1 — Utilisateur non connecté cliquant sur « Contacter » ou « Acheter »** :<br>Le système redirige le visiteur vers l'écran de connexion/inscription (`UC-01` / `UC-02`) avant de reprendre l'action. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Annonce indisponible ou supprimée** : Le système affiche une erreur `HTTP 404 Not Found` ou indique que l'article a déjà été vendu (`SOLD`). |
| **Postconditions (Fin)** | L'acheteur a pris connaissance des détails de l'article et peut engager une conversation ou un achat. |
| **Compléments & Règles Métier** | - Un vendeur qui consulte sa propre annonce voit les boutons d'édition (`UC-05`) à la place du bouton « Acheter ». |

---

## 4. Module 3 : Messagerie Temps Réel (WebSocket / STOMP)

### UC-08 : Contacter un vendeur et échanger par messagerie instantanée

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-08** |
| **Titre** | Ouvrir une conversation et échanger des messages texte en temps réel |
| **Référence CDC** | Section 8 (Messagerie) & Section 14 (Notifications) |
| **Objectif métier** | Permettre à l'acheteur et au vendeur de discuter d'un article en temps réel via `WebSocket / STOMP` avec suivi de lecture. |
| **Acteur primaire** | **Acheteur** & **Vendeur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Broker WebSocket STOMP**, **Service de Notifications** |
| **Déclencheur** | L'acheteur clique sur « Contacter le vendeur » depuis une fiche produit ou ouvre sa liste de conversations. |
| **Préconditions** | L'acheteur et le vendeur sont authentifiés (`ROLE_USER`) et ont un compte `ACTIVE`. |
| **Scénario Nominal (Flux Principal)** | **1.** L'acheteur clique sur « Contacter le vendeur » sur la fiche d'une annonce.<br>**2.** *Optionnel (`opt`)* : S'il n'existe pas encore de conversation entre cet acheteur et ce vendeur pour ce produit, le système crée une nouvelle entité `Conversation`. Sinon, il charge la conversation existante et son historique.<br>**3.** L'acheteur saisit un message texte et clique sur « Envoyer ».<br>**4.** Le client envoie la trame STOMP au backend (`/app/chat.send`).<br>**5.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système enregistre l'entité `Message` en base (`sent_at = now()`, `is_read = false`) et met à jour `Conversation.last_message_at`.<br>&nbsp;&nbsp;&nbsp;• Le broker STOMP pousse instantanément le message au vendeur sur sa file privée (`/user/{sellerId}/queue/messages`).<br>&nbsp;&nbsp;&nbsp;• Le système génère une notification de type `NEW_MESSAGE` pour le vendeur.<br>**6.** Le vendeur ouvre la conversation et consulte le message.<br>**7.** Le système met à jour le statut des messages à `is_read = true` (`read_at = now()`) et notifie en temps réel le client de l'acheteur de l'accusé de lecture (« Lu ✓✓ »). |
| **Scénarios Alternatifs (`alt`)** | **A1 — Consultation de la boîte de réception** :<br>L'utilisateur ouvre l'onglet « Messagerie » ; le système affiche la liste de toutes ses conversations triées par date du dernier message avec un badge indiquant le nombre de messages non lus. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Message vide ou dépassant la taille maximale** : Le système rejette l'envoi.<br>**E2 — Tentative d'un vendeur de se contacter lui-même** : Action bloquée par le système (`HTTP 400`).<br>**E3 — Perte temporaire de connexion WebSocket** : Le client bascule en reconnexion automatique STOMP et synchronise l'historique via REST. |
| **Postconditions (Fin)** | Les messages sont sauvegardés, horodatés, délivrés en temps réel et leur état `lu/non lu` est synchronisé. |
| **Compléments & Règles Métier** | - **Technologie imposée (Section 8)** : `WebSocket + STOMP` côté Spring Boot avec authentification du canal par token `JWT`. |

---

## 5. Module 4 : Commandes, Paiement Mobile (1% & Escrow) & Livraison

### UC-09 : Passer une commande et choisir le mode de livraison

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-09** |
| **Titre** | Initier une commande, choisir le mode de livraison et valider le récapitulatif financier |
| **Référence CDC** | Section 9 (Commandes), Section 10 (Paiement : frais 1%) & Section 11.1 (Modes de livraison V1) |
| **Objectif métier** | Créer une commande structurée distinguant clairement le prix de l'article, les frais de validation de 1 % et les frais de livraison. |
| **Acteur primaire** | **Acheteur** (`ROLE_USER`) |
| **Relations UML** | - `«include»` : Choisir le mode de livraison (`HOME_DELIVERY` ou `HAND_DELIVERY`)<br>- `«include»` : Effectuer le paiement Mobile Money (`UC-10`) |
| **Déclencheur** | L'acheteur clique sur le bouton « Acheter » depuis la fiche détail d'un produit. |
| **Préconditions** | 1. L'acheteur est connecté (`ACTIVE`) et n'est pas le vendeur de l'article.<br>2. L'annonce est au statut `ACTIVE`. |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche l'écran de commande avec les informations du produit.<br>**2.** L'acheteur choisit son **mode de livraison V1** :<br>&nbsp;&nbsp;&nbsp;• **Livraison à domicile** (`HOME_DELIVERY`)<br>&nbsp;&nbsp;&nbsp;• **Remise en main propre** (`HAND_DELIVERY`)<br>**3.** *Optionnel (`opt`)* : Si l'acheteur choisit `HOME_DELIVERY`, il sélectionne ou saisit son adresse de livraison complète (Ville, Quartier, Détails, Téléphone du destinataire). Si `HAND_DELIVERY`, le lieu de rencontre convenu est précisé.<br>**4.** Le système calcule et affiche le **Récapitulatif Financier détaillé** :<br>&nbsp;&nbsp;&nbsp;• **Prix du produit** (`item_price`)<br>&nbsp;&nbsp;&nbsp;• **Frais de validation de transaction (1 %)** (`validation_fee = item_price × 0.01`)<br>&nbsp;&nbsp;&nbsp;• **Frais de livraison** (`delivery_fee`, `0 FCFA` si remise en main propre)<br>&nbsp;&nbsp;&nbsp;• **Montant total à payer** (`total_amount = item_price + validation_fee + delivery_fee`)<br>**5.** L'acheteur valide le récapitulatif et clique sur « Procéder au paiement ».<br>**6.** Le système verrouille l'article en base (`SELECT ... FOR UPDATE`) pour éviter tout achat simultané.<br>**7.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système passe temporairement le statut de l'annonce à `RESERVED`.<br>&nbsp;&nbsp;&nbsp;• Le système crée l'entité `Order` avec un numéro unique (ex: `RVF-2026-00001`) au statut `PENDING_PAYMENT`.<br>&nbsp;&nbsp;&nbsp;• Le système crée l'entité `Delivery` rattachée au statut initial `PENDING`.<br>**8.** Le système enchaîne immédiatement sur le cas d'utilisation **UC-10 (Paiement Mobile Money)**. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Article déjà réservé ou vendu entre-temps (Étape 6)** :<br>Le système renvoie `HTTP 409 Conflict` et informe l'acheteur que l'article vient d'être acheté par un autre utilisateur.<br><br>**E2 — Adresse manquante pour une livraison à domicile (Étape 3)** :<br>Le système exige la saisie d'une adresse valide avant d'afficher le récapitulatif. |
| **Postconditions (Fin)** | La commande est créée avec un numéro unique, les 3 composantes financières sont enregistrées séparément en base, l'annonce est réservée (`RESERVED`) et le processus de paiement est lancé. |
| **Compléments & Règles Métier** | - **RG-FIN-01 (Section 10)** : Le système distingue obligatoirement en base de données `item_price`, `validation_fee` (1 %) et `delivery_fee`. |

---

### UC-10 : Effectuer le paiement Mobile Money (Wave, Orange Money, Free Money) & Séquestre (Escrow)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-10** |
| **Titre** | Payer une commande via Mobile Money et sécuriser les fonds en séquestre (Escrow) |
| **Référence CDC** | Section 10 (Paiement : Wave, Orange Money, Free Money, Frais 1%, Escrow) & Section 14 (Notifications) |
| **Objectif métier** | Encaisser le paiement réel de l'acheteur via un prestataire Mobile Money adapté au Sénégal et bloquer les fonds jusqu'à la confirmation de réception. |
| **Acteur primaire** | **Acheteur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Prestataire Paiement Mobile** (Wave, Orange Money, Free Money), **Vendeur**, **Service Notifications** |
| **Déclencheur** | Validation du récapitulatif de commande à la fin de **UC-09**. |
| **Préconditions** | Une commande existe au statut `PENDING_PAYMENT`. |
| **Scénario Nominal (Flux Principal)** | **1.** L'acheteur sélectionne son moyen de paiement mobile parmi **Wave**, **Orange Money** ou **Free Money**.<br>**2.** Le système crée une entité `Payment` au statut `INITIATED` avec une référence de transaction unique et appelle l'API du prestataire retenu.<br>**3.** Le prestataire retourne une URL de paiement (DeepLink Wave ou prompt USSD Orange Money / Free Money).<br>**4.** L'acheteur confirme la transaction sur son téléphone avec son code secret Mobile Money.<br>**5.** Le prestataire de paiement envoie un **Webhook sécurisé (Callback HTTPS signé HMAC)** au backend Spring Boot confirmant le succès du paiement.<br>**6.** Le système vérifie l'authenticité de la signature HMAC, l'idempotence de la transaction et la concordance du montant.<br>**7.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système met à jour `Payment` au statut `AUTHORIZED_ESCROW` (`is_escrow_held = true`, `paid_at = now()`).<br>&nbsp;&nbsp;&nbsp;• Le système met à jour `Order` au statut `PAID` (`confirmed_at = now()`).<br>&nbsp;&nbsp;&nbsp;• Le système envoie une notification `PAYMENT_CONFIRMED` à l'acheteur et une notification `ORDER_CREATED` au vendeur.<br>**8.** L'acheteur voit l'écran « Commande confirmée » et peut accéder au suivi de sa commande. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Échec du paiement Mobile Money (Solde insuffisant, annulation par l'acheteur ou expiration du délai)** :<br>1. Le prestataire notifie l'échec (`FAILED` ou `CANCELLED`).<br>2. *En parallèle (`par`)* : Le système passe `Payment.status = FAILED`, passe `Order.status = CANCELLED`, et remet automatiquement l'annonce à `Product.status = ACTIVE` pour qu'elle soit à nouveau achetable.<br>3. L'acheteur est informé de l'échec et peut relancer une tentative.<br><br>**E2 — Signature Webhook invalide (Tentative de fraude)** :<br>Le système rejette l'appel (`HTTP 401/403`), ne modifie aucun statut et journalise une alerte de sécurité critique. |
| **Postconditions (Fin)** | - **Succès** : Le paiement est encaissé et bloqué en séquestre (`AUTHORIZED_ESCROW`), la commande est confirmée (`PAID`), et le vendeur est notifié de préparer l'article.<br>- **Échec** : Aucune somme n'est débitée et l'article redevient disponible (`ACTIVE`). |
| **Compléments & Règles Métier** | - **RG-PAY-01 (Section 10)** : Un paiement simulé ne doit jamais être considéré comme un paiement de production ; l'architecture utilise le port `PaymentGatewayPort` connecté aux API réelles du prestataire retenu. |

---

### UC-11 : Traiter la commande, remettre l'article et suivre les 5 statuts de livraison

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-11** |
| **Titre** | Préparer la commande, remettre l'article et suivre l'évolution de la livraison |
| **Référence CDC** | Section 3.1/3.2, Section 11.2 (Statuts de livraison) & Section 14 (Notifications) |
| **Objectif métier** | Assurer la traçabilité complète de l'acheminement de l'article du vendeur jusqu'à l'acheteur à travers les 5 statuts normalisés. |
| **Acteur primaire** | **Vendeur** & **Acheteur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Service de Notifications** |
| **Déclencheur** | Réception par le vendeur de la notification de commande payée (`Order.status == PAID`). |
| **Préconditions** | La commande est au statut `PAID` et l'entité `Delivery` est au statut initial `PENDING`. |
| **Scénario Nominal (Flux Principal)** | **1.** Le vendeur consulte le détail de la commande reçue et prépare l'article (`Order.status = PREPARING`).<br>**2.** *En boucle (`loop`) sur la progression logistique (Section 11.2)* :<br>&nbsp;&nbsp;&nbsp;• **Étape 2a (`PICKED_UP`)** : L'article est pris en charge pour livraison (ou remis au départ) → `Delivery.status = PICKED_UP` (`Order.status = IN_DELIVERY`).<br>&nbsp;&nbsp;&nbsp;• **Étape 2b (`IN_TRANSIT`)** : L'article est en cours d'acheminement → `Delivery.status = IN_TRANSIT`.<br>&nbsp;&nbsp;&nbsp;• **Étape 2c (`OUT_FOR_DELIVERY`)** : L'article est en cours de livraison finale vers l'acheteur (ou au point de rendez-vous en main propre) → `Delivery.status = OUT_FOR_DELIVERY`.<br>&nbsp;&nbsp;&nbsp;• **Étape 2d (`DELIVERED`)** : L'article est remis à l'acheteur → `Delivery.status = DELIVERED` et `Order.status = DELIVERED`.<br>**3.** À chaque changement de statut (*en parallèle `par`*), le système horodate la transition en base et envoie une notification (`DELIVERY_UPDATE` puis `ORDER_DELIVERED`) à l'acheteur.<br>**4.** L'acheteur consulte en temps réel la barre de progression de sa livraison depuis son espace « Mes Commandes ». |
| **Scénarios Alternatifs (`alt`)** | **A1 — Mode Remise en main propre (`HAND_DELIVERY`)** :<br>Le vendeur et l'acheteur conviennent du rendez-vous via la messagerie (`UC-08`) ; lors de la remise physique, les statuts avancent jusqu'à `DELIVERED`. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Transition d'état illégale** : Si une requête tente de passer de `PENDING` directement à `DELIVERED` sans respecter la machine à états, ou de revenir en arrière après `DELIVERED`, le système renvoie `HTTP 400 Bad Request`. |
| **Postconditions (Fin)** | La livraison atteint le statut `DELIVERED` et le système invite l'acheteur à confirmer la réception (`UC-12`). |
| **Compléments & Règles Métier** | - **RG-DELIV-01 (Section 11.2)** : Séquence stricte : `PENDING` → `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`. La livraison inter-pays et les points relais avancés sont réservés à la V2. |

---

### UC-12 : Confirmer la réception de l'article et déclencher le déblocage des fonds

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-12** |
| **Titre** | Confirmer la bonne réception de l'article et libérer les fonds au vendeur |
| **Référence CDC** | Section 10 (Escrow) & Section 12 (Réception et évaluation) |
| **Objectif métier** | Valider que l'acheteur a bien reçu l'article conforme afin de clôturer la transaction et de verser les fonds au vendeur. |
| **Acteur primaire** | **Acheteur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Prestataire Paiement Mobile (Escrow)**, **Vendeur** |
| **Relations UML** | Point d'extension pour `UC-13` (Évaluer le vendeur) |
| **Déclencheur** | L'acheteur clique sur « Confirmer la réception de l'article » depuis le suivi de sa commande. |
| **Préconditions** | 1. L'utilisateur connecté est bien l'acheteur (`buyer_id`) de la commande.<br>2. Le paiement est en séquestre (`AUTHORIZED_ESCROW`) et la commande est en livraison/livrée (`DELIVERED`). |
| **Scénario Nominal (Flux Principal)** | **1.** L'acheteur vérifie son article et clique sur « Je confirme avoir reçu l'article ».<br>**2.** Le système demande une confirmation de sécurité à l'acheteur.<br>**3.** L'acheteur valide.<br>**4.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système passe la commande au statut final `COMPLETED` (`completed_at = now()`).<br>&nbsp;&nbsp;&nbsp;• Le système passe l'annonce au statut final `SOLD` (Vendue).<br>&nbsp;&nbsp;&nbsp;• Le système déclenche auprès du prestataire de paiement la **libération du séquestre (Escrow)** : versement du `item_price` au vendeur et conservation du `validation_fee` (1 %) par la plateforme.<br>&nbsp;&nbsp;&nbsp;• Le système met à jour `Payment.status = RELEASED_TO_SELLER` (`is_escrow_held = false`, `released_at = now()`).<br>**5.** Le système notifie le vendeur que les fonds ont été débloqués et propose immédiatement à l'acheteur d'évaluer la transaction (`UC-13`). |
| **Scénarios Alternatifs (`alt`)** | **A1 — Article non reçu ou non conforme (Ouverture d'un litige)** :<br>1. Au lieu de confirmer la réception, l'acheteur clique sur « Signaler un problème / Litige » (`UC-14`).<br>2. Le système passe la commande au statut `DISPUTED`, maintient les fonds bloqués en séquestre (`is_escrow_held = true`) et transmet le dossier au Back-Office Administrateur (`UC-18`). |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Tentative de confirmation par le vendeur lui-même** : Rejeté (`HTTP 403 Forbidden`). Seul l'acheteur (ou l'administrateur après arbitrage) peut confirmer la réception. |
| **Postconditions (Fin)** | La transaction est terminée (`Order = COMPLETED`, `Product = SOLD`, `Payment = RELEASED_TO_SELLER`) et le droit à l'évaluation est ouvert. |
| **Compléments & Règles Métier** | - Tant que la réception n'est pas confirmée, le vendeur ne peut pas retirer les fonds bloqués en séquestre. |

---

## 6. Module 5 : Confiance, Évaluations & Signalements

### UC-13 : Évaluer le vendeur (Note de 1 à 5 et avis)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-13** |
| **Titre** | Attribuer une note de 1 à 5 étoiles et un commentaire après la transaction |
| **Référence CDC** | Section 12 (Réception et évaluation) & Section 14 (Notifications) |
| **Objectif métier** | Bâtir la réputation des vendeurs sur la marketplace en calculant leur note moyenne et en publiant les avis vérifiés. |
| **Acteur primaire** | **Acheteur** (`ROLE_USER`) |
| **Acteurs secondaires** | **Vendeur**, **Service de Notifications** |
| **Relations UML** | `«extend»` depuis `UC-12` (Confirmer la réception) |
| **Déclencheur** | L'acheteur clique sur « Évaluer le vendeur » après avoir confirmé la réception. |
| **Préconditions** | 1. La commande est au statut `COMPLETED`.<br>2. Aucune évaluation n'a encore été soumise pour cette commande (`order_id` unique dans `REVIEWS`). |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche le formulaire d'évaluation.<br>**2.** L'acheteur sélectionne une **note entière de 1 à 5 étoiles** et saisit un **commentaire** texte.<br>**3.** L'acheteur valide son évaluation.<br>**4.** Le système vérifie que `1 <= rating <= 5` et que la commande appartient bien à l'acheteur.<br>**5.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système insère l'entité `Review` en base.<br>&nbsp;&nbsp;&nbsp;• Le système recalcule la **note moyenne** (`average_rating`) et incrémente le **nombre total d'avis** (`review_count`) sur l'entité `User` du vendeur.<br>&nbsp;&nbsp;&nbsp;• Le système envoie une notification `NEW_REVIEW` au vendeur.<br>**6.** Le système confirme la publication de l'avis (`HTTP 201 Created`). |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Commande non terminée (`status != COMPLETED`)** : Le système refuse le dépôt d'avis (`HTTP 400 Bad Request`).<br>**E2 — Avis déjà déposé pour cette commande** : Le système renvoie `HTTP 409 Conflict` (un seul avis autorisé par transaction).<br>**E3 — Note hors bornes (< 1 ou > 5)** : Rejet par validation (`HTTP 400`). |
| **Postconditions (Fin)** | L'avis est enregistré et la nouvelle note moyenne du vendeur est visible sur son profil et sur toutes ses fiches produits. |
| **Compléments & Règles Métier** | - Ce socle de notation V1 est conçu pour alimenter directement le futur module **Score de confiance intelligent** prévu en Version 2 (Section 19/20). |

---

### UC-14 : Signaler un article ou un utilisateur

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-14** |
| **Titre** | Soumettre un signalement concernant une annonce ou un utilisateur au Back-Office |
| **Référence CDC** | Section 13 (Signalements et litiges) |
| **Objectif métier** | Permettre aux utilisateurs de remonter tout contenu frauduleux, contrefait ou comportement abusif à l'équipe d'administration. |
| **Acteur primaire** | **Utilisateur Authentifié** (Acheteur ou Vendeur) |
| **Acteurs secondaires** | **Back-Office Administrateur** |
| **Déclencheur** | L'utilisateur clique sur « Signaler » depuis une fiche produit, un profil utilisateur ou une commande. |
| **Préconditions** | L'utilisateur est connecté (`ROLE_USER`). |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche la fenêtre de signalement et propose la liste des **6 motifs officiels (Section 13)** :<br>&nbsp;&nbsp;&nbsp;• Annonce trompeuse (`MISLEADING_AD`)<br>&nbsp;&nbsp;&nbsp;• Contrefaçon présumée (`SUSPECTED_COUNTERFEIT`)<br>&nbsp;&nbsp;&nbsp;• Arnaque (`SCAM`)<br>&nbsp;&nbsp;&nbsp;• Faux profil (`FAKE_PROFILE`)<br>&nbsp;&nbsp;&nbsp;• Comportement abusif (`ABUSIVE_BEHAVIOR`)<br>&nbsp;&nbsp;&nbsp;• Autre motif (`OTHER`)<br>**2.** L'utilisateur sélectionne le motif, rédige une description explicative et valide.<br>**3.** Le système enregistre l'entité `Report` en base avec le statut `PENDING`, la cible (`PRODUCT` ou `USER`) et l'horodatage.<br>**4.** Le signalement remonte immédiatement dans le compteur « Signalements en attente » du Dashboard Administrateur.<br>**5.** Le système confirme la prise en compte du signalement à l'utilisateur. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Auto-signalement ou signalement dupliqué déjà en attente** : Le système bloque les doublons (`HTTP 409 Conflict`). |
| **Postconditions (Fin)** | Un ticket de signalement `PENDING` est créé et prêt à être traité par un Administrateur (`UC-18`). |
| **Compléments & Règles Métier** | - Si le signalement concerne une commande non finalisée, la commande passe en `DISPUTED` pour geler le déblocage des fonds. |

---

## 7. Module 6 : Back-Office Administrateur & Supervision

### UC-15 : Consulter le Dashboard statistique et le suivi des commissions (1%)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-15** |
| **Titre** | Visualiser les indicateurs clés (KPI) et les commissions sur le Dashboard Admin |
| **Référence CDC** | Section 3.3 & Section 15 (Back-office administrateur — Dashboard) |
| **Objectif métier** | Offrir à l'administrateur une vue synthétique en temps réel de l'activité commerciale, financière et de modération de la marketplace. |
| **Acteur primaire** | **Administrateur** (`ROLE_ADMIN`) |
| **Relations UML** | `«include»` : Vérifier le rôle `ROLE_ADMIN` |
| **Déclencheur** | L'administrateur se connecte au Back-Office Web. |
| **Préconditions** | L'utilisateur est authentifié avec un token `JWT` possédant l'autorité `ROLE_ADMIN`. |
| **Scénario Nominal (Flux Principal)** | **1.** L'administrateur accède au tableau de bord principal (`/admin/dashboard`).<br>**2.** *En parallèle (`par`)*, le système agrège et retourne les **6 indicateurs exigés en Section 15** :<br>&nbsp;&nbsp;&nbsp;• **Nombre d'utilisateurs** (total, actifs, suspendus)<br>&nbsp;&nbsp;&nbsp;• **Nombre d'annonces** (actives, vendues, désactivées)<br>&nbsp;&nbsp;&nbsp;• **Nombre de commandes** (en cours, livrées, terminées)<br>&nbsp;&nbsp;&nbsp;• **Nombre et volume de transactions** Mobile Money<br>&nbsp;&nbsp;&nbsp;• **Montant total des Commissions perçues** (cumul des frais de validation de 1 %)<br>&nbsp;&nbsp;&nbsp;• **Nombre de signalements en attente** (`Report.status == PENDING`)<br>**3.** Le Back-Office affiche les cartes KPI et les raccourcis vers les files de gestion. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Accès par un simple `ROLE_USER`** : Spring Security bloque la requête et retourne `HTTP 403 Forbidden`. |
| **Postconditions (Fin)** | Les statistiques globales de la plateforme sont affichées à l'administrateur. |

---

### UC-16 : Administrer les utilisateurs (Recherche, Consultation, Suspension, Réactivation)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-16** |
| **Titre** | Rechercher, consulter, suspendre ou réactiver des comptes utilisateurs |
| **Référence CDC** | Section 3.3 & Section 15 (Gestion — Utilisateurs) |
| **Objectif métier** | Permettre à l'administrateur de superviser la base d'utilisateurs et d'écarter les profils frauduleux ou abusifs. |
| **Acteur primaire** | **Administrateur** (`ROLE_ADMIN`) |
| **Déclencheur** | L'administrateur ouvre le menu « Gestion des Utilisateurs » dans le Back-Office. |
| **Préconditions** | L'administrateur est connecté (`ROLE_ADMIN`). |
| **Scénario Nominal (Flux Principal)** | **1.** Le système affiche la liste paginée des utilisateurs inscrits.<br>**2.** L'administrateur recherche un utilisateur par nom, numéro de téléphone ou statut et ouvre sa fiche détaillée (annonces publiées, commandes, historique de signalements).<br>**3.** L'administrateur clique sur « Suspendre l'utilisateur » et saisit un motif.<br>**4.** *En parallèle (`par`)* :<br>&nbsp;&nbsp;&nbsp;• Le système passe le statut du compte à `SUSPENDED`.<br>&nbsp;&nbsp;&nbsp;• Le système désactive automatiquement les annonces `ACTIVE` de cet utilisateur (`INACTIVE`) et invalide ses sessions.<br>&nbsp;&nbsp;&nbsp;• Le système journalise l'action d'administration.<br>**5.** Le système confirme la suspension. |
| **Scénarios Alternatifs (`alt`)** | **A1 — Réactivation d'un utilisateur (`SUSPENDED` → `ACTIVE`)** :<br>L'administrateur clique sur « Réactiver le compte » ; le système restaure le statut `ACTIVE` et journalise l'opération. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Tentative d'un administrateur de suspendre son propre compte** : Action refusée (`HTTP 400 Bad Request`). |
| **Postconditions (Fin)** | Le statut du compte utilisateur est mis à jour et ses droits d'accès sont immédiatement appliqués. |

---

### UC-17 : Administrer le catalogue (Modération des annonces & CRUD Catégories)

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-17** |
| **Titre** | Rechercher, désactiver/supprimer des annonces et gérer les catégories |
| **Référence CDC** | Section 3.3 & Section 15 (Gestion — Annonces & Catégories) |
| **Objectif métier** | Garantir la qualité du catalogue et structurer l'arborescence des catégories de produits. |
| **Acteur primaire** | **Administrateur** (`ROLE_ADMIN`) |
| **Déclencheur** | L'administrateur accède à « Gestion des Annonces » ou « Gestion des Catégories ». |
| **Préconditions** | L'administrateur est connecté (`ROLE_ADMIN`). |
| **Scénario Nominal (Flux Principal — Catégories & Annonces)** | **Volet A — Gestion des Catégories** :<br>**1.** L'administrateur consulte la liste des catégories.<br>**2.** Il crée une nouvelle catégorie (Nom, Slug, Description, Icône), modifie une catégorie existante ou désactive/supprime une catégorie.<br>**3.** Le système persiste les modifications en base.<br><br>**Volet B — Modération des Annonces** :<br>**1.** L'administrateur recherche et consulte les annonces de la plateforme.<br>**2.** Face à une annonce non conforme, il clique sur « Désactiver » (`INACTIVE`) ou « Supprimer ».<br>**3.** Le système retire immédiatement l'annonce du catalogue public et notifie le vendeur. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Suppression d'une catégorie contenant déjà des produits** :<br>Le système empêche la suppression physique brutale (`HTTP 409 Conflict`) et propose soit de désactiver la catégorie (`is_active = false`), soit de réaffecter les produits. |
| **Postconditions (Fin)** | Le référentiel des catégories et le catalogue d'annonces sont mis à jour. |

---

### UC-18 : Superviser les commandes/paiements et traiter les signalements & litiges

| Rubrique | Description Détaillée |
| :--- | :--- |
| **Identifiant** | **UC-18** |
| **Titre** | Consulter les commandes et paiements, traiter et clôturer les signalements/litiges |
| **Référence CDC** | Section 3.3, Section 13 & Section 15 (Gestion — Commandes, Paiements, Signalements) |
| **Objectif métier** | Permettre à l'administrateur d'auditer tous les flux financiers et de trancher les litiges entre acheteurs et vendeurs. |
| **Acteur primaire** | **Administrateur** (`ROLE_ADMIN`) |
| **Acteurs secondaires** | **Prestataire Paiement Mobile (Escrow)** |
| **Déclencheur** | L'administrateur ouvre « Commandes & Paiements » ou « Signalements & Litiges ». |
| **Préconditions** | L'administrateur est connecté (`ROLE_ADMIN`). |
| **Scénario Nominal (Flux Principal)** | **1.** L'administrateur consulte la file des signalements au statut `PENDING` et sélectionne un dossier.<br>**2.** Le système passe le signalement à `UNDER_REVIEW` et affiche l'ensemble des éléments de preuve : annonce ou profil ciblé, historique de la conversation entre acheteur et vendeur, état de la commande et du paiement en séquestre.<br>**3.** L'administrateur analyse le dossier, saisit sa note de résolution (`admin_resolution_note`) et choisit la décision appropriée.<br>**4.** *Selon la décision (`alt` & `par`)* :<br>&nbsp;&nbsp;&nbsp;• **Cas 4a (Signalement fondé sur annonce/profil)** : Désactivation de l'annonce (`INACTIVE`) et/ou suspension du compte (`SUSPENDED`).<br>&nbsp;&nbsp;&nbsp;• **Cas 4b (Litige commande tranché en faveur de l'acheteur)** : Ordre de remboursement du séquestre à l'acheteur (`Payment.status = REFUNDED`, `Order.status = CANCELLED`).<br>&nbsp;&nbsp;&nbsp;• **Cas 4c (Litige commande tranché en faveur du vendeur)** : Déblocage forcé des fonds au vendeur (`Payment.status = RELEASED_TO_SELLER`, `Order.status = COMPLETED`).<br>**5.** Le système passe le signalement au statut `RESOLVED` (`resolved_at = now()`) et notifie les parties concernées. |
| **Scénarios Alternatifs (`alt`)** | **A1 — Signalement infondé (`REJECTED`)** :<br>L'administrateur juge le signalement abusif ou non fondé et le clôture avec le statut `REJECTED` sans appliquer de sanction. |
| **Scénarios d'Exception / Erreur (`else`)** | **E1 — Signalement déjà clôturé par un autre administrateur** : Le système renvoie `HTTP 409 Conflict`. |
| **Postconditions (Fin)** | Le signalement est clôturé (`RESOLVED` ou `REJECTED`), la décision est tracée dans le journal d'audit et les fonds éventuels sont libérés ou remboursés. |
