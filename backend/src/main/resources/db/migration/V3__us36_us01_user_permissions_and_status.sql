-- Migration V3 (TiDB / MySQL) : US-36 (Collaborateurs & permissions) + US-01 (Inscription OTP numéro seul)
-- Compatible TiDB Cloud & Hibernate ddl-auto=validate en production.

-- 1. Table des permissions granulaires pour les collaborateurs (US-36)
CREATE TABLE IF NOT EXISTS user_admin_permissions (
    user_id BIGINT NOT NULL,
    permission VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, permission),
    CONSTRAINT fk_user_admin_permissions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. S'assurer que la colonne role accepte ROLE_COLLABORATOR (17 caractères, VARCHAR(20))
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;

-- 3. Colonne status (PENDING_OTP / ACTIVE / SUSPENDED) pour l'inscription OTP (US-01)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 4. Rendre first_name, last_name et password nullable pour l'inscription par numéro seul (US-01)
ALTER TABLE users MODIFY COLUMN first_name VARCHAR(60) NULL;
ALTER TABLE users MODIFY COLUMN last_name VARCHAR(60) NULL;
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;
