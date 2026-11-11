package com.revibeflip.entity.enums;

/**
 * Énumération normalisée de l'état d'usure d'un article d'occasion (Neuf avec étiquette, Très bon état, Bon état, Satisfaisant).
 */
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
