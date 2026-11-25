package com.revibeflip.service;

import com.revibeflip.entity.enums.DeliveryStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Machine à états régissant les transitions logistiques autorisées pour la livraison (SEC-04).
 * <p>
 * Les statuts évoluent obligatoirement dans l'ordre strict des 5 étapes :
 * PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED.
 * </p>
 */
public final class DeliveryStateMachine {

    private static final Map<DeliveryStatus, Set<DeliveryStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(DeliveryStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(DeliveryStatus.PENDING, EnumSet.of(DeliveryStatus.PICKED_UP));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.PICKED_UP, EnumSet.of(DeliveryStatus.IN_TRANSIT));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.IN_TRANSIT, EnumSet.of(DeliveryStatus.OUT_FOR_DELIVERY));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.OUT_FOR_DELIVERY, EnumSet.of(DeliveryStatus.DELIVERED));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.DELIVERED, EnumSet.noneOf(DeliveryStatus.class));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.CANCELLED, EnumSet.noneOf(DeliveryStatus.class));
        ALLOWED_TRANSITIONS.put(DeliveryStatus.DISPATCHED, EnumSet.of(DeliveryStatus.IN_TRANSIT));
    }

    private DeliveryStateMachine() {}

    public static boolean canTransition(DeliveryStatus from, DeliveryStatus to) {
        if (from == null || to == null) {
            return false;
        }
        return ALLOWED_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(DeliveryStatus.class)).contains(to);
    }

    public static void validateTransition(DeliveryStatus from, DeliveryStatus to) {
        if (!canTransition(from, to)) {
            throw new IllegalArgumentException(
                    String.format("Transition de statut de livraison invalide : %s -> %s (l'ordre requis est PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED)", from, to)
            );
        }
    }
}
