const Database = require('better-sqlite3');

// Connexion à la base de données
const db = new Database('./mada-brew-boss.db');

try {
  console.log('🚀 Création de la table conversion_unite...');
  
  // Créer la table conversion_unite
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversion_unite (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      unite_id TEXT NOT NULL,
      quantite_equiv REAL NOT NULL DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (unite_id) REFERENCES unite(id)
    );
  `);
  
  console.log('✅ Table conversion_unite créée avec succès');
  
  // Vérifier la structure
  const schema = db.prepare('PRAGMA table_info(conversion_unite)').all();
  console.log('📋 Structure de la table:', schema);
  
  // Créer des index pour améliorer les performances
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversion_product_unit ON conversion_unite(product_id, unite_id);
    CREATE INDEX IF NOT EXISTS idx_conversion_active ON conversion_unite(is_active);
  `);
  
  console.log('🔍 Index créés');
  
  // Insérer un exemple de conversion (1 pack = 6 bouteilles)
  const sampleProductId = db.prepare('SELECT id FROM products LIMIT 1').get()?.id;
  const bottleUnitId = db.prepare('SELECT id FROM unite WHERE name LIKE "%bouteille%" OR abbreviation LIKE "%btl%" LIMIT 1').get()?.id;
  const packUnitId = db.prepare('SELECT id FROM unite WHERE name LIKE "%pack%" OR name LIKE "%carton%" LIMIT 1').get()?.id;
  
  if (sampleProductId && bottleUnitId && packUnitId) {
    const conversionId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    db.prepare(`
      INSERT OR IGNORE INTO conversion_unite (id, product_id, unite_id, quantite_equiv, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(conversionId, sampleProductId, packUnitId, 6);
    
    console.log(`📦 Conversion d'exemple créée: 1 pack = 6 bouteilles pour le produit ${sampleProductId}`);
  }
  
  console.log('✅ Configuration terminée avec succès !');
  
} catch (error) {
  console.error('❌ Erreur:', error);
} finally {
  db.close();
}
