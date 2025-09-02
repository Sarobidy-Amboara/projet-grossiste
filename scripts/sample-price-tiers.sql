-- Exemples de prix par paliers pour tester le système

-- Prix pour Coca-Cola 50cl
INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price) VALUES
('tier-coca-detail', 'prod-coca', 'detail', 1, 11, 1200),
('tier-coca-demi', 'prod-coca', 'demi_gros', 12, 23, 1100),
('tier-coca-gros', 'prod-coca', 'gros', 24, NULL, 1000);

-- Prix pour Pepsi 50cl
INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price) VALUES
('tier-pepsi-detail', 'prod-pepsi', 'detail', 1, 11, 1150),
('tier-pepsi-demi', 'prod-pepsi', 'demi_gros', 12, 23, 1050),
('tier-pepsi-gros', 'prod-pepsi', 'gros', 24, NULL, 950);

-- Prix pour les bonbons anglais
INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price) VALUES
('tier-bonbons-detail', '1756290810398', 'detail', 1, 5, 2500),
('tier-bonbons-demi', '1756290810398', 'demi_gros', 6, 11, 2300),
('tier-bonbons-gros', '1756290810398', 'gros', 12, NULL, 2000);
