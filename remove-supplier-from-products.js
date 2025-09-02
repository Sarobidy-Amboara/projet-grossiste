import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db');

console.log('🔧 Suppression du champ supplier_id de la table products...\n');

try {
  // Commencer une transaction
  db.exec('BEGIN TRANSACTION');

  // Créer une nouvelle table temporaire sans supplier_id
  db.exec(`
    CREATE TABLE products_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      unite_base_id TEXT,
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
      FOREIGN KEY (unite_base_id) REFERENCES unite(id)
    )
  `);

  // Copier les données existantes (en excluant supplier_id)
  db.exec(`
    INSERT INTO products_new (
      id, name, description, category_id, unite_base_id, unit, barcode, 
      batch_number, expiry_date, is_active, tax_rate, image_url, 
      created_at, updated_at
    )
    SELECT 
      id, name, description, category_id, unite_base_id, unit, barcode,
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

  console.log('✅ Champ supplier_id supprimé avec succès !');
  console.log('\n📋 Structure mise à jour :');
  console.log('  - Suppression de supplier_id');
  console.log('  - Ajout de unite_base_id');
  console.log('  - Conservation de tous les autres champs');

} catch (error) {
  console.error('❌ Erreur lors de la modification :', error.message);
  db.exec('ROLLBACK');
} finally {
  db.close();
}
