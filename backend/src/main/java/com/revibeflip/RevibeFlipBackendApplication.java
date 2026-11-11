package com.revibeflip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RevibeFlipBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RevibeFlipBackendApplication.class, args);
	}

}
