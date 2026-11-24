-- Baseline schema migration V2: SEC-03 Garanties d'unicité pour la libération de séquestre et le grand livre.
-- Requête de détection préalable des doublons sur ledger_entries (à exécuter manuellement si besoin) :
-- SELECT order_id, entry_type, COUNT(*) FROM ledger_entries GROUP BY order_id, entry_type HAVING COUNT(*) > 1;
-- Requête de détection préalable des doublons sur payments (à exécuter manuellement si besoin) :
-- SELECT payout_reference, COUNT(*) FROM payments WHERE payout_reference IS NOT NULL GROUP BY payout_reference HAVING COUNT(*) > 1;

ALTER TABLE payments ADD CONSTRAINT uq_payments_payout_reference UNIQUE (payout_reference);

ALTER TABLE ledger_entries ADD CONSTRAINT uq_ledger_order_entry UNIQUE (order_id, entry_type);
