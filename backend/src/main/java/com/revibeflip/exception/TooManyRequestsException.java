package com.revibeflip.exception;

/**
 * Exception levée lorsque le nombre maximal de tentatives ou de requêtes est dépassé (HTTP 429).
 */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
