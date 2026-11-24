package com.revibeflip.config;

import com.revibeflip.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Gestionnaire global des exceptions pour l'ensemble des contrôleurs REST.
 * <p>
 * Intercepte et unifie les réponses d'erreur au format standard {@link ApiResponse} :
 * <ul>
 *   <li>401 Unauthorized : Identifiants invalides (BadCredentialsException).</li>
 *   <li>403 Forbidden : Accès refusé (AccessDeniedException).</li>
 *   <li>404 Not Found : Ressource introuvable (EntityNotFoundException, NoResourceFoundException).</li>
 *   <li>400 Bad Request : Arguments invalides ou erreurs de validation Bean Validation.</li>
 *   <li>409 Conflict : États incohérents, conflits de panier ou violations de contraintes (SellerConflictException, DataIntegrityViolationException).</li>
 *   <li>500 Internal Server Error : Erreurs inattendues ou accès données (avec trackingId et masquage complet du SQL/stacktrace).</li>
 * </ul>
 * </p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Tentative d'authentification invalide : identifiants erronés");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : "Identifiants invalides."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Tentative d'accès non autorisée : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : "Accès refusé."));
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFound(jakarta.persistence.EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : "Ressource non trouvée."));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Ressource non trouvée."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error("Méthode HTTP non supportée pour cette ressource."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.data.mapping.PropertyReferenceException.class)
    public ResponseEntity<ApiResponse<Void>> handlePropertyReferenceException(org.springframework.data.mapping.PropertyReferenceException ex) {
        log.warn("Tentative de tri sur une propriété inconnue ou non autorisée : {}", ex.getPropertyName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Le champ de tri spécifié n'est pas valide : " + ex.getPropertyName()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.revibeflip.exception.TooManyRequestsException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooManyRequests(com.revibeflip.exception.TooManyRequestsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.revibeflip.exception.SellerConflictException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleSellerConflict(com.revibeflip.exception.SellerConflictException ex) {
        Map<String, Object> data = new HashMap<>();
        data.put("existingSellerId", ex.getExistingSellerId());
        data.put("existingSellerName", ex.getExistingSellerName());
        data.put("newSellerId", ex.getNewSellerId());
        data.put("newSellerName", ex.getNewSellerName());
        data.put("sellerConflict", true);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<Map<String, Object>>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(data)
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Erreur de validation des champs.")
                        .data(errors)
                        .build());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String trackingId = UUID.randomUUID().toString();
        log.error("Violation d'intégrité des données SQL [trackingId={}]: ", trackingId, ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Une incohérence ou un conflit de données est survenu.", trackingId));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccessException(DataAccessException ex) {
        String trackingId = UUID.randomUUID().toString();
        log.error("Erreur d'accès à la base de données SQL [trackingId={}]: ", trackingId, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Une erreur interne est survenue.", trackingId));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        String trackingId = UUID.randomUUID().toString();
        log.error("Erreur interne serveur inattendue [trackingId={}]: ", trackingId, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Une erreur interne est survenue.", trackingId));
    }
}
