package com.revibeflip.sms;

/**
 * Interface d'abstraction pour l'envoi réel de SMS (OTP d'inscription et réinitialisation de mot de passe).
 */
public interface SmsProvider {

    /**
     * Envoie un SMS à un numéro de téléphone au format E.164 (ex: +22177XXXXXXX).
     */
    void sendSms(String phoneNumber, String message);

    /**
     * Indique si le fournisseur SMS est configuré pour un envoi réel.
     */
    boolean isConfigured();
}
