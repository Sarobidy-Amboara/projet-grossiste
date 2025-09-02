-- Extension du schéma pour un système POS complet

-- Table des promotions
CREATE TABLE promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('pourcentage', 'montant_fixe', 'achetez_x_obtenez_y', 'pack_special')) NOT NULL,
    
    -- Conditions de la promotion
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    min_amount REAL DEFAULT 0,
    
    -- Valeurs de la promotion
    discount_percentage REAL,
    discount_amount REAL,
    buy_quantity INTEGER, -- Pour "achetez X obtenez Y"
    get_quantity INTEGER,
    
    -- Restrictions
    max_uses_per_customer INTEGER,
    max_total_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Produits concernés (JSON array des product_ids)
    applicable_products TEXT, -- JSON: ["prod1", "prod2"]
    applicable_categories TEXT, -- JSON: ["cat1", "cat2"] 
    
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Table des packs de produits
CREATE TABLE product_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    pack_price REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Contenu des packs
CREATE TABLE pack_items (
    id TEXT PRIMARY KEY,
    pack_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (pack_id) REFERENCES product_packs(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Grille de prix par paliers (prix de gros/détail)
CREATE TABLE price_tiers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    tier_name TEXT NOT NULL, -- 'detail', 'demi_gros', 'gros'
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER,
    unit_price REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Historique des annulations de ventes
CREATE TABLE sale_cancellations (
    id TEXT PRIMARY KEY,
    original_sale_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    cancelled_by TEXT, -- user_id
    cancellation_date TEXT DEFAULT CURRENT_TIMESTAMP,
    refund_method TEXT CHECK(refund_method IN ('especes', 'mobile_money', 'virement', 'credit')),
    notes TEXT,
    FOREIGN KEY (original_sale_id) REFERENCES sales(id)
);

-- Table pour suivre l'utilisation des promotions
CREATE TABLE promotion_usage (
    id TEXT PRIMARY KEY,
    promotion_id TEXT NOT NULL,
    sale_id TEXT NOT NULL,
    customer_id TEXT,
    discount_applied REAL NOT NULL,
    usage_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_price_tiers_product ON price_tiers(product_id);
CREATE INDEX idx_price_tiers_quantity ON price_tiers(min_quantity, max_quantity);
CREATE INDEX idx_promotion_usage_customer ON promotion_usage(customer_id);
CREATE INDEX idx_sale_cancellations_sale ON sale_cancellations(original_sale_id);
