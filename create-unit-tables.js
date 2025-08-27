import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db');

console.log('🔧 Création des tables unité et conversion_unite...\n');

try {
  // Commencer une transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Créer la table unite
  console.log('📋 Création de la table unite...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS unite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      abbreviation TEXT,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Insérer les unités de base
  console.log('📋 Insertion des unités de base...');
  const insertUnit = db.prepare(`
    INSERT OR IGNORE INTO unite (name, abbreviation, description) 
    VALUES (?, ?, ?)
  `);

  const baseUnits = [
    ['bouteille', 'btl', 'Bouteille individuelle'],
    ['canette', 'can', 'Canette individuelle'],
    ['pack', 'pk', 'Pack de plusieurs unités'],
    ['carton', 'ctn', 'Carton de plusieurs packs'],
    ['litre', 'L', 'Mesure de volume en litres'],
    ['piece', 'pc', 'Pièce individuelle'],
    ['boite', 'box', 'Boîte contenant plusieurs unités'],
    ['casier', 'csr', 'Casier de bouteilles']
  ];

  baseUnits.forEach(([name, abbr, desc]) => {
    insertUnit.run(name, abbr, desc);
  });

  // 3. Créer la table conversion_unite
  console.log('📋 Création de la table conversion_unite...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversion_unite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      unite_id INTEGER NOT NULL,
      quantite_equiv REAL NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (unite_id) REFERENCES unite(id) ON DELETE CASCADE,
      UNIQUE(product_id, unite_id)
    )
  `);

  // 4. Modifier la table products pour ajouter unite_base_id
  console.log('📋 Modification de la table products...');
  
  // Vérifier si la colonne existe déjà
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const hasUniteBaseId = columns.some(col => col.name === 'unite_base_id');
  
  if (!hasUniteBaseId) {
    db.exec('ALTER TABLE products ADD COLUMN unite_base_id INTEGER REFERENCES unite(id)');
    
    // Mettre à jour les produits existants avec l'unité de base "bouteille" par défaut
    const bottleUnit = db.prepare("SELECT id FROM unite WHERE name = 'bouteille'").get();
    if (bottleUnit) {
      db.exec(`UPDATE products SET unite_base_id = ${bottleUnit.id} WHERE unite_base_id IS NULL`);
    }
  }

  // 5. Ajouter quelques exemples de conversions pour les produits existants
  console.log('📋 Ajout d\'exemples de conversions...');
  const products = db.prepare("SELECT id, name FROM products").all();
  const packUnit = db.prepare("SELECT id FROM unite WHERE name = 'pack'").get();
  const cartonUnit = db.prepare("SELECT id FROM unite WHERE name = 'carton'").get();

  if (products.length > 0 && packUnit && cartonUnit) {
    const insertConversion = db.prepare(`
      INSERT OR IGNORE INTO conversion_unite (product_id, unite_id, quantite_equiv) 
      VALUES (?, ?, ?)
    `);

    products.forEach(product => {
      // 1 pack = 6 bouteilles
      insertConversion.run(product.id, packUnit.id, 6);
      // 1 carton = 24 bouteilles (4 packs)
      insertConversion.run(product.id, cartonUnit.id, 24);
    });
  }

  // Finaliser la transaction
  db.exec('COMMIT');

  console.log('\n✅ Tables créées avec succès !');
  console.log('\n📋 Tables créées :');
  console.log('  - unite : Unités disponibles (bouteille, pack, carton, etc.)');
  console.log('  - conversion_unite : Conversions par produit');
  console.log('  - products.unite_base_id : Unité de base de chaque produit');

  // Afficher les données créées
  console.log('\n📊 Unités créées :');
  const units = db.prepare("SELECT * FROM unite ORDER BY id").all();
  units.forEach(unit => {
    console.log(`  ${unit.id}. ${unit.name} (${unit.abbreviation}) - ${unit.description}`);
  });

  console.log('\n📊 Exemples de conversions :');
  const conversions = db.prepare(`
    SELECT p.name as product_name, u.name as unite_name, c.quantite_equiv
    FROM conversion_unite c
    JOIN products p ON p.id = c.product_id
    JOIN unite u ON u.id = c.unite_id
    ORDER BY p.name, c.quantite_equiv
  `).all();
  
  conversions.forEach(conv => {
    console.log(`  ${conv.product_name}: 1 ${conv.unite_name} = ${conv.quantite_equiv} bouteilles`);
  });

} catch (error) {
  console.error('❌ Erreur lors de la création :', error.message);
  db.exec('ROLLBACK');
} finally {
  db.close();
}
