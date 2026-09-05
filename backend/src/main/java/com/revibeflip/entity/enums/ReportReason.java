package com.revibeflip.entity.enums;

public enum ReportReason {
    MISLEADING_LISTING("Annonce trompeuse"),
    COUNTERFEIT("Contrefaçon présumée"),
    SCAM("Arnaque"),
    FAKE_PROFILE("Faux profil"),
    ABUSIVE_BEHAVIOR("Comportement abusif"),
    OTHER("Autre motif");

    private final String label;

    ReportReason(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
