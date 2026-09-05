package com.revibeflip.entity.enums;

public enum PaymentMethod {
    WAVE("Wave"),
    ORANGE_MONEY("Orange Money"),
    FREE_MONEY("Free Money");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
