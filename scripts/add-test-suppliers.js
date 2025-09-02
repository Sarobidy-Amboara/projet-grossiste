import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db');

const testSuppliers = [
  {
    id: 'supp-001',
    name: 'Fournisseur Local',
    contact_person: 'Jean Dupont',
    email: 'jean@fournisseur-local.com',
    phone: '+261 34 12 345 67',
    address: '123 Rue Principale, Antananarivo',
    is_active: 1
  },
  {
    id: 'supp-002', 
    name: 'Import Export Madagascar',
    contact_person: 'Marie Rakoto',
    email: 'marie@import-export.mg',
    phone: '+261 32 98 765 43',
    address: '456 Avenue de l\'Indépendance, Antananarivo',
    is_active: 1
  },
  {
    id: 'supp-003',
    name: 'Distributeur Beverages',
    contact_person: 'Paul Randria',
    email: 'paul@beverages.mg',
    phone: '+261 33 55 44 33',
    address: '789 Boulevard Ravoahangy, Antananarivo',
    is_active: 1
  }
];

console.log('🚀 Ajout des fournisseurs de test...');

try {
  const insertSupplier = db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, name, contact_person, email, phone, address, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const supplier of testSuppliers) {
    insertSupplier.run(
      supplier.id,
      supplier.name,
      supplier.contact_person,
      supplier.email,
      supplier.phone,
      supplier.address,
      supplier.is_active
    );
    console.log(`✅ Fournisseur ajouté: ${supplier.name}`);
  }

  console.log('✅ Tous les fournisseurs de test ont été ajoutés avec succès!');
  
  // Vérification
  const count = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  console.log(`📊 Total fournisseurs dans la base: ${count.count}`);

} catch (error) {
  console.error('❌ Erreur lors de l\'ajout des fournisseurs:', error);
} finally {
  db.close();
}
