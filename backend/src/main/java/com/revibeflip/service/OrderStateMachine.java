package com.revibeflip.service;

import com.revibeflip.entity.enums.OrderStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Machine à états unique régissant les transitions autorisées des commandes.
 * Toute transition invalide est refusée explicitement.
 */
public final class OrderStateMachine {

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(OrderStatus.PENDING_PAYMENT, EnumSet.of(
                OrderStatus.AWAITING_PAYMENT,
                OrderStatus.PAID_ESCROW_LOCKED,
                OrderStatus.CANCELLED,
                OrderStatus.EXPIRED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.AWAITING_PAYMENT, EnumSet.of(
                OrderStatus.PAID_ESCROW_LOCKED,
                OrderStatus.CANCELLED,
                OrderStatus.EXPIRED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.PAID_ESCROW_LOCKED, EnumSet.of(
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
                OrderStatus.DISPUTED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.SHIPPED, EnumSet.of(
                OrderStatus.DELIVERED,
                OrderStatus.DISPUTED,
                OrderStatus.CANCELLED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.DELIVERED, EnumSet.of(
                OrderStatus.COMPLETED,
                OrderStatus.DISPUTED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.DISPUTED, EnumSet.of(
                OrderStatus.COMPLETED,
                OrderStatus.CANCELLED
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.COMPLETED, EnumSet.noneOf(OrderStatus.class));
        ALLOWED_TRANSITIONS.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        ALLOWED_TRANSITIONS.put(OrderStatus.EXPIRED, EnumSet.noneOf(OrderStatus.class));
    }

    private OrderStateMachine() {}

    public static boolean canTransition(OrderStatus from, OrderStatus to) {
        if (from == null || to == null) {
            return false;
        }
        return ALLOWED_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(OrderStatus.class)).contains(to);
    }

    public static void validateTransition(OrderStatus from, OrderStatus to) {
        if (!canTransition(from, to)) {
            throw new IllegalStateException(
                    String.format("Transition de statut commande invalide : %s -> %s", from, to)
            );
        }
    }
}
