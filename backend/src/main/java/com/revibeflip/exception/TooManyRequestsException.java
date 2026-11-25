package com.revibeflip.exception;

import lombok.Getter;

/**
 * Exception levée lorsque le nombre maximal de tentatives ou de requêtes est dépassé (HTTP 429).
 */
@Getter
public class TooManyRequestsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(String message) {
        this(message, 60L);
    }

    public TooManyRequestsException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = Math.max(1L, retryAfterSeconds);
    }
}
