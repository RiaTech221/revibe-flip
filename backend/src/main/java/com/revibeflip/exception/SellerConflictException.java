package com.revibeflip.exception;

import lombok.Getter;

/**
 * Exception levée lors d'une tentative d'ajout au panier d'un article provenant d'un vendeur différent du panier en cours (règle mono-vendeur).
 */
@Getter
public class SellerConflictException extends RuntimeException {
    private final Long existingSellerId;
    private final String existingSellerName;
    private final Long newSellerId;
    private final String newSellerName;

    public SellerConflictException(Long existingSellerId, String existingSellerName, Long newSellerId, String newSellerName) {
        super("Votre panier contient déjà des articles de " + existingSellerName + ". Vous ne pouvez commander qu’auprès d’un vendeur à la fois.");
        this.existingSellerId = existingSellerId;
        this.existingSellerName = existingSellerName;
        this.newSellerId = newSellerId;
        this.newSellerName = newSellerName;
    }
}
