const Database = require('better-sqlite3');

try {
  const db = new Database('./mada-brew-boss.db');
  
  console.log('🔄 Création de la table unit_conversions...');
  
  // Créer la table unit_conversions
  db.exec(`
    CREATE TABLE IF NOT EXISTS unit_conversions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      equivalent_quantity REAL NOT NULL DEFAULT 1.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (unit_id) REFERENCES units(id),
      UNIQUE(product_id, unit_id)
    )
  `);
  
  console.log('✅ Table unit_conversions créée avec succès !');
  
  // Vérifier la structure
  console.log('\n📋 Structure de la table :');
  const schema = db.prepare('PRAGMA table_info(unit_conversions)').all();
  schema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  db.close();
  console.log('\n🎉 Opération terminée !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
