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

/**
 * Configuration OpenAPI 3 / Swagger pour la documentation interactive de l'API.
 * <p>
 * Configure le schéma de sécurité Bearer JWT et les métadonnées de l'API ReVibe FliP.
 * Accessible via {@code /swagger-ui.html}.
 * </p>
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI revibeFlipOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("ReVibe FliP - API REST")
                        .description("Documentation complète de l'API ReVibe FliP — Marketplace sénégalaise de seconde main. " +
                                "Gestion des annonces, commandes, messagerie temps réel, paiements mobiles via PayTech, " +
                                "livraison avec suivi, conservation des paiements jusqu'à confirmation de réception et back-office administrateur.")
                        .version("1.0.0")
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
