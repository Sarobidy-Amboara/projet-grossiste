import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'mada-brew-boss.db');
const db = new Database(dbPath);

function initialize() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category_id TEXT,
            supplier_id TEXT,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            unit TEXT,
            unit_price REAL NOT NULL,
            purchase_price REAL,
            wholesale_price REAL,
            min_stock_level INTEGER,
            max_stock_level INTEGER,
            image_url TEXT,
            barcode TEXT,
            batch_number TEXT,
            expiry_date TEXT,
            is_active BOOLEAN DEFAULT 1,
            tax_rate REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            tax_number TEXT,
            credit_limit REAL,
            current_balance REAL,
            discount_percentage REAL,
            payment_terms INTEGER,
            is_active BOOLEAN DEFAULT 1,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('particulier', 'professionnel')),
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            tax_number TEXT,
            credit_limit REAL,
            current_balance REAL,
            discount_percentage REAL,
            payment_terms INTEGER,
            is_active BOOLEAN DEFAULT 1,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            sale_number TEXT NOT NULL,
            sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
            customer_id TEXT,
            user_id TEXT,
            total_amount REAL NOT NULL,
            tax_amount REAL,
            discount_amount REAL,
            final_amount REAL NOT NULL,
            payment_method TEXT CHECK(payment_method IN ('especes', 'mobile_money', 'virement', 'credit', 'mixte')),
            status TEXT CHECK(status IN ('en_cours', 'finalise', 'annule')),
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            discount_percentage REAL,
            total_price REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    `);

    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)');
    const insertProduct = db.prepare('INSERT OR IGNORE INTO products (id, name, category_id, unit, unit_price, purchase_price, wholesale_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertCustomer = db.prepare('INSERT OR IGNORE INTO customers (id, name, type, city) VALUES (?, ?, ?, ?)');

    db.transaction(() => {
        insertCategory.run('cat-boissons', 'Boissons', '#FFC107');
        insertCategory.run('cat-snacks', 'Snacks', '#4CAF50');

        insertProduct.run('prod-coca', 'Coca-Cola 50cl', 'cat-boissons', 'Bouteille', 2500, 2000, 2200, 100);
        insertProduct.run('prod-pepsi', 'Pepsi 50cl', 'cat-boissons', 'Bouteille', 2500, 2000, 2200, 100);
        insertProduct.run('prod-chips', 'Chips Lays Nature', 'cat-snacks', 'Paquet', 3000, 2500, 2800, 50);

        insertCustomer.run('cust-divers', 'CLIENT DIVERS', 'particulier', 'Antananarivo');
    })();

    console.log('Database initialized successfully.');
}

initialize();

db.close();
