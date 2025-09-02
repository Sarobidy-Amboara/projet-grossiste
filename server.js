// ...existing code...
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données
const db = new Database('mada-brew-boss.db');

// Routes pour les produits
app.get('/api/products', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        u.name as unit_base_name,
        u.abbreviation as unit_base_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN unite u ON p.unite_base_id = u.id
      WHERE p.is_active = 1
      ORDER BY p.name
    `);
    
    const products = stmt.all();
    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const id = Date.now().toString();
    const productData = req.body;
    // Si is_active n'est pas défini, on le met à 1 (actif par défaut)
    if (typeof productData.is_active === 'undefined') {
      productData.is_active = 1;
    }
    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, description, category_id, stock_quantity,
        unit, unit_price, purchase_price, wholesale_price,
        image_url, barcode, batch_number, expiry_date,
        is_active, tax_rate, unite_base_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      productData.name,
      productData.description,
      productData.category_id,
      productData.stock_quantity || 0,
      productData.unit,
      productData.unit_price,
      productData.purchase_price,
      productData.wholesale_price,
      productData.image_url,
      productData.barcode,
      productData.batch_number,
      productData.expiry_date,
      productData.is_active ? 1 : 0,
      productData.tax_rate,
      productData.unite_base_id
    );

    res.json({ id, ...productData });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    const updateFields = [];
    const values = [];

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    });

    if (updateFields.length === 0) {
      return res.json({ message: 'Aucune modification' });
    }

    const stmt = db.prepare(`
      UPDATE products 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(...values, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - marquer comme inactif
    const stmt = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les catégories
app.get('/api/categories', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    const categories = stmt.all();
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, description, color } = req.body;
    const id = Date.now().toString();
    
    const stmt = db.prepare(`
      INSERT INTO categories (id, name, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(id, name, description, color);
    
    const newCategory = { id, name, description, color, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    const stmt = db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(name, description, color, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    res.json({ id, name, description, color });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les clients
app.get('/api/customers', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM customers WHERE is_active = 1 ORDER BY name');
    const customers = stmt.all();
    res.json(customers);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { 
      name, 
      type, 
      contact_person, 
      phone, 
      email, 
      address, 
      city, 
      tax_number, 
      credit_limit, 
      current_balance, 
      discount_percentage, 
      payment_terms, 
      notes 
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Le nom et le type sont requis' });
    }

    const id = `cust-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO customers (
        id, name, type, contact_person, phone, email, address, city, 
        tax_number, credit_limit, current_balance, discount_percentage, 
        payment_terms, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      id, name, type, contact_person, phone, email, address, city,
      tax_number, credit_limit, current_balance || 0, discount_percentage, payment_terms, notes
    );
    
    if (result.changes > 0) {
      const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      res.status(201).json(newCustomer);
    } else {
      res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      type, 
      contact_person, 
      phone, 
      email, 
      address, 
      city, 
      tax_number, 
      credit_limit, 
      current_balance, 
      discount_percentage, 
      payment_terms, 
      notes 
    } = req.body;

    const stmt = db.prepare(`
      UPDATE customers SET 
        name = ?, type = ?, contact_person = ?, phone = ?, email = ?, 
        address = ?, city = ?, tax_number = ?, credit_limit = ?, 
        current_balance = ?, discount_percentage = ?, payment_terms = ?, 
        notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      name, type, contact_person, phone, email, address, city,
      tax_number, credit_limit, current_balance, discount_percentage, 
      payment_terms, notes, id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - on marque comme inactif au lieu de supprimer
    const stmt = db.prepare('UPDATE customers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/customers/default', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM customers WHERE name = ? AND is_active = 1');
    const defaultCustomer = stmt.get('CLIENT DIVERS');
    res.json(defaultCustomer);
  } catch (error) {
    console.error('Erreur lors de la récupération du client par défaut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les fournisseurs
app.get('/api/suppliers', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name');
    const suppliers = stmt.all();
    res.json(suppliers);
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau fournisseur
app.post('/api/suppliers', (req, res) => {
  console.log('📋 Requête POST /api/suppliers reçue avec body:', JSON.stringify(req.body, null, 2));
  try {
    const id = `supp-${Date.now()}`;
    const { name, contact_person, email, phone, address, is_active = 1 } = req.body;
    
    // Convertir le boolean en nombre pour SQLite
    const isActiveValue = is_active === true || is_active === 1 ? 1 : 0;
    
    console.log('🆔 ID généré:', id);
    console.log('📝 Données à insérer:', { id, name, contact_person, email, phone, address, is_active: isActiveValue });
    
    const stmt = db.prepare(`
      INSERT INTO suppliers (id, name, contact_person, email, phone, address, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    console.log('💾 Préparation de l\'insertion...');
    const result = stmt.run(id, name, contact_person, email, phone, address, isActiveValue);
    console.log('📊 Résultat de l\'insertion:', { changes: result.changes, lastInsertRowid: result.lastInsertRowid });
    
    if (result.changes > 0) {
      const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
      console.log('✅ Fournisseur créé avec succès:', newSupplier);
      res.status(201).json(newSupplier);
    } else {
      throw new Error('Échec de la création du fournisseur - aucun changement détecté');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du fournisseur:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur lors de la création du fournisseur: ' + error.message });
  }
});

// PUT - Modifier un fournisseur
app.put('/api/suppliers/:id', (req, res) => {
  console.log('📋 Requête PUT /api/suppliers/:id reçue');
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;
    
    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    const result = stmt.run(name, contact_person, email, phone, address, id);
    
    if (result.changes > 0) {
      const updatedSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
      console.log('✅ Fournisseur modifié:', updatedSupplier.name);
      res.json(updatedSupplier);
    } else {
      res.status(404).json({ error: 'Fournisseur non trouvé' });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification du fournisseur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du fournisseur' });
  }
});

// DELETE - Supprimer un fournisseur (soft delete)
app.delete('/api/suppliers/:id', (req, res) => {
  console.log('📋 Requête DELETE /api/suppliers/:id reçue');
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE suppliers 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    if (result.changes > 0) {
      console.log('✅ Fournisseur supprimé (soft delete)');
      res.json({ message: 'Fournisseur supprimé avec succès' });
    } else {
      res.status(404).json({ error: 'Fournisseur non trouvé' });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du fournisseur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fournisseur' });
  }
});

// Routes pour les unités
app.get('/api/units', (req, res) => {
  console.log('📋 Requête GET /api/units reçue');
  try {
    const stmt = db.prepare('SELECT * FROM unite ORDER BY name');
    const units = stmt.all();
    console.log('✅ Unités récupérées:', units.length);
    res.json(units);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des unités:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/units', (req, res) => {
  try {
    const id = Date.now().toString();
    const { name, abbreviation, description } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO unite (id, name, abbreviation, description)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(id, name, abbreviation, description);
    res.json({ id, message: 'Unité créée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/units/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, description } = req.body;
    
    const stmt = db.prepare(`
      UPDATE unite 
      SET name = ?, abbreviation = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(name, abbreviation, description, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }
    
    res.json({ message: 'Unité modifiée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/units/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'unité existe
    const checkStmt = db.prepare('SELECT * FROM unite WHERE id = ?');
    const unit = checkStmt.get(id);
    
    if (!unit) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }
    
    // Désactiver temporairement les contraintes de clés étrangères
    db.pragma('foreign_keys = OFF');
    
    // Utiliser une transaction pour les suppressions en cascade
    const transaction = db.transaction(() => {
      // Supprimer les conversions d'unités
      const deleteConversions = db.prepare('DELETE FROM conversion_unite WHERE unite_id = ?');
      deleteConversions.run(id);
      
      // Mettre à NULL les unités de base des produits
      const updateProducts = db.prepare('UPDATE products SET unite_base_id = NULL WHERE unite_base_id = ?');
      updateProducts.run(id);
      
      // Supprimer les mouvements de stock
      const deleteStockMovements = db.prepare('DELETE FROM stock_movements WHERE unit_id = ?');
      deleteStockMovements.run(id);
      
      // Supprimer les items d'achat
      const deletePurchaseItems = db.prepare('DELETE FROM purchase_items WHERE unit_id = ?');
      deletePurchaseItems.run(id);
      
      // Supprimer les prix par tiers qui pourraient référencer cette unité
      const deletePriceTiers = db.prepare('DELETE FROM price_tiers WHERE unit_id = ?');
      deletePriceTiers.run(id);
      
      // Maintenant supprimer l'unité
      const deleteUnit = db.prepare('DELETE FROM unite WHERE id = ?');
      const result = deleteUnit.run(id);
      
      if (result.changes === 0) {
        throw new Error('Unité non trouvée pour suppression');
      }
    });
    
    // Exécuter la transaction
    transaction();
    
    // Réactiver les contraintes de clés étrangères
    db.pragma('foreign_keys = ON');
    
    res.json({ message: 'Unité supprimée avec succès (avec toutes ses dépendances)' });
  } catch (error) {
    // S'assurer que les contraintes sont réactivées en cas d'erreur
    db.pragma('foreign_keys = ON');
    console.error('Erreur lors de la suppression de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

// Routes pour les conversions d'unités
// Endpoint supprimé - utiliser celui à la ligne 1346 qui inclut prix_unitaire

// Old endpoint - temporarily disabled to avoid conflicts
/*
app.post('/api/unit-conversions', (req, res) => {
  try {
    const id = Date.now().toString();
    const { product_id, unit_id, equivalent_quantity } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO conversion_unite (id, product_id, unite_id, quantite_equiv)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(id, product_id, unit_id, equivalent_quantity);
    res.json({ id, message: 'Conversion créée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
*/

app.put('/api/unit-conversions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, unit_id, equivalent_quantity } = req.body;
    
    const stmt = db.prepare(`
      UPDATE conversion_unite 
      SET product_id = ?, unite_id = ?, quantite_equiv = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(product_id, unit_id, equivalent_quantity, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversion non trouvée' });
    }
    
    res.json({ message: 'Conversion modifiée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/unit-conversions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM conversion_unite WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversion non trouvée' });
    }
    
    res.json({ message: 'Conversion supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les achats (purchases)
app.get('/api/purchases', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    const purchases = stmt.all();
    res.json(purchases);
  } catch (error) {
    console.error('Erreur lors de la récupération des achats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/purchases', (req, res) => {
  console.log('📋 Requête POST /api/purchases reçue avec body:', JSON.stringify(req.body, null, 2));
  try {
    const { supplier_id, items } = req.body;
    
    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Données manquantes: supplier_id et items requis' });
    }

    // Créer les tables si elles n'existent pas
    console.log('🔧 Vérification/création des tables purchases...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        supplier_id TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        purchase_date TEXT DEFAULT (DATE('now')),
        notes TEXT,
        created_at TEXT DEFAULT (DATETIME('now')),
        updated_at TEXT DEFAULT (DATETIME('now')),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_id TEXT NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (unit_id) REFERENCES unite(id)
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
        quantity REAL NOT NULL,
        unit_id TEXT NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (DATETIME('now')),
        updated_at TEXT DEFAULT (DATETIME('now')),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (unit_id) REFERENCES unite(id)
      );
    `);

    const purchase_id = `purchase-${Date.now()}`;
    const purchase_date = new Date().toISOString().split('T')[0];

    // Calcul du montant total
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Préparation des requêtes (sans colonnes created_at/updated_at pour purchase_items)
    const insertPurchase = db.prepare(`
      INSERT INTO purchases (id, supplier_id, total_amount, status, purchase_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, 'confirmed', ?, 'Achat validé', datetime('now'), datetime('now'))
    `);

    const insertPurchaseItem = db.prepare(`
            INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_id, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStockMovement = db.prepare(`
      INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_id, reference_type, notes, created_at)
      VALUES (?, ?, 'purchase', ?, ?, ?, 'purchase', ?, datetime('now'))
    `);

    const updateProductStock = db.prepare(`
      UPDATE products 
      SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    // Requête pour récupérer les conversions d'unités
    const getConversion = db.prepare(`
      SELECT quantite_equiv 
      FROM conversion_unite 
      WHERE product_id = ? AND unite_id = ?
    `);

    // Requête pour récupérer l'unité de base du produit
    const getProductBaseUnit = db.prepare(`
      SELECT unite_base_id 
      FROM products 
      WHERE id = ?
    `);

    console.log('💾 Début de la transaction d\'achat...');

    // Transaction pour assurer la cohérence
    const transaction = db.transaction(() => {
      // Créer la commande d'achat
      console.log('📝 Création de la commande d\'achat:', purchase_id);
      insertPurchase.run(purchase_id, supplier_id, total_amount, purchase_date);

      // Traiter chaque article
      items.forEach((item, index) => {
        const item_id = `item-${Date.now()}-${index}`;
        const total_price = item.quantity * item.unit_price;
        
        console.log(`📦 Traitement de l'article ${index + 1}:`, {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_price: item.unit_price
        });

        // Ajouter l'article à la commande
        insertPurchaseItem.run(
          item_id,
          purchase_id,
          item.product_id,
          item.quantity,
          item.unit_id,
          item.unit_price,
          total_price
        );

        // Calculer la quantité en unité de base pour le stock
        const product = getProductBaseUnit.get(item.product_id);
        let baseQuantity = item.quantity;

        if (product && product.unite_base_id !== item.unit_id) {
          // Il faut convertir l'unité
          const conversion = getConversion.get(item.product_id, item.unit_id);
          if (conversion) {
            baseQuantity = item.quantity * conversion.quantite_equiv;
            console.log(`🔄 Conversion: ${item.quantity} ${item.unit_id} = ${baseQuantity} unités de base`);
          } else {
            console.log(`⚠️  Aucune conversion trouvée pour produit ${item.product_id} et unité ${item.unit_id}, utilisation de la quantité directe`);
          }
        }

        // Ajouter le mouvement de stock (entrée)
        const movement_id = `movement-${Date.now()}-${index}`;
        insertStockMovement.run(
          movement_id,
          item.product_id,
          baseQuantity,
          product ? product.unite_base_id : item.unit_id,
          purchase_id,
          `Achat - Commande #${purchase_id}`
        );

        // Mettre à jour le stock du produit (en unité de base)
        console.log(`📈 Mise à jour du stock: +${baseQuantity} pour le produit ${item.product_id}`);
        updateProductStock.run(baseQuantity, item.product_id);
      });
    });

    transaction();
    
    console.log('✅ Achat créé avec succès:', purchase_id);
    res.json({ 
      id: purchase_id, 
      message: 'Achat créé avec succès',
      total_amount: total_amount,
      items_count: items.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'achat:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

app.get('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la commande
    const purchaseStmt = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `);
    const purchase = purchaseStmt.get(id);

    if (!purchase) {
      return res.status(404).json({ error: 'Commande d\'achat non trouvée' });
    }

    // Récupérer les articles
    const itemsStmt = db.prepare(`
      SELECT pi.*, pr.name as product_name, u.name as unit_name, u.abbreviation as unit_abbreviation
      FROM purchase_items pi
      LEFT JOIN products pr ON pi.product_id = pr.id
      LEFT JOIN unite u ON pi.unit_id = u.id
      WHERE pi.purchase_id = ?
    `);
    const items = itemsStmt.all(id);

    res.json({ ...purchase, items });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'achat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const stmt = db.prepare(`
      UPDATE purchases 
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(status, notes, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commande d\'achat non trouvée' });
    }
    
    res.json({ message: 'Commande d\'achat mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'achat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR PROMOTIONS
// =================================

// Récupérer toutes les promotions
app.get('/api/promotions', (req, res) => {
  try {
    const promotions = db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les promotions actives pour un produit
app.get('/api/promotions/active/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date().toISOString();
    
    const promotions = db.prepare(`
      SELECT * FROM promotions 
      WHERE is_active = 1 
      AND start_date <= ? 
      AND end_date >= ?
      AND (applicable_products IS NULL OR applicable_products LIKE ?)
    `).all(now, now, `%"${productId}"%`);
    
    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions actives:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une promotion
app.post('/api/promotions', (req, res) => {
  try {
    const {
      name, description, type, start_date, end_date, min_quantity, min_amount,
      discount_percentage, discount_amount, buy_quantity, get_quantity,
      max_uses_per_customer, max_total_uses, applicable_products, applicable_categories
    } = req.body;

    const id = `promo-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO promotions (
        id, name, description, type, start_date, end_date, min_quantity, min_amount,
        discount_percentage, discount_amount, buy_quantity, get_quantity,
        max_uses_per_customer, max_total_uses, applicable_products, applicable_categories
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      id, name, description, type, start_date, end_date, min_quantity || 1, min_amount || 0,
      discount_percentage, discount_amount, buy_quantity, get_quantity,
      max_uses_per_customer, max_total_uses, 
      JSON.stringify(applicable_products || []), 
      JSON.stringify(applicable_categories || [])
    );
    
    if (result.changes > 0) {
      const newPromotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);
      res.status(201).json(newPromotion);
    }
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR PACKS DE PRODUITS
// =================================

// Récupérer tous les packs
app.get('/api/packs', (req, res) => {
  try {
    const packs = db.prepare(`
      SELECT p.*, 
        GROUP_CONCAT(
          json_object(
            'product_id', pi.product_id,
            'quantity', pi.quantity,
            'product_name', pr.name
          )
        ) as items
      FROM product_packs p
      LEFT JOIN pack_items pi ON p.id = pi.pack_id
      LEFT JOIN products pr ON pi.product_id = pr.id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    
    res.json(packs);
  } catch (error) {
    console.error('Erreur lors de la récupération des packs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un pack
app.post('/api/packs', (req, res) => {
  try {
    const { name, description, pack_price, items } = req.body;
    
    const packId = `pack-${Date.now()}`;
    
    db.transaction(() => {
      // Créer le pack
      const packStmt = db.prepare(`
        INSERT INTO product_packs (id, name, description, pack_price)
        VALUES (?, ?, ?, ?)
      `);
      packStmt.run(packId, name, description, pack_price);
      
      // Ajouter les items du pack
      const itemStmt = db.prepare(`
        INSERT INTO pack_items (id, pack_id, product_id, quantity)
        VALUES (?, ?, ?, ?)
      `);
      
      items.forEach((item, index) => {
        itemStmt.run(`${packId}-item-${index}`, packId, item.product_id, item.quantity);
      });
    })();
    
    const newPack = db.prepare('SELECT * FROM product_packs WHERE id = ?').get(packId);
    res.status(201).json(newPack);
  } catch (error) {
    console.error('Erreur lors de la création du pack:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR PRIX PAR PALIERS
// =================================

// Récupérer les prix par paliers d'un produit
app.get('/api/price-tiers/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const tiers = db.prepare(`
      SELECT * FROM price_tiers 
      WHERE product_id = ? AND is_active = 1 
      ORDER BY min_quantity ASC
    `).all(productId);
    
    res.json(tiers);
  } catch (error) {
    console.error('Erreur lors de la récupération des prix par paliers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Calculer le prix unitaire selon la quantité
app.get('/api/price-tiers/:productId/calculate/:quantity', (req, res) => {
  try {
    const { productId, quantity } = req.params;
    const qty = parseInt(quantity);
    
    const tier = db.prepare(`
      SELECT * FROM price_tiers 
      WHERE product_id = ? AND is_active = 1 
      AND min_quantity <= ? 
      AND (max_quantity IS NULL OR max_quantity >= ?)
      ORDER BY min_quantity DESC 
      LIMIT 1
    `).get(productId, qty, qty);
    
    if (tier) {
      res.json({ unit_price: tier.unit_price, tier_name: tier.tier_name });
    } else {
      // Prix de base du produit
      const product = db.prepare('SELECT unit_price FROM products WHERE id = ?').get(productId);
      res.json({ unit_price: product?.unit_price || 0, tier_name: 'detail' });
    }
  } catch (error) {
    console.error('Erreur lors du calcul du prix par paliers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer/Mettre à jour les prix par paliers
app.post('/api/price-tiers', (req, res) => {
  try {
    const { product_id, tiers } = req.body;
    console.log('📥 Données reçues pour mise à jour des prix:');
    console.log('🆔 Product ID:', product_id);
    console.log('💰 Tiers:', tiers);
    
    db.transaction(() => {
      // Désactiver les anciens paliers
      const disableResult = db.prepare('UPDATE price_tiers SET is_active = 0 WHERE product_id = ?').run(product_id);
      console.log('🔄 Anciens paliers désactivés:', disableResult.changes, 'lignes');
      
      // Créer les nouveaux paliers
      const stmt = db.prepare(`
        INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      tiers.forEach((tier, index) => {
        const id = `tier-${product_id}-${Date.now()}-${index}`;
        const insertResult = stmt.run(id, product_id, tier.tier_name, tier.min_quantity, tier.max_quantity, tier.unit_price);
        console.log(`✅ Nouveau palier créé: ${tier.tier_name} - ${tier.unit_price} MGA (ID: ${id})`);
      });
    })();
    
    console.log('🎉 Transaction terminée avec succès');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur lors de la création des prix par paliers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un seul tier de prix de gros
app.post('/api/price-tiers/add-tier', (req, res) => {
  try {
    const { product_id, tier_name, min_quantity, max_quantity, unit_price, unit_id } = req.body;
    
    // Créer un ID unique pour ce tier
    const id = `tier-${product_id}-${tier_name}-${unit_id || 'base'}-${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price, unit_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `);
    
    const result = stmt.run(id, product_id, tier_name, min_quantity, max_quantity, unit_price, unit_id || 'base');
    
    res.json({ success: true, id: id });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du tier:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Supprimer un palier spécifique
app.delete('/api/price-tiers/:tierId', (req, res) => {
  try {
    const { tierId } = req.params;
    
    const result = db.prepare('DELETE FROM price_tiers WHERE id = ?').run(tierId);
    
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Palier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du palier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR PRIX PAR UNITÉ
// =================================

// Récupérer les prix configurés pour un produit (pour le Point de Vente)
app.get('/api/price-tiers/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    
    const prices = db.prepare(`
      SELECT 
        pt.id,
        pt.tier_name,
        pt.unit_price,
        pt.min_quantity,
        pt.max_quantity,
        pt.unit_id,
        CASE 
          WHEN pt.unit_id = 'base' THEN p.unit
          ELSE u.name
        END as unit_name,
        CASE 
          WHEN pt.unit_id = 'base' THEN p.unit
          ELSE u.abbreviation
        END as unit_abbreviation
      FROM price_tiers pt
      JOIN products p ON pt.product_id = p.id
      LEFT JOIN unite u ON pt.unit_id = u.id
      WHERE pt.product_id = ? AND pt.is_active = 1
      ORDER BY 
        CASE pt.tier_name 
          WHEN 'detail' THEN 1 
          WHEN 'demi_gros' THEN 2 
          WHEN 'gros' THEN 3 
          ELSE 4 
        END,
        pt.min_quantity
    `).all(productId);
    
    // Si aucun prix configuré, retourner un prix détail par défaut
    if (prices.length === 0) {
      res.json([{ 
        tier_name: 'detail', 
        unit_price: 2000, 
        min_quantity: 1,
        unit_name: 'unité',
        unit_abbreviation: 'u'
      }]);
    } else {
      res.json(prices);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des prix:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les prix par unité d'un produit
app.get('/api/price-by-unit/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    
    // Récupérer tous les prix pour ce produit, organisés par tier_name
    const allPrices = db.prepare(`
      SELECT 
        id,
        product_id,
        tier_name,
        min_quantity,
        max_quantity,
        unit_price,
        is_active
      FROM price_tiers 
      WHERE product_id = ? AND is_active = 1
      ORDER BY tier_name, min_quantity
    `).all(productId);

    // Organiser les données selon le format attendu par l'interface
    const pricesMap = {};
    
    allPrices.forEach(price => {
      if (price.tier_name === 'detail') {
        // Prix de base (détail)
        if (!pricesMap['detail']) {
          pricesMap['detail'] = {
            unit_id: 'detail',
            unit_name: 'Détail',
            unit_abbreviation: 'détail',
            selling_price: price.unit_price,
            wholesale_tiers: []
          };
        }
      } else {
        // Prix de gros
        if (!pricesMap['detail']) {
          pricesMap['detail'] = {
            unit_id: 'detail',
            unit_name: 'Détail',
            unit_abbreviation: 'détail',
            selling_price: 0,
            wholesale_tiers: []
          };
        }
        pricesMap['detail'].wholesale_tiers.push({
          tier_name: price.tier_name,
          min_quantity: price.min_quantity,
          max_quantity: price.max_quantity,
          wholesale_price: price.unit_price
        });
      }
    });
    
    res.json(Object.values(pricesMap));
  } catch (error) {
    console.error('Erreur lors de la récupération des prix par unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Sauvegarder les prix par unité
app.post('/api/price-by-unit', (req, res) => {
  try {
    const { product_id, prices } = req.body;
    
    db.transaction(() => {
      // Désactiver tous les anciens prix pour ce produit
      db.prepare('UPDATE price_tiers SET is_active = 0 WHERE product_id = ?').run(product_id);
      
      prices.forEach((price, priceIndex) => {
        // Insérer le prix de base (détail)
        if (price.selling_price > 0) {
          const detailId = `detail-${product_id}-${Date.now()}-${priceIndex}`;
          db.prepare(`
            INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price, is_active)
            VALUES (?, ?, 'detail', 1, 11, ?, 1)
          `).run(detailId, product_id, price.selling_price);
        }
        
        // Insérer les paliers de gros
        if (price.wholesale_tiers && price.wholesale_tiers.length > 0) {
          price.wholesale_tiers.forEach((tier, tierIndex) => {
            const tierId = `tier-${product_id}-${tier.tier_name}-${Date.now()}-${tierIndex}`;
            db.prepare(`
              INSERT INTO price_tiers (id, product_id, tier_name, min_quantity, max_quantity, unit_price, is_active)
              VALUES (?, ?, ?, ?, ?, ?, 1)
            `).run(tierId, product_id, tier.tier_name, tier.min_quantity, tier.max_quantity || null, tier.wholesale_price);
          });
        }
      });
    })();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des prix par unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Calculer le prix de vente selon l'unité et la quantité
app.get('/api/price-by-unit/:productId/:unitId/:quantity', (req, res) => {
  try {
    const { productId, unitId, quantity } = req.params;
    const qty = parseInt(quantity);
    
    // Chercher d'abord un prix de gros applicable
    const wholesalePrice = db.prepare(`
      SELECT tier_name, unit_price, min_quantity
      FROM price_tiers 
      WHERE product_id = ? AND unit_id = ? AND tier_name != 'unit_base' 
      AND is_active = 1 AND min_quantity <= ?
      AND (max_quantity IS NULL OR max_quantity >= ?)
      ORDER BY min_quantity DESC 
      LIMIT 1
    `).get(productId, unitId, qty, qty);
    
    if (wholesalePrice) {
      res.json({ 
        unit_price: wholesalePrice.unit_price, 
        tier_name: wholesalePrice.tier_name,
        is_wholesale: true 
      });
    } else {
      // Prix de base par unité
      const basePrice = db.prepare(`
        SELECT unit_price
        FROM price_tiers 
        WHERE product_id = ? AND unit_id = ? AND tier_name = 'unit_base' AND is_active = 1
      `).get(productId, unitId);
      
      res.json({ 
        unit_price: basePrice?.unit_price || 0, 
        tier_name: 'unit_base',
        is_wholesale: false 
      });
    }
  } catch (error) {
    console.error('Erreur lors du calcul du prix par unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR CONVERSIONS D'UNITÉS
// =================================

// Récupérer les conversions d'unités pour un produit
app.get('/api/unit-conversions', (req, res) => {
  try {
    const { product_id } = req.query;
    
    let query = `
      SELECT 
        cu.id,
        cu.product_id,
        cu.unite_id as unit_id,
        cu.quantite_equiv as equivalent_quantity,
        cu.prix_unitaire,
        cu.is_active,
        cu.created_at,
        cu.updated_at,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        p.name as product_name
      FROM conversion_unite cu
      LEFT JOIN unite u ON cu.unite_id = u.id
      LEFT JOIN products p ON cu.product_id = p.id
    `;
    
    const params = [];
    if (product_id) {
      query += ' WHERE cu.product_id = ? AND cu.is_active = 1';
      params.push(product_id);
    } else {
      query += ' WHERE cu.is_active = 1';
    }
    
    query += ' ORDER BY p.name, u.name';
    
    const stmt = db.prepare(query);
    const conversions = stmt.all(...params);
    console.log(`✅ Conversions récupérées: ${conversions.length} pour product_id: ${product_id || 'tous'}`);
    res.json(conversions);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des conversions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle conversion d'unité
app.post('/api/unit-conversions', (req, res) => {
  try {
    const { product_id, unit_id, equivalent_quantity, prix_unitaire = 0 } = req.body;
    
    console.log('📥 Données reçues pour conversion:', { product_id, unit_id, equivalent_quantity, prix_unitaire });
    
    if (!product_id || !unit_id || !equivalent_quantity) {
      return res.status(400).json({ error: 'Données manquantes: product_id, unit_id et equivalent_quantity requis' });
    }
    
    // Vérifier si la conversion existe déjà
    const existing = db.prepare('SELECT id FROM conversion_unite WHERE product_id = ? AND unite_id = ?').get(product_id, unit_id);
    
    if (existing) {
      // Mettre à jour la conversion existante
      const updateResult = db.prepare(`
        UPDATE conversion_unite 
        SET quantite_equiv = ?, prix_unitaire = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND unite_id = ?
      `).run(equivalent_quantity, prix_unitaire, product_id, unit_id);
      
      console.log(`🔄 Résultat mise à jour:`, { changes: updateResult.changes, equivalent_quantity, prix_unitaire });
      
      // Vérifier ce qui a été sauvé
      const savedData = db.prepare('SELECT * FROM conversion_unite WHERE product_id = ? AND unite_id = ?').get(product_id, unit_id);
      console.log(`📊 Données sauvées dans la DB:`, savedData);
      
      res.json({ id: existing.id, product_id, unit_id, equivalent_quantity, prix_unitaire });
    } else {
      // Créer une nouvelle conversion
      const result = db.prepare(`
        INSERT INTO conversion_unite (product_id, unite_id, quantite_equiv, prix_unitaire, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(product_id, unit_id, equivalent_quantity, prix_unitaire);
      
      console.log(`✅ Résultat insertion:`, { lastInsertRowid: result.lastInsertRowid, equivalent_quantity, prix_unitaire });
      
      // Vérifier ce qui a été sauvé
      const savedData = db.prepare('SELECT * FROM conversion_unite WHERE id = ?').get(result.lastInsertRowid);
      console.log(`📊 Nouvelles données dans la DB:`, savedData);
      
      res.status(201).json({ id: result.lastInsertRowid, product_id, unit_id, equivalent_quantity, prix_unitaire });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une conversion d'unité
app.put('/api/unit-conversions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, unit_id, equivalent_quantity, prix_unitaire = 0 } = req.body;
    
    const stmt = db.prepare(`
      UPDATE conversion_unite 
      SET product_id = ?, unite_id = ?, quantite_equiv = ?, prix_unitaire = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(product_id, unit_id, equivalent_quantity, prix_unitaire, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversion non trouvée' });
    }
    
    console.log(`🔄 Conversion ${id} mise à jour`);
    res.json({ message: 'Conversion mise à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une conversion d'unité
app.delete('/api/unit-conversions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM conversion_unite WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversion non trouvée' });
    }
    
    console.log(`🗑️ Conversion ${id} supprimée`);
    res.json({ message: 'Conversion supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les conversions d'unités pour un produit spécifique
app.get('/api/unit-conversions/product/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    
    const stmt = db.prepare(`
      SELECT 
        cu.id,
        cu.product_id,
        cu.unite_id as unit_id,
        cu.quantite_equiv as equivalent_quantity,
        cu.prix_unitaire,
        cu.is_active,
        cu.created_at,
        cu.updated_at,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        p.name as product_name
      FROM conversion_unite cu
      LEFT JOIN unite u ON cu.unite_id = u.id
      LEFT JOIN products p ON cu.product_id = p.id
      WHERE cu.product_id = ? AND cu.is_active = 1
      ORDER BY u.name
    `);
    
    const conversions = stmt.all(productId);
    console.log(`✅ Conversions pour produit ${productId}: ${conversions.length} trouvées`);
    res.json(conversions);
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des conversions pour le produit ${req.params.productId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =================================
// ENDPOINTS POUR PRIX PAR PALIERS (ANCIENNE VERSION - À CONSERVER POUR COMPATIBILITÉ)
// =================================

// Créer une nouvelle vente
app.post('/api/sales', (req, res) => {
  try {
    const {
      customer_id, sale_items, payment_method, discount_amount = 0, 
      tax_amount = 0, notes = '', applied_promotions = []
    } = req.body;

    if (!sale_items || sale_items.length === 0) {
      return res.status(400).json({ error: 'Aucun article dans la vente' });
    }

    const saleId = `sale-${Date.now()}`;
    const saleNumber = `VEN-${Date.now()}`;
    
    db.transaction(() => {
      let totalAmount = 0;
      
      // Calculer le montant total et vérifier le stock
      const stockCheckStmt = db.prepare('SELECT stock_quantity FROM products WHERE id = ?');
      const calculatedItems = [];
      
      for (const item of sale_items) {
        const stock = stockCheckStmt.get(item.product_id);
        if (!stock || stock.stock_quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour le produit ${item.product_id}`);
        }
        
        // Calculer le prix selon les paliers
        const tierResult = db.prepare(`
          SELECT unit_price, tier_name FROM price_tiers 
          WHERE product_id = ? AND is_active = 1 
          AND min_quantity <= ? 
          AND (max_quantity IS NULL OR max_quantity >= ?)
          ORDER BY min_quantity DESC 
          LIMIT 1
        `).get(item.product_id, item.quantity, item.quantity);
        
        const unitPrice = tierResult?.unit_price || item.unit_price;
        const itemTotal = unitPrice * item.quantity * (1 - (item.discount_percentage || 0) / 100);
        
        calculatedItems.push({
          ...item,
          unit_price: unitPrice,
          total_price: itemTotal
        });
        
        totalAmount += itemTotal;
      }
      
      // Appliquer les promotions
      let promotionDiscount = 0;
      applied_promotions.forEach(promo => {
        if (promo.type === 'pourcentage') {
          promotionDiscount += totalAmount * (promo.discount_percentage / 100);
        } else if (promo.type === 'montant_fixe') {
          promotionDiscount += promo.discount_amount;
        }
        
        // Enregistrer l'utilisation de la promotion
        const usageId = `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO promotion_usage (id, promotion_id, sale_id, customer_id, discount_applied)
          VALUES (?, ?, ?, ?, ?)
        `).run(usageId, promo.id, saleId, customer_id, promotionDiscount);
        
        // Incrementer le compteur d'utilisation
        db.prepare('UPDATE promotions SET current_uses = current_uses + 1 WHERE id = ?').run(promo.id);
      });
      
      const finalAmount = totalAmount - discount_amount - promotionDiscount + tax_amount;
      
      // Créer la vente
      const saleStmt = db.prepare(`
        INSERT INTO sales (
          id, sale_number, customer_id, total_amount, tax_amount, 
          discount_amount, final_amount, payment_method, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      saleStmt.run(
        saleId, saleNumber, customer_id, totalAmount, tax_amount,
        discount_amount + promotionDiscount, finalAmount, payment_method, 'finalise', notes
      );
      
      // Créer les items de vente et mettre à jour le stock
      const itemStmt = db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount_percentage, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
      const stockMovementStmt = db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_type, reference_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      calculatedItems.forEach((item, index) => {
        const itemId = `${saleId}-item-${index}`;
        itemStmt.run(
          itemId, saleId, item.product_id, item.quantity, 
          item.unit_price, item.discount_percentage || 0, item.total_price
        );
        
        // Récupérer les informations du produit et gérer les conversions d'unités
        const productInfo = db.prepare('SELECT unite_base_id FROM products WHERE id = ?').get(item.product_id);
        const unitId = productInfo?.unite_base_id || '1'; // Fallback vers l'unité "bouteille" (ID: 1)
        
        // Vérifier s'il y a une conversion d'unité à appliquer
        let actualQuantityToDecrease = item.quantity;
        
        // Si l'item contient des informations sur l'unité de vente différente de l'unité de base
        if (item.unit_id && item.unit_id !== unitId) {
          const conversion = db.prepare(`
            SELECT quantite_equiv FROM conversion_unite 
            WHERE product_id = ? AND unite_id = ? AND is_active = 1
          `).get(item.product_id, item.unit_id);
          
          if (conversion) {
            actualQuantityToDecrease = item.quantity * conversion.quantite_equiv;
            console.log(`🔄 Conversion appliquée: ${item.quantity} ${item.unit_id} = ${actualQuantityToDecrease} unités de base`);
          }
        }
        
        // Mettre à jour le stock avec la quantité convertie
        updateStockStmt.run(actualQuantityToDecrease, item.product_id);
        
        // Enregistrer le mouvement de stock
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stockMovementStmt.run(
          movementId, item.product_id, 'sale', actualQuantityToDecrease, unitId,
          'vente', saleId, `Vente ${saleNumber}`
        );
      });
      
      // Mise à jour du solde client si paiement à crédit
      if (payment_method === 'credit' && customer_id) {
        const updateBalanceStmt = db.prepare(
          'UPDATE customers SET current_balance = current_balance + ? WHERE id = ?'
        );
        updateBalanceStmt.run(finalAmount, customer_id);
        console.log(`💳 Solde client mis à jour: +${finalAmount} MGA pour client ${customer_id}`);
      }
    })();
    
    const newSale = db.prepare(`
      SELECT s.*, 
        GROUP_CONCAT(
          json_object(
            'product_id', si.product_id,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'total_price', si.total_price
          )
        ) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(saleId);
    
    res.status(201).json(newSale);
  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Route pour récupérer l'historique des ventes
app.get('/api/sales', (req, res) => {
  try {
    const { start_date, end_date, status, customer_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (start_date) {
      whereClause += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }
    
    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      whereClause += ' AND s.customer_id = ?';
      params.push(customer_id);
    }
    
    const salesQuery = `
      SELECT s.*, 
             c.name as customer_name,
             c.phone as customer_phone,
             CASE 
               WHEN s.status = 'termine' THEN 'completed'
               WHEN s.status = 'annule' THEN 'cancelled'
               ELSE s.status
             END as status
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `;
    
    const sales = db.prepare(salesQuery).all(...params);
    
    // Pour chaque vente, récupérer les items
    const salesWithItems = sales.map(sale => {
      const items = db.prepare(`
        SELECT si.*, p.name as product_name, p.unit as product_unit
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(sale.id);
      
      return {
        ...sale,
        items
      };
    });
    
    res.json(salesWithItems);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour l'historique des ventes par période
app.get('/api/sales/history', (req, res) => {
  try {
    const { period } = req.query;
    let whereClause = '';
    const params = [];
    
    const today = new Date().toISOString().split('T')[0];
    
    switch (period) {
      case 'today':
        whereClause = 'WHERE DATE(s.created_at) = ?';
        params.push(today);
        break;
      case 'yesterday':
        whereClause = 'WHERE DATE(s.created_at) = DATE(\'now\', \'-1 day\')';
        break;
      case 'week':
        whereClause = 'WHERE DATE(s.created_at) >= DATE(\'now\', \'-7 days\')';
        break;
      case 'month':
        whereClause = 'WHERE DATE(s.created_at) >= DATE(\'now\', \'-30 days\')';
        break;
      case 'all':
        whereClause = 'WHERE 1=1';
        break;
      default:
        whereClause = 'WHERE DATE(s.created_at) = ?';
        params.push(today);
    }
    
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name,
        COUNT(si.id) as items_count,
        SUM(si.quantity) as total_items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all(...params);
    
    res.json(sales);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques du dashboard
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Ventes d'aujourd'hui
    const todaySales = db.prepare(`
      SELECT 
        COALESCE(SUM(final_amount), 0) as total_sales,
        COUNT(*) as total_transactions,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM sales 
      WHERE DATE(created_at) = ? AND status = 'finalise'
    `).get(today);
    
    // Stock faible
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE stock_quantity <= minimum_stock_level AND is_active = 1
    `).get();
    
    // Top produits du jour
    const topProducts = db.prepare(`
      SELECT 
        p.name,
        SUM(si.quantity) as sales,
        SUM(si.total_price) as revenue,
        'up' as trend
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE DATE(s.created_at) = ? AND s.status = 'finalise'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 5
    `).all(today);
    
    // Articles en stock faible
    const lowStockItems = db.prepare(`
      SELECT name, stock_quantity as stock, minimum_stock_level as minimum
      FROM products 
      WHERE stock_quantity <= minimum_stock_level AND is_active = 1
      ORDER BY (stock_quantity / CAST(minimum_stock_level AS FLOAT))
      LIMIT 5
    `).all();
    
    res.json({
      todayStats: {
        sales: todaySales.total_sales || 0,
        transactions: todaySales.total_transactions || 0,
        customers: todaySales.unique_customers || 0,
        lowStock: lowStockCount.count || 0
      },
      topProducts,
      lowStockItems
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les données de la courbe de CA
app.get('/api/dashboard/revenue-chart', (req, res) => {
  try {
    const { period = '30', startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ? AND status = ?';
      params = [startDate, endDate, 'finalise'];
    } else {
      const days = parseInt(period);
      dateFilter = 'WHERE DATE(created_at) >= date("now", ?) AND status = ?';
      params = [`-${days} days`, 'finalise'];
    }
    
    const revenueData = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as transactions
      FROM sales 
      ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).all(...params);
    
    res.json(revenueData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de revenus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour la gestion du stock
// Sortie de stock manuelle (consommation interne, casse, etc.)
app.post('/api/stock-movements/out', (req, res) => {
  try {
    const { product_id, quantity, unit_id, reason = 'consommation interne', notes = '' } = req.body;
    
    if (!product_id || !quantity || !unit_id) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier si le produit existe et a assez de stock
    const product = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Stock insuffisant' });
    }

    db.transaction(() => {
      const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Enregistrer le mouvement de stock
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_type, reference_id, notes)
        VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?)
      `).run(movementId, product_id, -Math.abs(quantity), unit_id, reason, movementId, notes);

      // Mettre à jour le stock du produit
      db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
        .run(quantity, product_id);
    })();

    res.json({ success: true, message: 'Sortie de stock enregistrée' });
  } catch (error) {
    console.error('Erreur sortie de stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajustement de stock après inventaire
app.post('/api/stock-movements/inventory', (req, res) => {
  try {
    const { product_id, physical_quantity, unit_id, notes = '' } = req.body;
    
    if (!product_id || typeof physical_quantity !== 'number' || !unit_id) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupérer le stock actuel
    const product = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const difference = physical_quantity - product.stock_quantity;
    if (difference === 0) {
      return res.json({ message: 'Aucun ajustement nécessaire', difference: 0 });
    }

    db.transaction(() => {
      const movementId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Enregistrer le mouvement d'ajustement
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_type, reference_id, notes)
        VALUES (?, ?, 'adjustment', ?, ?, 'inventaire', ?, ?)
      `).run(movementId, product_id, difference, unit_id, movementId, `Inventaire - Écart: ${difference > 0 ? '+' : ''}${difference}. ${notes}`);

      // Mettre à jour le stock du produit
      db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?')
        .run(physical_quantity, product_id);
    })();

    res.json({ 
      success: true, 
      message: 'Stock ajusté après inventaire',
      difference,
      old_quantity: product.stock_quantity,
      new_quantity: physical_quantity
    });
  } catch (error) {
    console.error('Erreur inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Historique des mouvements de stock
app.get('/api/stock-movements', (req, res) => {
  try {
    const { product_id, movement_type, start_date, end_date, reference_type } = req.query;
    
    let where = 'WHERE 1=1';
    const params = [];
    
    if (product_id) {
      where += ' AND sm.product_id = ?';
      params.push(product_id);
    }
    
    if (movement_type) {
      where += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }
    
    if (reference_type) {
      where += ' AND sm.reference_type = ?';
      params.push(reference_type);
    }
    
    if (start_date) {
      where += ' AND DATE(sm.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      where += ' AND DATE(sm.created_at) <= ?';
      params.push(end_date);
    }

    const movements = db.prepare(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN unite u ON sm.unit_id = u.id
      ${where}
      ORDER BY sm.created_at DESC
      LIMIT 1000
    `).all(...params);

    res.json(movements);
  } catch (error) {
    console.error('Erreur historique stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les détails d'une vente
app.get('/api/sales/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtenir la vente
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (!sale) {
      return res.status(404).json({ error: 'Vente non trouvée' });
    }
    
    // Obtenir les items de la vente
    const items = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(id);
    
    res.json({
      ...sale,
      items
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour générer un ticket de vente
app.get('/api/sales/:id/ticket', (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtenir la vente avec les détails
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (!sale) {
      return res.status(404).json({ error: 'Vente non trouvée' });
    }
    
    // Obtenir les items de la vente
    const items = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(id);
    
    // Obtenir les informations du client si disponible
    let customer = null;
    if (sale.customer_id) {
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(sale.customer_id);
    }
    
    res.json({
      id: sale.id,
      sale_number: sale.sale_number,
      date_vente: sale.created_at,
      customer,
      items,
      subtotal: sale.sub_total,
      tax_amount: sale.tax_amount,
      discount_amount: sale.discount_amount,
      final_amount: sale.final_amount,
      payment_method: sale.payment_method,
      notes: sale.notes
    });
  } catch (error) {
    console.error('Erreur lors de la génération du ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Annuler une vente
app.post('/api/sales/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Erreur de caisse', cancelled_by, refund_method = 'especes', notes = '' } = req.body;
    
    db.transaction(() => {
      // Vérifier que la vente existe et n'est pas déjà annulée
      const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND status != ?').get(id, 'annule');
      if (!sale) {
        return res.status(404).json({ error: 'Vente non trouvée ou déjà annulée' });
      }
      
      // Récupérer les items de la vente pour restaurer le stock
      const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
      
      // Restaurer le stock
      const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
      const stockMovementStmt = db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_type, reference_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      saleItems.forEach(item => {
        updateStockStmt.run(item.quantity, item.product_id);
        // Récupérer l'unité de base du produit
        const productInfo = db.prepare('SELECT unite_base_id FROM products WHERE id = ?').get(item.product_id);
        const unitId = productInfo?.unite_base_id || '1';
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stockMovementStmt.run(
          movementId, item.product_id, 'adjustment', item.quantity, unitId,
          'annulation_vente', id, `Annulation vente ${sale.sale_number}`
        );
      });
      
      // Marquer la vente comme annulée
      db.prepare('UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('annule', id);
      
      // Enregistrer l'annulation
      const cancellationId = `cancel-${Date.now()}`;
      db.prepare(`
        INSERT INTO sale_cancellations (id, original_sale_id, reason, cancelled_by, refund_method, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cancellationId, id, reason, cancelled_by, refund_method, notes);
    })();
    
    res.json({ success: true, message: 'Vente annulée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une vente (pour corriger les quantités)
app.put('/api/sales/:id/modify', (req, res) => {
  try {
    const { id } = req.params;
    const { items, reason = 'Correction de quantité', modified_by } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items requis pour la modification' });
    }
    
    db.transaction(() => {
      // Vérifier que la vente existe et n'est pas annulée
      const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND status != ?').get(id, 'annule');
      if (!sale) {
        return res.status(404).json({ error: 'Vente non trouvée ou annulée' });
      }
      
      // Récupérer les anciens items pour calculer les différences de stock
      const oldItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
      const oldItemsMap = new Map(oldItems.map(item => [item.product_id, item]));
      
      // Calculer le nouveau montant total
      let newSubTotal = 0;
      const newItems = [];
      
      items.forEach(item => {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          throw new Error(`Produit ${item.product_id} non trouvé`);
        }
        
        const totalPrice = item.quantity * item.unit_price;
        newSubTotal += totalPrice;
        
        newItems.push({
          ...item,
          total_price: totalPrice
        });
      });
      
      // Calculer taxes et total (même logique que la vente originale)
      const taxAmount = newSubTotal * (sale.tax_rate / 100);
      const discount = sale.discount_amount || 0;
      const finalAmount = newSubTotal + taxAmount - discount;
      
      // Supprimer les anciens items
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id);
      
      // Insérer les nouveaux items
      const insertItemStmt = db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      newItems.forEach(item => {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        insertItemStmt.run(itemId, id, item.product_id, item.quantity, item.unit_price, item.total_price);
      });
      
      // Mettre à jour la vente
      db.prepare(`
        UPDATE sales 
        SET sub_total = ?, tax_amount = ?, final_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newSubTotal, taxAmount, finalAmount, id);
      
      // Gérer les mouvements de stock
      const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
      const stockMovementStmt = db.prepare(`
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_id, reference_type, reference_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Restaurer le stock des anciens items
      oldItems.forEach(oldItem => {
        updateStockStmt.run(oldItem.quantity, oldItem.product_id);
        const productInfo = db.prepare('SELECT unite_base_id FROM products WHERE id = ?').get(oldItem.product_id);
        const unitId = productInfo?.unite_base_id || '1';
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stockMovementStmt.run(
          movementId, oldItem.product_id, 'adjustment', oldItem.quantity, unitId,
          'modification_vente', id, `Restauration stock - ${reason}`
        );
      });
      
      // Déduire le stock des nouveaux items
      newItems.forEach(newItem => {
        updateStockStmt.run(-newItem.quantity, newItem.product_id);
        const productInfo = db.prepare('SELECT unite_base_id FROM products WHERE id = ?').get(newItem.product_id);
        const unitId = productInfo?.unite_base_id || '1';
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        stockMovementStmt.run(
          movementId, newItem.product_id, 'adjustment', newItem.quantity, unitId,
          'modification_vente', id, `Nouvelle quantité - ${reason}`
        );
      });
      
      // Enregistrer la modification dans un log
      const modificationId = `mod-${Date.now()}`;
      // Note: Vous pourriez créer une table sale_modifications si nécessaire
      
    })();
    
    res.json({ success: true, message: 'Vente modifiée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de la vente:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Routes pour les paramètres (settings)
app.get('/api/settings', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM settings ORDER BY key');
    const settings = stmt.all();
    res.json(settings);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'La clé est requise' });
    }

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(key, value || '');
    res.json({ success: true, message: 'Paramètre mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paramètre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const stmt = db.prepare('SELECT * FROM settings WHERE key = ?');
    const setting = stmt.get(key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Erreur lors de la récupération du paramètre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les clients avec crédit
app.get('/api/customers/with-credit', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, name, phone, email, current_balance, credit_limit,
        (SELECT COUNT(*) FROM sales WHERE customer_id = customers.id AND payment_method = 'credit') as credit_sales_count,
        (SELECT MAX(sale_date) FROM sales WHERE customer_id = customers.id AND payment_method = 'credit') as last_credit_sale
      FROM customers 
      WHERE current_balance > 0 AND name != 'Client Divers'
      ORDER BY current_balance DESC
    `);
    
    const customers = stmt.all();
    res.json(customers);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients avec crédit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${port}`);
});
