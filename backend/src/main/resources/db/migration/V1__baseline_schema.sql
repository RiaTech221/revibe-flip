-- Baseline Flyway migration for ReVibe FliP production MySQL database.
-- Hibernate ddl-auto=validate verifies all JPA entities against this schema in production.
-- Tables are created/verified idempotently; incremental schema changes must use V2__, V3__, etc.

CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(40) NOT NULL,
    entry_type VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    paytech_reference VARCHAR(120),
    description VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    INDEX idx_ledger_order_id (order_id),
    INDEX idx_ledger_entry_type (entry_type),
    INDEX idx_ledger_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BIT(1) NOT NULL DEFAULT b'0',
    replaced_by_token_hash VARCHAR(128),
    created_at DATETIME(6) NOT NULL,
    INDEX idx_refresh_token_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
