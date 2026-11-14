package com.revibeflip.sms;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limiteur de débit pour les envois d'OTP (par numéro et par adresse IP) avec délai minimal entre deux envois.
 */
@Component
public class OtpRateLimiter {

    private static final int MAX_PER_PHONE_PER_HOUR = 5;
    private static final int MAX_PER_IP_PER_HOUR = 15;
    private static final long COOLDOWN_SECONDS = 60;
    private static final long WINDOW_SECONDS = 3600;

    private final Map<String, Deque<Instant>> phoneRequests = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> ipRequests = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastPhoneSend = new ConcurrentHashMap<>();

    public void checkAndRecordSend(String phone, String clientIp) {
        Instant now = Instant.now();

        if (phone != null && !phone.isBlank()) {
            Instant last = lastPhoneSend.get(phone);
            if (last != null && now.isBefore(last.plusSeconds(COOLDOWN_SECONDS))) {
                throw new IllegalStateException("Veuillez patienter 60 secondes avant de demander un nouveau code.");
            }
            Deque<Instant> phoneDeque = phoneRequests.computeIfAbsent(phone, k -> new ArrayDeque<>());
            synchronized (phoneDeque) {
                prune(phoneDeque, now);
                if (phoneDeque.size() >= MAX_PER_PHONE_PER_HOUR) {
                    throw new IllegalStateException("Trop de demandes de code pour ce numéro. Réessayez plus tard.");
                }
                phoneDeque.addLast(now);
            }
            lastPhoneSend.put(phone, now);
        }

        if (clientIp != null && !clientIp.isBlank()) {
            Deque<Instant> ipDeque = ipRequests.computeIfAbsent(clientIp, k -> new ArrayDeque<>());
            synchronized (ipDeque) {
                prune(ipDeque, now);
                if (ipDeque.size() >= MAX_PER_IP_PER_HOUR) {
                    throw new IllegalStateException("Trop de demandes depuis cette adresse IP. Réessayez plus tard.");
                }
                ipDeque.addLast(now);
            }
        }
    }

    private void prune(Deque<Instant> deque, Instant now) {
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);
        while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
            deque.pollFirst();
        }
    }
}
