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
        s.name as supplier_name,
        u.name as unit_base_name,
        u.abbreviation as unit_base_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
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
    
    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, description, category_id, supplier_id, stock_quantity,
        unit, unit_price, purchase_price, wholesale_price, min_stock_level,
        max_stock_level, image_url, barcode, batch_number, expiry_date,
        is_active, tax_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      productData.name,
      productData.description,
      productData.category_id,
      productData.supplier_id,
      productData.stock_quantity || 0,
      productData.unit,
      productData.unit_price,
      productData.purchase_price,
      productData.wholesale_price,
      productData.min_stock_level,
      productData.max_stock_level,
      productData.image_url,
      productData.barcode,
      productData.batch_number,
      productData.expiry_date,
      productData.is_active ? 1 : 0,
      productData.tax_rate
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
      credit_limit, current_balance || 0, discount_percentage, payment_terms, notes
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

// Routes pour les unités
app.get('/api/units', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM unite ORDER BY name');
    const units = stmt.all();
    res.json(units);
  } catch (error) {
    console.error('Erreur lors de la récupération des unités:', error);
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
    
    const stmt = db.prepare('DELETE FROM unite WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }
    
    res.json({ message: 'Unité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'unité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les conversions d'unités
app.get('/api/unit-conversions', (req, res) => {
  try {
    const { product_id } = req.query;
    
    let query = `
      SELECT 
        cu.*,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        p.name as product_name
      FROM conversion_unite cu
      LEFT JOIN unite u ON cu.unit_id = u.id
      LEFT JOIN products p ON cu.product_id = p.id
    `;
    
    const params = [];
    if (product_id) {
      query += ' WHERE cu.product_id = ?';
      params.push(product_id);
    }
    
    query += ' ORDER BY p.name, u.name';
    
    const stmt = db.prepare(query);
    const conversions = stmt.all(...params);
    res.json(conversions);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/unit-conversions', (req, res) => {
  try {
    const id = Date.now().toString();
    const { product_id, unit_id, equivalent_quantity } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO conversion_unite (id, product_id, unit_id, equivalent_quantity)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(id, product_id, unit_id, equivalent_quantity);
    res.json({ id, message: 'Conversion créée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de la conversion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/unit-conversions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, unit_id, equivalent_quantity } = req.body;
    
    const stmt = db.prepare(`
      UPDATE conversion_unite 
      SET product_id = ?, unit_id = ?, equivalent_quantity = ?, updated_at = CURRENT_TIMESTAMP
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

app.listen(port, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${port}`);
});
