import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db');

console.log('🔧 Modification de la structure de la table products...\n');

try {
  // Commencer une transaction
  db.exec('BEGIN TRANSACTION');

  // Créer une nouvelle table temporaire avec la structure simplifiée
  db.exec(`
    CREATE TABLE products_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      supplier_id TEXT,
      unit TEXT,
      barcode TEXT,
      batch_number TEXT,
      expiry_date TEXT,
      is_active BOOLEAN DEFAULT 1,
      tax_rate REAL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  // Copier les données existantes (en excluant les colonnes supprimées)
  db.exec(`
    INSERT INTO products_new (
      id, name, description, category_id, supplier_id, unit, barcode, 
      batch_number, expiry_date, is_active, tax_rate, image_url, 
      created_at, updated_at
    )
    SELECT 
      id, name, description, category_id, supplier_id, unit, barcode,
      batch_number, expiry_date, is_active, tax_rate, image_url,
      created_at, updated_at
    FROM products
  `);

  // Supprimer l'ancienne table
  db.exec('DROP TABLE products');

  // Renommer la nouvelle table
  db.exec('ALTER TABLE products_new RENAME TO products');

  // Finaliser la transaction
  db.exec('COMMIT');

  console.log('✅ Structure de la table products modifiée avec succès !');
  console.log('\n📋 Colonnes supprimées :');
  console.log('  - unit_price (Prix de vente)');
  console.log('  - wholesale_price (Prix de gros)');
  console.log('  - purchase_price (Prix d\'achat)');
  console.log('  - stock_quantity (Stock actuel)');
  console.log('  - min_stock_level (Stock minimum)');
  console.log('  - max_stock_level (Stock maximum)');

  console.log('\n📋 Colonnes conservées :');
  console.log('  - id, name, description');
  console.log('  - category_id, supplier_id');
  console.log('  - unit, barcode');
  console.log('  - batch_number, expiry_date');
  console.log('  - is_active, tax_rate, image_url');
  console.log('  - created_at, updated_at');

} catch (error) {
  console.error('❌ Erreur lors de la modification :', error.message);
  db.exec('ROLLBACK');
} finally {
  db.close();
}
