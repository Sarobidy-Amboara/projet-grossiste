import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db');

console.log('=== INSPECTION DE LA BASE DE DONNÉES ===\n');

// Lister toutes les tables
console.log('📋 TABLES EXISTANTES:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

console.log('\n' + '='.repeat(50));

// Contenu de la table categories
console.log('\n📁 TABLE CATEGORIES:');
try {
  const categories = db.prepare('SELECT * FROM categories').all();
  if (categories.length === 0) {
    console.log('  ❌ Aucune catégorie trouvée');
  } else {
    console.log(`  ✅ ${categories.length} catégorie(s) trouvée(s):`);
    categories.forEach((cat, index) => {
      console.log(`    ${index + 1}. ID: ${cat.id} | Nom: "${cat.name}" | Couleur: ${cat.color || 'N/A'}`);
      if (cat.description) console.log(`       Description: ${cat.description}`);
    });
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
}

console.log('\n' + '='.repeat(50));

// Contenu de la table products
console.log('\n📦 TABLE PRODUCTS:');
try {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
  `).all();
  
  if (products.length === 0) {
    console.log('  ❌ Aucun produit trouvé');
  } else {
    console.log(`  ✅ ${products.length} produit(s) trouvé(s):`);
    products.forEach((prod, index) => {
      console.log(`    ${index + 1}. ID: ${prod.id}`);
      console.log(`       Nom: "${prod.name}"`);
      console.log(`       Catégorie: ${prod.category_name || 'Non définie'}`);
      console.log(`       Prix vente: ${prod.unit_price} MGA`);
      console.log(`       Stock: ${prod.stock_quantity} ${prod.unit || 'unités'}`);
      console.log(`       Actif: ${prod.is_active ? 'Oui' : 'Non'}`);
      console.log('');
    });
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
}

console.log('\n' + '='.repeat(50));

// Contenu de la table customers
console.log('\n👥 TABLE CUSTOMERS:');
try {
  const customers = db.prepare('SELECT * FROM customers').all();
  if (customers.length === 0) {
    console.log('  ❌ Aucun client trouvé');
  } else {
    console.log(`  ✅ ${customers.length} client(s) trouvé(s):`);
    customers.forEach((cust, index) => {
      console.log(`    ${index + 1}. ID: ${cust.id}`);
      console.log(`       Nom: "${cust.name}"`);
      console.log(`       Type: ${cust.type}`);
      console.log(`       Ville: ${cust.city || 'N/A'}`);
      console.log(`       Solde: ${cust.current_balance || 0} MGA`);
      console.log('');
    });
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
}

console.log('\n' + '='.repeat(50));

// Contenu de la table suppliers
console.log('\n🏭 TABLE SUPPLIERS:');
try {
  const suppliers = db.prepare('SELECT * FROM suppliers').all();
  if (suppliers.length === 0) {
    console.log('  ❌ Aucun fournisseur trouvé');
  } else {
    console.log(`  ✅ ${suppliers.length} fournisseur(s) trouvé(s):`);
    suppliers.forEach((supp, index) => {
      console.log(`    ${index + 1}. ID: ${supp.id}`);
      console.log(`       Nom: "${supp.name}"`);
      console.log(`       Contact: ${supp.contact_person || 'N/A'}`);
      console.log(`       Téléphone: ${supp.phone || 'N/A'}`);
      console.log('');
    });
  }
} catch (error) {
  console.log(`  ❌ Erreur: ${error.message}`);
}

db.close();
console.log('\n✅ Inspection terminée !');
