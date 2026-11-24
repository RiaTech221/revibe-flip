-- Migration V4 (TiDB / MySQL) : US-14 Carte produit dans les messages du fil unique
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id BIGINT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_title VARCHAR(200) NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(500) NULL;
