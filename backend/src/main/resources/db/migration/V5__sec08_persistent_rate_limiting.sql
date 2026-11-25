-- SEC-08 : Table partagée et persistante pour la limitation de débit (IP & téléphone)
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bucket_key VARCHAR(180) NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    window_start DATETIME(6) NOT NULL,
    last_sent_at DATETIME(6) NULL,
    blocked_until DATETIME(6) NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_rate_limit_bucket_key UNIQUE (bucket_key),
    INDEX idx_rate_limit_window_start (window_start),
    INDEX idx_rate_limit_blocked_until (blocked_until)
);
