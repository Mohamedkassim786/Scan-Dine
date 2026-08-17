import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Scan & Dine complete database seed...');

  // Clean existing data in dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.addonOption.deleteMany();
  await prisma.addonGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // 1. Create Restaurant: Aurelian
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Aurelian',
      slug: 'aurelian',
      cuisine: 'Modern European & Indian Fusion Gastronomy',
      description: 'A culinary sanctuary of seasonal gastronomy, curated vintage pairings, and immersive ambiance.',
      logoUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLschiOZ0NVcE0OBlkc9Ry8PdhCC_xP8tOOAdTw8D9egbzKblxBr2Q5vJ4_q8q2LnNXjsbXFLijeI_9Mwu0aAjpQAEJnox-qFfmwjtXkXAPokPZ8ahk1arQG0Rfcbu2nV58Vd9D4yrqCY9tg1Ig7GefYRUtX9qDUUjM0Ajvss2AYmmLq6zUvCBkMcbzHDp0gQrag42ljh_wuMBLwJg9IM1bumqKAQn6mA5lmeRPHQRr7RjxckxrT1KIskXw',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZNEXKPCZ9-5qjSkmpJqU4-7cjOJpdcwOXjqAN2a6_3LjxxyGk80QvYJqwt_9vokM5qetmHCy1wvzx0BKKkJCM0tfWx9o-7Mq_YE8Sc_w5QzxTDpLpHa2Qod3SqFY09x4IwcYduZDi6oziWmfQj4mGKn86ZsFUwYYlcGq3cyQJch4R4YzlaKvyH1sH5K4qqNmdVRlIm2vMjX2oeDN4E-cBaLz-mYHruGVAg6fGDinKqOq-P_BXd288',
      address: '42 Royal Observatory Way, Greenwich, London',
      phone: '+44 20 7946 0912',
      email: 'concierge@aurelian.com',
      currency: '₹',
      taxPercentage: 5.0,
      serviceChargePercentage: 0.0,
      isOpen: true,
      openTime: '11:00',
      closeTime: '23:30',
      weeklySchedule: JSON.stringify({
        mon: '11:00 - 23:30',
        tue: '11:00 - 23:30',
        wed: '11:00 - 23:30',
        thu: '11:00 - 23:30',
        fri: '11:00 - 00:00',
        sat: '11:00 - 00:00',
        sun: '11:00 - 23:00',
      }),
      isActive: true,
    },
  });

  console.log(`✅ Created Restaurant: ${restaurant.name} (${restaurant.id})`);

  // 2. Create Users: Admin, Chefs, Staff
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@aurelian.com',
      passwordHash,
      name: 'Julian Vance (Estate Manager)',
      role: 'admin',
      phone: '+44 7700 900123',
      permissions: JSON.stringify(['all']),
      restaurantId: restaurant.id,
    },
  });

  const chef1 = await prisma.user.create({
    data: {
      email: 'chef.marcus@aurelian.com',
      passwordHash,
      name: 'Chef Marcus Sterling',
      role: 'chef',
      phone: '+44 7700 900456',
      permissions: JSON.stringify(['kitchen', 'menu_view']),
      restaurantId: restaurant.id,
    },
  });

  const chef2 = await prisma.user.create({
    data: {
      email: 'chef.elena@aurelian.com',
      passwordHash,
      name: 'Chef Elena Rostova',
      role: 'chef',
      phone: '+44 7700 900789',
      permissions: JSON.stringify(['kitchen', 'menu_view']),
      restaurantId: restaurant.id,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff.oliver@aurelian.com',
      passwordHash,
      name: 'Oliver Bennett (Head Runner)',
      role: 'staff',
      phone: '+44 7700 900333',
      permissions: JSON.stringify(['tables', 'orders_view']),
      restaurantId: restaurant.id,
    },
  });

  console.log(`✅ Created 4 Users: Admin, 2 Chefs, 1 Staff`);

  // 3. Create 8 Tables with QR Codes
  const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
  const tables = [];

  for (let i = 1; i <= 8; i++) {
    const qrToken = `tbl-token-${uuidv4()}`;
    const qrUrl = `${baseUrl}/r/${restaurant.slug}/t/${qrToken}`;
    const qrCodeUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#121414', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: i,
        capacity: i <= 2 ? 2 : i <= 6 ? 4 : 8,
        status: i === 4 ? 'occupied' : i === 8 ? 'payment_pending' : 'available',
        qrToken,
        qrCodeUrl,
        restaurantId: restaurant.id,
        isActive: true,
      },
    });
    tables.push(table);
  }

  console.log(`✅ Created ${tables.length} tables with QR codes`);

  // 4. Create 8 Categories
  const categoryData = [
    { name: 'Chef’s Specials', description: 'Curated signature creations by Executive Chef Marcus', displayOrder: 0 },
    { name: 'Starters & Crudo', description: 'Delicate cold & warm appetizers to awaken the palate', displayOrder: 1 },
    { name: 'Handmade Pasta', description: 'Freshly extruded daily with stone-ground heirloom grains', displayOrder: 2 },
    { name: 'Mains & Robata Grill', description: 'Prime heritage cuts, wood-fired seafood, and roasts', displayOrder: 3 },
    { name: 'Artisan Pizzas', description: '72-hour fermented sourdough with San Marzano DOP', displayOrder: 4 },
    { name: 'Biryani & Rice', description: 'Fragrant dum pukht delicacies slow-cooked in copper vessels', displayOrder: 5 },
    { name: 'Desserts & Dolce', description: 'Sweet epilogues crafted by our master pastry chefs', displayOrder: 6 },
    { name: 'Cellar & Cocktails', description: 'Artisanal botanicals, rare spirits, and vintage reserves', displayOrder: 7 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.create({
      data: {
        ...cat,
        restaurantId: restaurant.id,
      },
    });
    categories[cat.name] = created;
  }

  // 5. Create Menu Items
  const menuItemsData = [
    {
      name: 'Truffle Mushroom Pasta',
      category: 'Handmade Pasta',
      description: 'Hand-rolled tagliatelle, wild forest mushrooms, black winter truffle shavings, and aged Parmigiano-Reggiano.',
      price: 420.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgIpObzZiVfz-eIFITO6eEjDUC57_Y5P3oLSSAyVgI-4ezzjQCY2pSBw8UoEHydn806heXgroMLqbe265u010her4NOrwM8xR7iNp70TTV_qHQGfWgb7N0bw-aHUqE6aNp-MOPBeIZ44Gnpq1tLWwBKO56_orhR944Wx4p8jfcp-BforifYXwXWkUaCk-orawomw4nqpnOtO1MQE17qKPMRpymwR8s_Lu5ZPD27MiyASWIwPFGX7Ii',
      spiceLevel: 'mild',
      prepTime: 15,
      calories: 650,
      dietaryType: 'veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: true,
      ingredients: '00 Flour, Free-range Eggs, Porcini Mushrooms, Black Winter Truffle, Parmigiano-Reggiano, Butter, Thyme',
      allergens: 'Dairy, Gluten, Eggs',
      nutrition: '{"protein":"22g","carbs":"74g","fat":"28g"}',
    },
    {
      name: 'A5 Miyazaki Wagyu Ribeye',
      category: 'Mains & Robata Grill',
      description: 'Prime A5 grade Wagyu, charred over binchotan charcoal, silky truffle pomme purée, and 48-hour bone marrow demi-glace.',
      price: 1850.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWlko3pTGgmyuBvPo2WDS3QwGcmqNVv82nwofwUWq5MIZj8XIez-LQDOwghnZpcCljPD1U0f1fxKcEiXh0NZKDhYILiwNYnjaxCbuLz_8O-TgLUe0cPLvFS78dMfipfpcBIROtFUkyWy7OcK0KbmvahUmtV4cKJuDlk_i4P5KgMj_YjyWcjl9x_vnnlmScBV1LDUexxXHIDztU0gxPgWuPquhBs7AgRPLbtE23g4DiVPfCACngbTsV',
      spiceLevel: 'mild',
      prepTime: 22,
      calories: 820,
      dietaryType: 'non-veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: true,
      ingredients: 'A5 Wagyu Beef, Yukon Gold Potatoes, French Butter, Truffle Carpaccio, Red Wine Jus',
      allergens: 'Dairy',
      nutrition: '{"protein":"54g","carbs":"18g","fat":"62g"}',
    },
    {
      name: 'Saikyo Miso Black Cod',
      category: 'Mains & Robata Grill',
      description: 'Sustainably wild-caught Alaskan black cod marinated for 72 hours in Kyoto sweet saikyo miso with young ginger root.',
      price: 1200.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiMuf02KSMWWdq8_cogVZT3A9b9XGUj90vX4ggYsXKk9eD-RtA2WyLwIyXwVTNn6x9F0xZTYpjcI0W9apB1FEg2hVPt7aHRFBGxnghHy26t_RGdKoqbX5OQpJxVDh8wWZId2fN_ORWSuotcEw5ZSyo0nIdYLFnDglDeugjn61l0ECpbqzbcz-AciqX1xwNsLgS3Aj97tHk63pp2RQ_OHfHF0kCDRgS9ryDysNOXKguX2r5MZ3_0XNy',
      spiceLevel: 'mild',
      prepTime: 18,
      calories: 520,
      dietaryType: 'non-veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: false,
      ingredients: 'Alaskan Black Cod, Saikyo Miso, Mirin, Junmai Sake, Young Ginger',
      allergens: 'Fish, Soy',
      nutrition: '{"protein":"40g","carbs":"16g","fat":"24g"}',
    },
    {
      name: 'Pan-Seared Hokkaido Scallops',
      category: 'Starters & Crudo',
      description: 'Jumbo diver-caught scallops, sweet english pea velvet purée, crispy jamón ibérico crumbs, and Meyer lemon beurre blanc.',
      price: 680.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMRAYtRp96bBM71xR6JFFmxP_RBLECHSEIbNUdzmxzWL3fKxFmr3By8xXsvsFoPDLE3AUVo1tgJV9Z24Apamm5AK7t5J8KCljZppSRsaaX5_gOOoR_79plXI6Ea9gAE4YmoPEBQTmkbxiar4hwbgy9dBHR_dP6KQ0wnTNlUUy-eyQGSt00GXlEIQrLJkZeDEcAQDoYjuMIfHAeRAmM0WrpxzStTv3KRVh5avcO6f_Azrot-YMjVAWD',
      spiceLevel: 'mild',
      prepTime: 12,
      calories: 380,
      dietaryType: 'non-veg',
      isPopular: true,
      isChefPick: false,
      isFeatured: false,
      ingredients: 'Hokkaido Scallops, Sweet Green Peas, Mint, French Butter, Jamón Ibérico, Meyer Lemon',
      allergens: 'Molluscs, Dairy',
      nutrition: '{"protein":"28g","carbs":"12g","fat":"18g"}',
    },
    {
      name: 'Apulian Heirloom Burrata',
      category: 'Starters & Crudo',
      description: 'Handcrafted creamy burrata, sun-ripened Sicilian heirloom tomatoes, Genovese basil emulsion, and 25-year aged balsamic.',
      price: 580.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbcVdD_ffKXp7DadswVFGQzCQpU26snh4_FGkvy1H0ddeOdK6_fKD7GpiDwat1KMCHsCvlms6ofnzc-LdWMXkzMo2YFQneyF3c3d0TV7NPphvYwMa9NJlXGodT6q9S-ivWOuZVWsjLW30lLr6m5ibfDXmasNXXMHgJGYP5qKU50sCxPik3VqI4F9nUcwilaXGTcDFUP-vzr5ER2SBi8UCvD0rEHthaykgEw9ohwMkpzW2514xuQipN',
      spiceLevel: 'none',
      prepTime: 8,
      calories: 450,
      dietaryType: 'veg',
      isPopular: true,
      isChefPick: false,
      isFeatured: false,
      ingredients: 'Bufala Burrata, Heritage Tomatoes, Fresh Basil, Pine Nuts, EVOO, Modena Balsamic',
      allergens: 'Dairy, Tree Nuts',
      nutrition: '{"protein":"18g","carbs":"14g","fat":"34g"}',
    },
    {
      name: 'Tartufo Nero & Wild Mushroom Pizza',
      category: 'Artisan Pizzas',
      description: 'Fior di latte, smoked scamorza, wild chanterelles, fresh black truffle shavings, and white truffle crema base.',
      price: 680.00,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      spiceLevel: 'none',
      prepTime: 12,
      calories: 780,
      dietaryType: 'veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: true,
      ingredients: 'Sourdough Crust, Fior di Latte, Scamorza, Chanterelles, Black Truffle, White Truffle Oil',
      allergens: 'Dairy, Gluten',
      nutrition: '{"protein":"28g","carbs":"84g","fat":"32g"}',
    },
    {
      name: 'Valrhona Dark Chocolate Sphere',
      category: 'Desserts & Dolce',
      description: '70% Guanaja chocolate shell, roasted hazelnut praline mousse, salted caramel heart, melted tableside with warm espresso ganache.',
      price: 420.00,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      spiceLevel: 'none',
      prepTime: 10,
      calories: 520,
      dietaryType: 'veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: false,
      ingredients: 'Valrhona Chocolate, Hazelnut Praline, Fleur de Sel, Espresso, Heavy Cream',
      allergens: 'Dairy, Tree Nuts, Eggs',
      nutrition: '{"protein":"8g","carbs":"48g","fat":"34g"}',
    },
    {
      name: 'Royal Dum Pukht Awadhi Lamb Biryani',
      category: 'Biryani & Rice',
      description: 'Slow cooked under a sourdough purdah seal with long-grain aged basmati, tender mountain lamb cuts, and saffron milk.',
      price: 780.00,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      spiceLevel: 'medium',
      prepTime: 25,
      calories: 860,
      dietaryType: 'non-veg',
      isPopular: true,
      isChefPick: true,
      isFeatured: false,
      ingredients: 'Aged Basmati, British Lamb, Kashmir Saffron, Desi Ghee, Crispy Onions, Mint',
      allergens: 'Dairy',
      nutrition: '{"protein":"42g","carbs":"90g","fat":"34g"}',
    },
  ];

  const createdItems = [];
  for (const item of menuItemsData) {
    const cat = categories[item.category];
    if (!cat) continue;

    const created = await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        spiceLevel: item.spiceLevel,
        prepTime: item.prepTime,
        calories: item.calories,
        dietaryType: item.dietaryType,
        isAvailable: true,
        isPopular: item.isPopular,
        isChefPick: item.isChefPick,
        isFeatured: item.isFeatured,
        ingredients: item.ingredients,
        allergens: item.allergens,
        nutrition: item.nutrition,
        categoryId: cat.id,
        restaurantId: restaurant.id,
      },
    });
    createdItems.push(created);

    // 6. Create Add-on Groups for Pasta / Pizza / Steaks
    if (item.name.includes('Pasta') || item.name.includes('Pizza')) {
      const addonGroup1 = await prisma.addonGroup.create({
        data: {
          name: 'Portion Size',
          description: 'Select serving size',
          minSelections: 1,
          maxSelections: 1,
          isRequired: true,
          menuItemId: created.id,
          options: {
            create: [
              { name: 'Standard Regular', price: 0.0, displayOrder: 0 },
              { name: 'Grande / Sharing (+50%)', price: 180.0, displayOrder: 1 },
            ],
          },
        },
      });

      const addonGroup2 = await prisma.addonGroup.create({
        data: {
          name: 'Gourmet Enhancements',
          description: 'Custom luxury additions',
          minSelections: 0,
          maxSelections: 3,
          isRequired: false,
          menuItemId: created.id,
          options: {
            create: [
              { name: 'Extra Shaved Winter Truffle (5g)', price: 150.0, displayOrder: 0 },
              { name: 'Aged 36-Mo Parmigiano Reggiano', price: 80.0, displayOrder: 1 },
              { name: 'Gluten-Free Handcrafted Dough', price: 50.0, displayOrder: 2 },
            ],
          },
        },
      });
    }
  }

  console.log(`✅ Created ${createdItems.length} menu items with add-on groups`);

  // 7. Create Sample Orders & Payments
  const session4 = await prisma.customerSession.create({
    data: {
      sessionToken: 'session-table-4',
      restaurantId: restaurant.id,
      tableId: tables[3].id, // Table 4
    },
  });

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'A-1082',
      status: 'preparing',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      subtotalAmount: 2270.0,
      taxAmount: 113.5,
      totalAmount: 2383.5,
      specialInstructions: 'Wagyu medium rare please',
      chefAssignedId: chef1.id,
      restaurantId: restaurant.id,
      tableId: tables[3].id,
      sessionId: session4.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtOrder: 1850.0,
            specialInstructions: 'Medium rare',
            menuItemId: createdItems[1].id,
          },
          {
            quantity: 1,
            priceAtOrder: 420.0,
            specialInstructions: 'Extra cheese',
            menuItemId: createdItems[0].id,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: 'new', changedBy: 'customer', note: 'Order placed via QR' },
          { status: 'accepted', changedBy: chef1.name, note: 'Accepted by Kitchen' },
          { status: 'preparing', changedBy: chef1.name, note: 'Started cooking' },
        ],
      },
      payments: {
        create: {
          amount: 2383.5,
          method: 'online',
          status: 'paid',
          provider: 'upi',
          transactionId: 'TXN-UPI-984291',
          paidAt: new Date(),
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const session8 = await prisma.customerSession.create({
    data: {
      sessionToken: 'session-table-8',
      restaurantId: restaurant.id,
      tableId: tables[7].id, // Table 8
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'A-1083',
      status: 'ready',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      subtotalAmount: 1200.0,
      taxAmount: 60.0,
      totalAmount: 1260.0,
      specialInstructions: 'Pay at counter with cash',
      restaurantId: restaurant.id,
      tableId: tables[7].id,
      sessionId: session8.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtOrder: 1200.0,
            menuItemId: createdItems[2].id,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: 'new', changedBy: 'customer' },
          { status: 'accepted', changedBy: chef2.name },
          { status: 'preparing', changedBy: chef2.name },
          { status: 'ready', changedBy: chef2.name, note: 'Plated on pass' },
        ],
      },
      payments: {
        create: {
          amount: 1260.0,
          method: 'cash',
          status: 'pending',
          provider: 'cash',
          restaurantId: restaurant.id,
          notes: 'Customer requested bill settlement at Table 08',
        },
      },
    },
  });

  // 8. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        type: 'new_order',
        title: 'New Order Received',
        message: 'Order #A-1082 received from Table 4 (₹2,383.50).',
        isRead: false,
        metadata: JSON.stringify({ orderId: order1.id, tableNumber: 4 }),
      },
      {
        restaurantId: restaurant.id,
        type: 'payment_pending',
        title: 'Cash Payment Pending',
        message: 'Table 8 placed a cash order #A-1083 (₹1,260.00). Settle at counter.',
        isRead: false,
        metadata: JSON.stringify({ orderId: order2.id, tableNumber: 8 }),
      },
      {
        restaurantId: restaurant.id,
        type: 'table_activity',
        title: 'Table 4 Seated',
        message: 'Customer scanned Table 4 QR and opened live menu.',
        isRead: true,
        metadata: JSON.stringify({ tableNumber: 4 }),
      },
    ],
  });

  // 9. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        userId: admin.id,
        userName: admin.name,
        action: 'RESTAURANT_INITIALIZED',
        entity: 'Restaurant',
        entityId: restaurant.id,
        details: 'Initial restaurant profile & luxury dining settings configured.',
      },
      {
        restaurantId: restaurant.id,
        userId: admin.id,
        userName: admin.name,
        action: 'MENU_SEEDED',
        entity: 'MenuItem',
        entityId: createdItems[0].id,
        details: 'Added seasonal handmade pasta & robata grill selections.',
      },
      {
        restaurantId: restaurant.id,
        userId: admin.id,
        userName: admin.name,
        action: 'QR_GENERATED',
        entity: 'RestaurantTable',
        entityId: tables[0].id,
        details: 'Generated secure dining QR identity for Table 1 - 8.',
      },
    ],
  });

  // 10. Sample Analytics Events
  await prisma.analyticsEvent.createMany({
    data: [
      { restaurantId: restaurant.id, eventType: 'menu_visit', sessionId: 'sess-anon-1', metadata: JSON.stringify({ device: 'Mobile Safari' }) },
      { restaurantId: restaurant.id, eventType: 'food_view', sessionId: 'sess-anon-1', metadata: JSON.stringify({ menuItemId: createdItems[0].id, name: 'Truffle Mushroom Pasta' }) },
      { restaurantId: restaurant.id, eventType: 'food_view', sessionId: 'sess-anon-2', metadata: JSON.stringify({ menuItemId: createdItems[1].id, name: 'A5 Wagyu Ribeye' }) },
      { restaurantId: restaurant.id, eventType: 'cart_add', sessionId: 'sess-anon-1', metadata: JSON.stringify({ menuItemId: createdItems[0].id, quantity: 1 }) },
      { restaurantId: restaurant.id, eventType: 'order_placed', sessionId: 'sess-anon-1', metadata: JSON.stringify({ orderId: order1.id, amount: 2383.5 }) },
      { restaurantId: restaurant.id, eventType: 'ai_interaction', sessionId: 'sess-anon-2', metadata: JSON.stringify({ prompt: 'Recommend wine pairing' }) },
    ],
  });

  console.log('🎉 Complete Scan & Dine Admin database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
