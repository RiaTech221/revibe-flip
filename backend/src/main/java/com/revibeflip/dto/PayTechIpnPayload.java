package com.revibeflip.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Charge utile reçue lors d'une notification IPN (webhook) envoyée par PayTech.
 */
@Data
public class PayTechIpnPayload {

    @JsonProperty("type_event")
    private String typeEvent;

    @JsonProperty("ref_command")
    private String refCommand;

    @JsonProperty("item_price")
    private BigDecimal itemPrice;

    @JsonProperty("final_item_price")
    private BigDecimal finalItemPrice;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("token")
    private String token;

    @JsonProperty("api_key_sha256")
    private String apiKeySha256;

    @JsonProperty("api_secret_sha256")
    private String apiSecretSha256;

    @JsonProperty("custom_field")
    private String customField;
}
