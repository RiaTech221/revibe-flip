-- =============================================================================
-- ReVibe FliP - Script de nettoyage des données de développement avant production
-- À exécuter sur la base MySQL avant la mise en production si la base a reçu
-- des données de démonstration ou de test.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Suppression des commandes de développement (préfixe RF-DEV-) et enregistrements liés
DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'RF-DEV-%');
DELETE FROM deliveries WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'RF-DEV-%');
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'RF-DEV-%');
DELETE FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'RF-DEV-%');
DELETE FROM orders WHERE order_number LIKE 'RF-DEV-%';

-- Suppression des images externes Unsplash résiduelles
DELETE FROM product_images WHERE image_url LIKE '%images.unsplash.com%';

-- Suppression des comptes de démonstration connus
DELETE FROM notifications WHERE user_id IN (
    SELECT id FROM users WHERE phone IN ('+221770000000', '+221771112233', '+221774445566', '+221778889900')
);
DELETE FROM admin_action_logs WHERE admin_id IN (
    SELECT id FROM users WHERE phone = '+221770000000'
);
DELETE FROM users WHERE phone IN ('+221770000000', '+221771112233', '+221774445566', '+221778889900');

SET FOREIGN_KEY_CHECKS = 1;
