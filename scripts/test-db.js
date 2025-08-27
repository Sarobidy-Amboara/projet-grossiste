import Database from 'better-sqlite3';

console.log('Test de connexion SQLite...');

try {
  // Connexion directe à la base de données
  const db = new Database('mada-brew-boss.db');
  
  // Test simple : récupérer les produits
  const stmt = db.prepare('SELECT * FROM products');
  const products = stmt.all();
  
  console.log('✅ Connexion SQLite réussie !');
  console.log(`📦 Nombre de produits trouvés: ${products.length}`);
  
  if (products.length > 0) {
    console.log('🔍 Premier produit:');
    console.log(products[0]);
  }
  
  // Test des catégories
  const categoriesStmt = db.prepare('SELECT * FROM categories');
  const categories = categoriesStmt.all();
  console.log(`🏷️ Nombre de catégories trouvées: ${categories.length}`);
  
  if (categories.length > 0) {
    console.log('🔍 Première catégorie:');
    console.log(categories[0]);
  }
  
  db.close();
  console.log('✅ Test terminé avec succès !');
  
} catch (error) {
  console.error('❌ Erreur lors du test SQLite:', error);
  process.exit(1);
}
