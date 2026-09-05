package com.revibeflip.entity.enums;

public enum EscrowStatus {
    LOCKED("Fonds bloqués en séquestre"),
    RELEASED_TO_SELLER("Fonds libérés au vendeur"),
    REFUNDED_TO_BUYER("Fonds remboursés à l'acheteur");

    private final String description;

    EscrowStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
