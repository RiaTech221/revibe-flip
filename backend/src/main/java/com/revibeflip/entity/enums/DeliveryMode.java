package com.revibeflip.entity.enums;

public enum DeliveryMode {
    HOME_DELIVERY("Livraison à domicile"),
    DIRECT_HANDOVER("Remise en main propre");

    private final String label;

    DeliveryMode(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
