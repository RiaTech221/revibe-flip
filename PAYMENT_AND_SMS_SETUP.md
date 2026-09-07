# Guide de Configuration : SMS Réel (OTP) & Paiements Mobiles (Wave & Orange Money)

Ce guide vous explique exactement comment brancher vos comptes réels ou de test (Sandbox) sur **ReVibe FliP** pour envoyer de vrais SMS et recevoir de vrais paiements.

---

## 1. Envoi Réel de SMS (OTP d'inscription)

Le backend est équipé d'une passerelle **Twilio** (fonctionnant parfaitement avec tous les numéros en Afrique : +221 Sénégal, +225 Côte d'Ivoire, etc.).

### Comment obtenir vos clés Twilio gratuites (Essai gratuit avec crédits offerts) :
1. Rendez-vous sur [twilio.com](https://www.twilio.com) et créez un compte gratuit.
2. Accédez à votre console Twilio :
   * Copiez votre **Account SID**.
   * Copiez votre **Auth Token**.
   * Obtenez un numéro d'expéditeur Twilio (**Twilio Phone Number**).

### Comment les activer dans ReVibe FliP :
Ouvrez votre fichier `backend/src/main/resources/application.properties` (ou définissez vos variables d'environnement) :
```properties
# Passer le provider à 'twilio'
revibeflip.sms.provider=twilio
revibeflip.sms.twilio.account-sid=VOTRE_TWILIO_ACCOUNT_SID
revibeflip.sms.twilio.auth-token=VOTRE_TWILIO_AUTH_TOKEN
revibeflip.sms.twilio.from-number=+1234567890
```

> **Note :** Tant que `revibeflip.sms.provider=mock`, le code OTP continue de s'afficher dans la console du backend et dans la réponse JSON pour vos tests locaux sans frais.

---

## 2. Paiements Réels Wave & Orange Money (Paydunya ou Wave Business)

Deux options s'offrent à vous :

### Option A : Passerelle Paydunya (Recommandée - 1 seule intégration pour Wave, OM et Free Money)
Paydunya est le leader au Sénégal pour encaisser par Wave, Orange Money et Free Money sans créer 3 contrats différents.

1. Créez un compte Sandbox gratuit sur [paydunya.com](https://paydunya.com).
2. Dans votre espace développeur, récupérez :
   * **Master Key**
   * **Private Key**
   * **Token**
3. Configurez `backend/src/main/resources/application.properties` :
```properties
revibeflip.payment.provider=paydunya
revibeflip.payment.paydunya.master-key=VOTRE_MASTER_KEY
revibeflip.payment.paydunya.private-key=VOTRE_PRIVATE_KEY
revibeflip.payment.paydunya.token=VOTRE_TOKEN
revibeflip.payment.webhook-base-url=https://votre-domaine.com # Ou URL Ngrok en local
```

### Option B : Wave Business API directe
Si vous avez un compte marchand Wave Business :
1. Récupérez votre clé secrète API sur votre portail Wave Business.
2. Configurez `application.properties` :
```properties
revibeflip.payment.provider=wave
revibeflip.payment.wave.api-key=wave_sn_prod_...
```

---

## 3. Comment tester les Webhooks en local ?

Lorsque Wave ou Paydunya valide un paiement, leur serveur envoie une requête HTTP à votre backend (`POST /api/payments/webhook`).

Pour tester cela en développement sur votre machine :
1. Lancez **ngrok** sur le port 8080 :
   ```bash
   ngrok http 8080
   ```
2. Copiez l'URL HTTPS générée (ex: `https://abc-123.ngrok-free.app`) et renseignez-la dans :
   ```properties
   revibeflip.payment.webhook-base-url=https://abc-123.ngrok-free.app
   ```
3. Indiquez cette même URL dans les paramètres de Webhooks de votre compte Paydunya / Wave :
   `https://abc-123.ngrok-free.app/api/payments/webhook`
