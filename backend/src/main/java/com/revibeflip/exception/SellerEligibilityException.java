package com.revibeflip.exception;

import com.revibeflip.dto.SellerEligibilityDto;
import lombok.Getter;

/**
 * Exception levée lorsqu'un utilisateur tente de publier/devenir vendeur
 * alors que son profil contient des informations manquantes ou invalides.
 */
@Getter
public class SellerEligibilityException extends RuntimeException {
    private final SellerEligibilityDto eligibility;

    public SellerEligibilityException(SellerEligibilityDto eligibility) {
        super(eligibility.getMessage());
        this.eligibility = eligibility;
    }
}
