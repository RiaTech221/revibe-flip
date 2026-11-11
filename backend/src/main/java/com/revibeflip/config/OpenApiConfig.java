package com.revibeflip.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI revibeFlipOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("ReVibe FliP - API REST")
                        .description("Documentation complète de l'API ReVibe FliP — Marketplace africaine de seconde main. " +
                                "Gestion des annonces, commandes, messagerie temps réel, paiements mobiles (Wave, Orange Money, Free Money), " +
                                "livraison avec suivi, système d'Escrow (séquestre) et back-office administrateur.\n\n" +
                                "Avertissement sur le séquestre : Simulation interne. Le blocage réel des fonds nécessite l'intégration " +
                                "du prestataire de paiement (Wave/Orange Money/Free Money) et la validation du cadre juridique avant la production.")
                        .version("1.0.0 (MVP)")
                        .contact(new Contact()
                                .name("Équipe Technique ReVibe FliP")
                                .email("contact@revibeflip.com"))
                        .license(new License().name("Propriétaire").url("https://revibeflip.com")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
