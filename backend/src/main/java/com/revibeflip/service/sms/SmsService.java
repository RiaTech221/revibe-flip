package com.revibeflip.service.sms;

/**
 * Service pour l'envoi de SMS (Codes OTP d'inscription, notifications critiques).
 */
public interface SmsService {

    /**
     * Envoie un code OTP par SMS au numéro de téléphone spécifié.
     *
     * @param phoneNumber Numéro de téléphone au format international (ex: +221771234567)
     * @param otpCode Code OTP à 6 chiffres
     * @return true si le SMS a été transmis avec succès, false sinon
     */
    boolean sendOtp(String phoneNumber, String otpCode);

    /**
     * Envoie un SMS textuel personnalisé.
     *
     * @param phoneNumber Numéro de téléphone du destinataire
     * @param message Contenu du message
     * @return true si le SMS a été transmis avec succès
     */
    boolean sendSms(String phoneNumber, String message);
}
