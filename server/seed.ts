import { getDb } from "./db";
import { tenants, tenantMemberships, categories, products, customers, suppliers, sales, saleItems, purchases, purchaseItems, expenses } from "../drizzle/schema";

export async function seedDemoData() {
  const db = await getDb();
  if (!db) return;
  console.log("[Seed] Starting demo data seeding for OmniPOS...");
  
  // Check if tenant already exists
  const existingTenants = await db.select().from(tenants).limit(1);
  if (existingTenants.length > 0) {
    console.log("[Seed] Demo data already exists. Skipping.");
    return;
  }

  // We need at least one user to own the tenant. Let's find any user or create a dummy owner if needed.
  // In our system, users authenticate via OAuth. If users table is empty, we can create a sample user or use ownerUserId = 1.
  const tenantId = 1;
  
  // Insert Sample Tenant
  await db.insert(tenants).values({
    id: tenantId,
    name: "Aura Coffee & Gourmet Market",
    slug: "aura-coffee",
    businessType: "Café & Retail",
    currency: "USD",
    taxRate: "8.25",
    receiptFooter: "Thank you for visiting Aura Coffee & Gourmet! Visit us online at auracoffee.com",
    status: "active",
    ownerUserId: 1,
  });

  // Assign user 1 as tenant_admin
  await db.insert(tenantMemberships).values({
    tenantId,
    userId: 1,
    role: "tenant_admin",
    status: "active",
  }).catch(() => {});

  // Seed Categories (10+)
  const categoryNames = [
    { name: "Artisanal Coffee", color: "#8B5CF6" },
    { name: "Fresh Pastries", color: "#EC4899" },
    { name: "Gourmet Sandwiches", color: "#F59E0B" },
    { name: "Cold Beverages & Teas", color: "#10B981" },
    { name: "Organic Snacks", color: "#3B82F6" },
    { name: "Whole Bean Coffee", color: "#6366F1" },
    { name: "Dairy & Plant Milks", color: "#14B8A6" },
    { name: "Breakfast Bowls", color: "#F97316" },
    { name: "Merchandise & Mugs", color: "#84CC16" },
    { name: "Desserts & Sweets", color: "#A855F7" },
  ];

  const categoryIds: Record<string, number> = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const cat = categoryNames[i];
    const res = await db.insert(categories).values({
      tenantId,
      name: cat.name,
      color: cat.color,
    }).$returningId();
    if (res[0]?.id) {
      categoryIds[cat.name] = res[0].id;
    }
  }

  // Seed Products (35+)
  const productData = [
    { name: "Ethiopian Yirgacheffe Pour Over", sku: "COF-ETH-01", barcode: "890123456001", price: "5.50", cost: "1.80", stock: 120, cat: "Artisanal Coffee" },
    { name: "Signature Caffè Latte", sku: "COF-LAT-02", barcode: "890123456002", price: "4.75", cost: "1.50", stock: 200, cat: "Artisanal Coffee" },
    { name: "Double Espresso", sku: "COF-ESP-03", barcode: "890123456003", price: "3.50", cost: "0.90", stock: 250, cat: "Artisanal Coffee" },
    { name: "Cold Brew Nitro", sku: "COF-NIT-04", barcode: "890123456004", price: "5.25", cost: "1.60", stock: 85, cat: "Artisanal Coffee" },
    { name: "Matcha Green Tea Latte", sku: "TEA-MAT-05", barcode: "890123456005", price: "5.75", cost: "2.10", stock: 90, cat: "Cold Beverages & Teas" },
    { name: "Iced Hibiscus Herbal Tea", sku: "TEA-HIB-06", barcode: "890123456006", price: "4.25", cost: "1.10", stock: 110, cat: "Cold Beverages & Teas" },
    { name: "Fresh Butter Croissant", sku: "PAS-CRO-07", barcode: "890123456007", price: "3.85", cost: "1.20", stock: 45, cat: "Fresh Pastries" },
    { name: "Almond Chocolate Danish", sku: "PAS-DAN-08", barcode: "890123456008", price: "4.50", cost: "1.40", stock: 30, cat: "Fresh Pastries" },
    { name: "Blueberry Scone", sku: "PAS-SCO-09", barcode: "890123456009", price: "3.95", cost: "1.25", stock: 4, cat: "Fresh Pastries" }, // Low stock
    { name: "Avocado Sourdough Toast", sku: "SND-AVO-10", barcode: "890123456010", price: "9.50", cost: "3.20", stock: 40, cat: "Gourmet Sandwiches" },
    { name: "Smoked Turkey & Brie Panini", sku: "SND-TUR-11", barcode: "890123456011", price: "11.25", cost: "4.10", stock: 25, cat: "Gourmet Sandwiches" },
    { name: "Caprese Pesto Sandwich", sku: "SND-CAP-12", barcode: "890123456012", price: "10.50", cost: "3.80", stock: 3, cat: "Gourmet Sandwiches" }, // Low stock
    { name: "Organic Acai Energy Bowl", sku: "BOW-ACA-13", barcode: "890123456013", price: "12.00", cost: "4.50", stock: 50, cat: "Breakfast Bowls" },
    { name: "Greek Yogurt Parfait", sku: "BOW-YOG-14", barcode: "890123456014", price: "7.50", cost: "2.50", stock: 60, cat: "Breakfast Bowls" },
    { name: "Handmade Ceramic Mug", sku: "MUG-CER-15", barcode: "890123456015", price: "18.00", cost: "7.00", stock: 35, cat: "Merchandise & Mugs" },
    { name: "Aura Reserve Coffee Bean 12oz", sku: "BEAN-RES-16", barcode: "890123456016", price: "19.50", cost: "8.50", stock: 70, cat: "Whole Bean Coffee" },
    { name: "Single Origin Sumatra Beans", sku: "BEAN-SUM-17", barcode: "890123456017", price: "21.00", cost: "9.20", stock: 40, cat: "Whole Bean Coffee" },
    { name: "Oat Milk 1L Barista Edition", sku: "MILK-OAT-18", barcode: "890123456018", price: "5.25", cost: "2.80", stock: 12, cat: "Dairy & Plant Milks" },
    { name: "Almond Milk 1L", sku: "MILK-ALM-19", barcode: "890123456019", price: "4.95", cost: "2.60", stock: 8, cat: "Dairy & Plant Milks" },
    { name: "Artisanal Dark Chocolate Truffles", sku: "SWE-TRU-20", barcode: "890123456020", price: "8.50", cost: "3.10", stock: 65, cat: "Desserts & Sweets" },
    { name: "Berry Cheesecake Slice", sku: "SWE-CHE-21", barcode: "890123456021", price: "6.75", cost: "2.40", stock: 18, cat: "Desserts & Sweets" },
    { name: "Sea Salt Kettle Chips", sku: "SNA-CHIP-22", barcode: "890123456022", price: "2.75", cost: "0.95", stock: 150, cat: "Organic Snacks" },
    { name: "Almond Butter Protein Bar", sku: "SNA-BAR-23", barcode: "890123456023", price: "3.49", cost: "1.30", stock: 100, cat: "Organic Snacks" },
    { name: "Matcha Energy Bites", sku: "SNA-BIT-24", barcode: "890123456024", price: "4.25", cost: "1.50", stock: 80, cat: "Organic Snacks" },
    { name: "Caramel Macchiato", sku: "COF-MAC-25", barcode: "890123456025", price: "5.25", cost: "1.70", stock: 140, cat: "Artisanal Coffee" },
    { name: "Chai Tea Latte", sku: "TEA-CHAI-26", barcode: "890123456026", price: "4.95", cost: "1.60", stock: 95, cat: "Cold Beverages & Teas" },
    { name: "Lemon Poppy Seed Muffin", sku: "PAS-MUF-27", barcode: "890123456027", price: "3.75", cost: "1.15", stock: 55, cat: "Fresh Pastries" },
    { name: "Roast Beef & Cheddar Baguette", sku: "SND-BEE-28", barcode: "890123456028", price: "11.50", cost: "4.30", stock: 2, cat: "Gourmet Sandwiches" }, // Low stock
    { name: "Tropical Mango Smoothie", sku: "BEV-MAN-29", barcode: "890123456029", price: "7.25", cost: "2.50", stock: 75, cat: "Cold Beverages & Teas" },
    { name: "Stainless Steel Travel Tumbler", sku: "MUG-TUM-30", barcode: "890123456030", price: "24.99", cost: "10.00", stock: 25, cat: "Merchandise & Mugs" },
  ];

  for (const p of productData) {
    const catId = categoryIds[p.cat] ?? 1;
    await db.insert(products).values({
      tenantId,
      categoryId: catId,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      costPrice: p.cost,
      sellingPrice: p.price,
      stockQuantity: p.stock,
      minStockLevel: 5,
      unit: "each",
      status: "active",
      imageUrl: `https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80`,
    }).catch(() => {});
  }

  // Seed Customers (15+)
  const customerNames = [
    { name: "Eleanor Vance", email: "eleanor@example.com", phone: "+1 555-0191", points: 340, spent: "1240.50" },
    { name: "Marcus Thorne", email: "marcus@example.com", phone: "+1 555-0192", points: 180, spent: "650.00" },
    { name: "Sophia Lin", email: "sophia@example.com", phone: "+1 555-0193", points: 420, spent: "1580.25" },
    { name: "David Chen", email: "david@example.com", phone: "+1 555-0194", points: 90, spent: "320.00" },
    { name: "Olivia Martinez", email: "olivia@example.com", phone: "+1 555-0195", points: 510, spent: "1950.80" },
    { name: "Liam O'Connor", email: "liam@example.com", phone: "+1 555-0196", points: 230, spent: "890.40" },
    { name: "Emma Watson", email: "emma@example.com", phone: "+1 555-0197", points: 60, spent: "210.00" },
    { name: "Noah Sterling", email: "noah@example.com", phone: "+1 555-0198", points: 310, spent: "1120.00" },
    { name: "Ava Johnson", email: "ava@example.com", phone: "+1 555-0199", points: 150, spent: "540.00" },
    { name: "Ethan Wright", email: "ethan@example.com", phone: "+1 555-0200", points: 280, spent: "980.50" },
    { name: "Mia Scott", email: "mia@example.com", phone: "+1 555-0201", points: 95, spent: "340.00" },
    { name: "Lucas King", email: "lucas@example.com", phone: "+1 555-0202", points: 440, spent: "1620.00" },
    { name: "Charlotte Green", email: "charlotte@example.com", phone: "+1 555-0203", points: 120, spent: "450.00" },
    { name: "Benjamin Baker", email: "ben@example.com", phone: "+1 555-0204", points: 390, spent: "1410.00" },
    { name: "Amelia Adams", email: "amelia@example.com", phone: "+1 555-0205", points: 210, spent: "780.00" },
  ];

  for (const c of customerNames) {
    await db.insert(customers).values({
      tenantId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      loyaltyPoints: c.points,
      totalSpent: c.spent,
    }).catch(() => {});
  }

  // Seed Suppliers (10+)
  const supplierNames = [
    { name: "Global Coffee Importers", email: "orders@globalcoffee.com", phone: "+1 800-555-0110", notes: "Primary supplier for single origin coffee beans." },
    { name: "Artisan Bakery Supply Co.", email: "dispatch@artisanbakery.com", phone: "+1 800-555-0111", notes: "Fresh daily pastries and breads." },
    { name: "Organic Dairy Farms", email: "supply@organicdairy.com", phone: "+1 800-555-0112", notes: "Milk, butter, and plant-based dairy." },
    { name: "Gourmet Provisions Direct", email: "sales@gourmetprovisions.com", phone: "+1 800-555-0113", notes: "Panini ingredients and spreads." },
    { name: "Eco Packaging Solutions", email: "support@ecopack.com", phone: "+1 800-555-0114", notes: "Cups, lids, and compostable bags." },
    { name: "Matcha & Tea Masters", email: "hello@teamasters.com", phone: "+1 800-555-0115", notes: "Ceremonial grade matcha and herbal teas." },
    { name: "Sweet Treats Wholesale", email: "orders@sweettreats.com", phone: "+1 800-555-0116", notes: "Truffles and dessert cakes." },
    { name: "SnackCraft Distributors", email: "sales@snackcraft.com", phone: "+1 800-555-0117", notes: "Protein bars, chips, and energy bites." },
    { name: "Ceramic Crafts Studio", email: "b2b@ceramiccrafts.com", phone: "+1 800-555-0118", notes: "Handmade mugs and travel tumblers." },
    { name: "Pure Water & Syrups", email: "orders@puresyrups.com", phone: "+1 800-555-0119", notes: "Flavor syrups and beverage ingredients." },
  ];

  for (const s of supplierNames) {
    await db.insert(suppliers).values({
      tenantId,
      name: s.name,
      email: s.email,
      phone: s.phone,
      notes: s.notes,
    }).catch(() => {});
  }

  // Seed Expenses (20+)
  const expenseCategories = ["Rent & Utilities", "Marketing & Ads", "Equipment Maintenance", "Staff Payroll", "Packaging & Supplies", "Software Subscriptions", "Insurance & Legal"];
  for (let i = 1; i <= 20; i++) {
    const cat = expenseCategories[i % expenseCategories.length];
    const amount = (Math.random() * 450 + 50).toFixed(2);
    await db.insert(expenses).values({
      tenantId,
      category: cat,
      amount,
      notes: `Monthly operational expense entry #${i}`,
      createdByUserId: 1,
    }).catch(() => {});
  }

  // Seed Sales (50+) & Purchases (20+)
  for (let i = 1; i <= 50; i++) {
    const saleNumber = `SALE-2026-${1000 + i}`;
    const total = (Math.random() * 65 + 12).toFixed(2);
    const subtotal = (Number(total) / 1.0825).toFixed(2);
    const tax = (Number(total) - Number(subtotal)).toFixed(2);
    await db.insert(sales).values({
      tenantId,
      customerId: (i % 15) + 1,
      saleNumber,
      status: "completed",
      subtotal,
      discount: "0.00",
      tax,
      total,
      paymentMethod: i % 2 === 0 ? "card" : "cash",
      amountReceived: total,
      changeAmount: "0.00",
      createdByUserId: 1,
    }).catch(() => {});
  }

  for (let i = 1; i <= 20; i++) {
    const poNumber = `PO-2026-${500 + i}`;
    const total = (Math.random() * 850 + 200).toFixed(2);
    await db.insert(purchases).values({
      tenantId,
      supplierId: (i % 10) + 1,
      purchaseNumber: poNumber,
      status: "received",
      total,
      notes: `Bulk inventory replenishment order #${i}`,
      createdByUserId: 1,
    }).catch(() => {});
  }

  console.log("[Seed] OmniPOS demo data seeding completed successfully.");
}
