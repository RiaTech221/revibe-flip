package com.revibeflip.support;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Générateur déterministe et thread-safe de numéros de téléphone sénégalais uniques
 * pour les tests d'intégration (évite les collisions aléatoires de Math.random() en CI).
 */
public final class TestPhoneGenerator {

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1_000_000);

    private TestPhoneGenerator() {
    }

    public static String nextPhone() {
        return nextPhone("+22177");
    }

    public static String nextPhone(String prefix) {
        return prefix + SEQUENCE.incrementAndGet();
    }
}
