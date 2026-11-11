package com.revibeflip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entrée principal de l'application ReVibe FliP Backend.
 * <p>
 * ReVibe FliP est une marketplace africaine de seconde main sécurisée par séquestre (escrow),
 * adaptée aux paiements mobiles d'Afrique de l'Ouest (Wave, Orange Money, Free Money).
 * </p>
 *
 * <ul>
 *   <li>{@link SpringBootApplication} : Configuration automatique Spring Boot 3.</li>
 *   <li>{@link EnableScheduling} : Planification des tâches périodiques (expiration des réservations, offres et séquestre).</li>
 * </ul>
 *
 * @author Équipe ReVibe FliP
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
public class RevibeFlipBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RevibeFlipBackendApplication.class, args);
	}

}
