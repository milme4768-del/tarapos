require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Outlet = require('../models/Outlet');

const menuData = [
  // ==========================================
  // 1. ROLLS
  // ==========================================
  {
    category: 'Rolls',
    icon: 'Utensils',
    sortOrder: 1,
    products: [
      {
        name: 'Bihari Veg Roll',
        description: 'Authentic Bihari style fresh vegetable roll',
        variants: [{ name: 'Regular', price: 99, unit: 'piece', quantity: 1 }],
      },
      {
        name: 'Bihari Paneer Roll',
        description: 'Spiced cottage cheese wrapped in fresh flaky paratha roll',
        variants: [{ name: 'Regular', price: 149, unit: 'piece', quantity: 1 }],
      },
      {
        name: 'Bihari Double Egg Roll',
        description: 'Double egg wrapped in golden paratha roll',
        variants: [{ name: 'Regular', price: 149, unit: 'piece', quantity: 1 }],
      },
      {
        name: 'Bihari Double Egg Chicken Roll',
        description: 'Juicy chicken chunks and double egg wrapped in crispy roll',
        isPopular: true,
        variants: [{ name: 'Regular', price: 199, unit: 'piece', quantity: 1 }],
      },
      {
        name: 'Bihari Egg Double Mutton Roll',
        description: 'Tender mutton with egg wrapped in aromatic Bihari roll',
        isPopular: true,
        variants: [{ name: 'Regular', price: 299, unit: 'piece', quantity: 1 }],
      },
      {
        name: 'Bread Veg Chicken Egg Flat Roll',
        description: 'Special flat roll packed with vegetables, chicken, and egg',
        variants: [
          { name: 'Half', price: 199, unit: 'portion', quantity: 1 },
          { name: 'Full', price: 299, unit: 'portion', quantity: 1 },
        ],
      },
    ],
  },

  // ==========================================
  // 2. MOGHLAI SPECIALS
  // ==========================================
  {
    category: 'Moghlai Specials',
    icon: 'Flame',
    sortOrder: 2,
    products: [
      {
        name: 'Veg Oglai Moghlai with Chatni',
        description: 'Crispy vegetable moghlai paratha served with house chatni',
        variants: [{ name: 'Regular', price: 99, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Double Egg Oglai Moghlai with Chatni',
        description: 'Rich double egg stuffed moghlai paratha served with chatni',
        variants: [{ name: 'Regular', price: 149, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Paneer Oglai Moghlai with Chatni',
        description: 'Stuffed paneer moghlai served with zesty green chatni',
        variants: [{ name: 'Regular', price: 149, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Double Egg Chicken Oglai Moghlai with Chatni',
        description: 'Stuffed double egg and spiced minced chicken moghlai with chatni',
        isPopular: true,
        variants: [{ name: 'Regular', price: 199, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Double Egg Mutton Oglai Moghlai with Chatni',
        description: 'Signature double egg and mutton moghlai served with chatni',
        isPopular: true,
        variants: [{ name: 'Regular', price: 299, unit: 'portion', quantity: 1 }],
      },
    ],
  },

  // ==========================================
  // 3. EINGARA SINGHARA SPECIALS
  // ==========================================
  {
    category: 'Eingara Singhara Specials',
    icon: 'Sparkles',
    sortOrder: 3,
    products: [
      {
        name: 'Bihari Veg Eingara Singhara',
        description: 'Traditional Bihari spiced potato singhara samosa',
        variants: [{ name: 'Regular', price: 99, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Bihari Veg Paneer Eingara Singhara',
        description: 'Paneer stuffed Bihari eingara singhara',
        variants: [{ name: 'Regular', price: 149, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Bihari Veg Egg Eingara Singhara',
        description: 'Spiced egg and veggie stuffed crispy eingara singhara',
        variants: [{ name: 'Regular', price: 149, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Bihari Veg Chicken Eingara Singhara',
        description: 'Chicken and vegetable infused crispy Bihari singhara',
        variants: [{ name: 'Regular', price: 199, unit: 'portion', quantity: 1 }],
      },
      {
        name: 'Bihari Veg Egg Mutton Eingara Singhara',
        description: 'Royal blend of mutton, egg, and vegetables in crispy pastry',
        isPopular: true,
        variants: [{ name: 'Regular', price: 249, unit: 'portion', quantity: 1 }],
      },
    ],
  },

  // ==========================================
  // 4. LASSI & MOCKTAILS
  // ==========================================
  {
    category: 'Lassi & Mocktails',
    icon: 'Wine',
    sortOrder: 4,
    products: [
      {
        name: 'Bihari Lassi',
        description: 'Traditional thick churned sweet curd lassi',
        isPopular: true,
        variants: [{ name: 'Regular', price: 99, unit: 'glass', quantity: 1 }],
      },
      {
        name: 'Bihari Sattu Ghol',
        description: 'Nutritious roasted gram sattu drink with cumin, mint, and lemon',
        isPopular: true,
        variants: [{ name: 'Regular', price: 49, unit: 'glass', quantity: 1 }],
      },
      {
        name: 'Bihari Makhana Lassi',
        description: 'Rich creamy lassi blended with roasted Fox Nuts (Makhana)',
        variants: [{ name: 'Regular', price: 149, unit: 'glass', quantity: 1 }],
      },
      {
        name: 'Tea - Lassi',
        description: 'Unique infusion blend of tea and sweet chilled lassi',
        variants: [{ name: 'Regular', price: 30, unit: 'glass', quantity: 1 }],
      },
      {
        name: 'Bihari Rasila Kalua Mocktail',
        description: 'Refreshing traditional spiced tangy cooler',
        variants: [{ name: 'Regular', price: 49, unit: 'glass', quantity: 1 }],
      },
      {
        name: 'Bihari Rasila Mocktail',
        description: 'Sweet and tangy Bihar special fruit mocktail',
        variants: [{ name: 'Regular', price: 49, unit: 'glass', quantity: 1 }],
      },
    ],
  },

  // ==========================================
  // 5. HOT BEVERAGES
  // ==========================================
  {
    category: 'Hot Beverages',
    icon: 'Coffee',
    sortOrder: 5,
    products: [
      {
        name: 'Silver Tea',
        description: 'Aromatic pure leaf tea brewed with whole milk',
        isPopular: true,
        variants: [{ name: 'Regular', price: 20, unit: 'cup', quantity: 1 }],
      },
      {
        name: 'Silver Coffee',
        description: 'Hot frothy silver filter coffee',
        variants: [{ name: 'Regular', price: 20, unit: 'cup', quantity: 1 }],
      },
      {
        name: 'Silver Lemon Tea',
        description: 'Fresh lemon tea with a hint of rock salt and mint',
        variants: [{ name: 'Regular', price: 20, unit: 'cup', quantity: 1 }],
      },
    ],
  },

  // ==========================================
  // 6. STARTERS & SNACKS
  // ==========================================
  {
    category: 'Starters & Snacks',
    icon: 'Utensils',
    sortOrder: 6,
    products: [
      {
        name: 'Bihari Veg Chicken Chop (5 Pc)',
        description: 'Crispy fried Bihari style chicken croquettes (5 pieces)',
        variants: [{ name: '5 Pc', price: 99, unit: 'plate', quantity: 5 }],
      },
      {
        name: 'Bihari Veg Mutton Chop (4 Pc)',
        description: 'Spiced minced mutton chops shallow fried golden (4 pieces)',
        isPopular: true,
        variants: [{ name: '4 Pc', price: 199, unit: 'plate', quantity: 4 }],
      },
      {
        name: 'Kuch-Kuchi Mutton Keema',
        description: 'Slow-cooked crushed spiced mutton keema snack',
        variants: [{ name: 'Regular', price: 149, unit: 'plate', quantity: 1 }],
      },
      {
        name: 'Veg Paneer Pakora (10 Pc)',
        description: 'Fresh paneer batter-fried in organic gram flour (10 pieces)',
        variants: [{ name: '10 Pc', price: 99, unit: 'plate', quantity: 10 }],
      },
      {
        name: 'Chiknee Chicken Pakora (12 Pc)',
        description: 'Bite-sized chicken pakoras with tangy chaat masala (12 pieces)',
        isPopular: true,
        variants: [{ name: '12 Pc', price: 99, unit: 'plate', quantity: 12 }],
      },
      {
        name: 'Tarua Bharua (7 Pc)',
        description: 'Crispy traditional Bihari batter-fried vegetable fritters (7 pieces)',
        variants: [{ name: '7 Pc', price: 99, unit: 'plate', quantity: 7 }],
      },
    ],
  },

  // ==========================================
  // 7. MOMOS
  // ==========================================
  {
    category: 'Momos',
    icon: 'Utensils',
    sortOrder: 7,
    products: [
      {
        name: 'Bihari Chicken Momo (6 Pc)',
        description: 'Steamed chicken dumplings with fiery red chili chatni (6 pieces)',
        variants: [{ name: '6 Pc', price: 99, unit: 'plate', quantity: 6 }],
      },
      {
        name: 'Bihari Chicken Fried Momo (6 Pc)',
        description: 'Crispy golden fried chicken momos with spicy garlic dip (6 pieces)',
        isPopular: true,
        variants: [{ name: '6 Pc', price: 149, unit: 'plate', quantity: 6 }],
      },
    ],
  },

  // ==========================================
  // 8. EGG SPECIALS
  // ==========================================
  {
    category: 'Egg Specials',
    icon: 'Sparkles',
    sortOrder: 8,
    products: [
      {
        name: 'Bihari Poch Bread Omelette',
        description: 'Authentic spiced poached egg omelette served with fresh bread',
        variants: [
          { name: 'Single Egg', price: 49, unit: 'portion', quantity: 1 },
          { name: 'Double Egg', price: 69, unit: 'portion', quantity: 2 },
        ],
      },
      {
        name: 'Organic Poch Omelette',
        description: 'Pure organic farm egg poached omelette seasoned with herbs',
        variants: [
          { name: 'Single Egg', price: 29, unit: 'portion', quantity: 1 },
          { name: 'Double Egg', price: 49, unit: 'portion', quantity: 2 },
        ],
      },
    ],
  },

  // ==========================================
  // 9. RAITA & SIDES
  // ==========================================
  {
    category: 'Raita & Sides',
    icon: 'Utensils',
    sortOrder: 9,
    products: [
      {
        name: 'Hariyali Raita Pao Roti (2 Pc)',
        description: 'Herb raita served with 2 pieces of soft pao roti',
        variants: [{ name: 'Regular (2 Pc)', price: 49, unit: 'portion', quantity: 2 }],
      },
      {
        name: 'Bihari Hariyali Raita',
        description: 'Refreshing curd with mint, coriander, and roasted cumin',
        variants: [
          { name: 'Half', price: 49, unit: 'portion', quantity: 1 },
          { name: 'Full', price: 99, unit: 'portion', quantity: 1 },
        ],
      },
    ],
  },

  // ==========================================
  // 10. LITTI SPECIALS
  // ==========================================
  {
    category: 'Litti Specials',
    icon: 'Flame',
    sortOrder: 10,
    products: [
      {
        name: 'Litti with Chatni Chokha',
        description: 'Classic Bihari whole-wheat sattu stuffed litti roasted over charcoal with baingan/aloo chokha and chatni',
        isPopular: true,
        variants: [
          { name: '2 Pc', price: 49, unit: 'plate', quantity: 2 },
          { name: '4 Pc', price: 99, unit: 'plate', quantity: 4 },
          { name: '6 Pc', price: 149, unit: 'plate', quantity: 6 },
        ],
      },
      {
        name: 'Bihari Litti Poch',
        description: 'Crushed hot litti topped with organic egg poch and ghee',
        variants: [{ name: 'Regular', price: 49, unit: 'plate', quantity: 1 }],
      },
      {
        name: 'Litti 2 Pc + Kutting Chicken',
        description: 'Combo: 2 pieces of ghee litti served with spicy kutting chicken gravy',
        isPopular: true,
        variants: [{ name: 'Regular', price: 99, unit: 'plate', quantity: 1 }],
      },
      {
        name: 'Litti 2 Pc + Chicken Pakora',
        description: 'Combo: 2 pieces of roasted litti with crispy chicken pakoras',
        variants: [{ name: 'Regular', price: 99, unit: 'plate', quantity: 1 }],
      },
      {
        name: 'Litti 2 Pc + Mutton Keema',
        description: 'Combo: 2 pieces of hot desi ghee litti served with rich slow-cooked mutton keema',
        isPopular: true,
        variants: [{ name: 'Regular', price: 199, unit: 'plate', quantity: 1 }],
      },
    ],
  },

  // ==========================================
  // 11. CHICKEN SPECIALS
  // ==========================================
  {
    category: 'Chicken Specials',
    icon: 'Flame',
    sortOrder: 11,
    products: [
      {
        name: 'Bihari Veg Chicken',
        description: 'Country style chicken delicacy cooked with organic Bihar whole spices',
        variants: [
          { name: 'Half', price: 49, unit: 'portion', quantity: 1 },
          { name: 'Full', price: 99, unit: 'portion', quantity: 1 },
        ],
      },
      {
        name: 'Kutting Chicken',
        description: 'Special street-style rich spicy diced chicken gravy',
        isPopular: true,
        variants: [
          { name: 'Half', price: 49, unit: 'portion', quantity: 1 },
          { name: 'Full', price: 99, unit: 'portion', quantity: 1 },
        ],
      },
    ],
  },

  // ==========================================
  // 12. MUTTON SPECIALS
  // ==========================================
  {
    category: 'Mutton Specials',
    icon: 'Flame',
    sortOrder: 12,
    products: [
      {
        name: 'Bihari Cutting Mutton Gravy',
        description: 'Tender mutton cuts slow-cooked in traditional Bihari clay-pot gravy',
        isPopular: true,
        variants: [
          { name: 'Half (2 Pc)', price: 259, unit: 'portion', quantity: 2 },
          { name: 'Full (4 Pc)', price: 519, unit: 'portion', quantity: 4 },
        ],
      },
      {
        name: 'Bihari Janglee Mutton Rasila',
        description: 'Rustic hunting-style juicy mutton simmered in whole garlic and organic red chili',
        isPopular: true,
        variants: [
          { name: 'Half (3 Pc)', price: 499, unit: 'portion', quantity: 3 },
          { name: 'Full (6 Pc)', price: 999, unit: 'portion', quantity: 6 },
        ],
      },
      {
        name: 'Mutton Goat Juice',
        description: 'Rich aromatic bone broth and succulent meat juice simmered for hours',
        variants: [
          { name: 'Half (4 Pc)', price: 199, unit: 'portion', quantity: 4 },
          { name: 'Full (8 Pc)', price: 299, unit: 'portion', quantity: 8 },
          { name: 'Full (12 Pc)', price: 599, unit: 'portion', quantity: 12 },
        ],
      },
      {
        name: 'Bihari Mutton Chusta Gravy',
        description: 'Delicacy Bihari spiced mutton chusta cooked in fragrant thick gravy',
        isPopular: true,
        variants: [{ name: 'Regular', price: 199, unit: 'portion', quantity: 1 }],
      },
    ],
  },
];

const importMenu = async () => {
  try {
    console.log('[ImportMenu] Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('[ImportMenu] Clearing old products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    let totalCategories = 0;
    let totalProducts = 0;
    let totalVariants = 0;

    for (const catData of menuData) {
      const category = await Category.create({
        name: catData.category,
        icon: catData.icon || 'Utensils',
        sortOrder: catData.sortOrder || 0,
        isActive: true,
      });
      totalCategories++;

      for (const prodData of catData.products) {
        const variants = prodData.variants.map((v) => ({
          name: v.name,
          price: v.price,
          unit: v.unit || 'portion',
          quantity: v.quantity || 1,
          isActive: true,
        }));

        await Product.create({
          name: prodData.name,
          categoryId: category._id,
          description: prodData.description || '',
          isPopular: Boolean(prodData.isPopular),
          isActive: true,
          variants,
        });

        totalProducts++;
        totalVariants += variants.length;
      }
    }

    // Update settings with branding from the menu card
    await Setting.findOneAndUpdate(
      { key: 'general' },
      {
        restaurantName: 'Taraaang Organic Food',
        tagline: 'Eat Organic Be Healthy — Taste The Authentic Organic Flavours of Bihar',
        phone: '1800 121 2441',
        currency: 'Rs.',
        defaultTaxPercentage: 0,
      },
      { upsert: true }
    );

    await Outlet.updateMany(
      {},
      {
        name: 'Taraaang Organic Food',
        phone: '1800 121 2441',
      }
    );

    console.log('\n==================================================');
    console.log('🎉 MENU IMPORT COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`- Categories created: ${totalCategories}`);
    console.log(`- Products created:   ${totalProducts}`);
    console.log(`- Variants created:   ${totalVariants}`);
    console.log('Branding details updated:');
    console.log('- Restaurant Name:   Taraaang Organic Food');
    console.log('- Toll Free Phone:   1800 121 2441');
    console.log('- Tagline:           Eat Organic Be Healthy');
    console.log('==================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[ImportMenu] Error importing menu:', error);
    process.exit(1);
  }
};

importMenu();
