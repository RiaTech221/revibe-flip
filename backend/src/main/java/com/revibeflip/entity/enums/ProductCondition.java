package com.revibeflip.entity.enums;

public enum ProductCondition {
    NEW_WITH_TAG("Neuf avec étiquette"),
    VERY_GOOD("Très bon état"),
    GOOD("Bon état"),
    SATISFACTORY("État satisfaisant");

    private final String label;

    ProductCondition(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
