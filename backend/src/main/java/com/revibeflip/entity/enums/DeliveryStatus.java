package com.revibeflip.entity.enums;

public enum DeliveryStatus {
    PENDING("En attente de prise en charge"),
    PICKED_UP("Pris en charge"),
    DISPATCHED("Expédié"),
    IN_TRANSIT("En cours d'acheminement"),
    OUT_FOR_DELIVERY("En cours de livraison"),
    DELIVERED("Livré"),
    CANCELLED("Livraison annulée");

    private final String label;

    DeliveryStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
