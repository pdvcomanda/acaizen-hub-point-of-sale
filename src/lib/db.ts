
import Dexie, { Table } from 'dexie';

// Define interfaces for each table
export interface UserData {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "cashier";
  createdAt: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
  image?: string;
  categoryId: number;
  stock: number;
  hasAddons: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Addon {
  id?: number;
  name: string;
  price: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id?: number;
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  addons: {
    id: number;
    name: string;
    price: number;
  }[];
  totalPrice: number;
}

export interface Sale {
  id?: number;
  customerName: string;
  total: number;
  paymentMethod: "cash" | "credit" | "debit" | "pix";
  cashReceived?: number;
  change?: number;
  items: SaleItem[];
  createdAt: string;
  operatorId: string;
  operatorName: string;
}

export interface StoreConfig {
  id?: number;
  storeName: string;
  address: string;
  phone: string;
  instagram: string;
  facebook: string;
  printerIpAddress?: string;
  printerPort?: number;
}

class AcaizenDatabase extends Dexie {
  users!: Table<UserData>;
  products!: Table<Product>;
  categories!: Table<Category>;
  addons!: Table<Addon>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  config!: Table<StoreConfig>;

  constructor() {
    super('AcaizenSmartHUB');
    this.version(1).stores({
      users: 'id, email, role',
      products: '++id, categoryId, name',
      categories: '++id, name',
      addons: '++id, productId',
      sales: '++id, paymentMethod, createdAt, operatorId',
      saleItems: '++id, saleId, productId',
      config: 'id'
    });
  }
}

export const db = new AcaizenDatabase();

// Initialize default store configuration
export async function initializeStoreConfig() {
  const configCount = await db.config.count();
  
  if (configCount === 0) {
    await db.config.add({
      id: 1,
      storeName: "Açaízen SmartHUB",
      address: "Rua Arthur Oscar, 220 - Vila Nova, Mansa - RJ",
      phone: "(24) 9933-9007",
      instagram: "@acaizenn",
      facebook: "@açaizen",
      printerIpAddress: "localhost",
      printerPort: 3333
    });
    console.log("Default store configuration created");
  }
}

// Initialize some sample categories and products for testing
export async function initializeSampleData() {
  const categoriesCount = await db.categories.count();
  
  if (categoriesCount === 0) {
    // Add categories
    const categories = [
      {
        name: "Açaí",
        description: "Açaí tradicional e especial",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Bebidas",
        description: "Sucos, refrigerantes e outras bebidas",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Lanches",
        description: "Sanduíches e outros lanches",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const categoryIds = await db.categories.bulkAdd(categories, { allKeys: true });
    
    // Add some products
    const products = [
      {
        name: "Açaí Tradicional 300ml",
        price: 15.90,
        description: "Açaí puro 300ml",
        categoryId: categoryIds[0],
        stock: 100,
        hasAddons: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Açaí Tradicional 500ml",
        price: 20.90,
        description: "Açaí puro 500ml",
        categoryId: categoryIds[0],
        stock: 100,
        hasAddons: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Refrigerante Lata",
        price: 5.00,
        description: "Refrigerante em lata",
        categoryId: categoryIds[1],
        stock: 50,
        hasAddons: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Suco Natural",
        price: 8.00,
        description: "Suco natural de frutas",
        categoryId: categoryIds[1],
        stock: 20,
        hasAddons: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Sanduíche Natural",
        price: 12.00,
        description: "Sanduíche natural com salada",
        categoryId: categoryIds[2],
        stock: 15,
        hasAddons: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const productIds = await db.products.bulkAdd(products, { allKeys: true });
    
    // Add addons for açaí products
    const addons = [
      {
        name: "Granola",
        price: 2.00,
        productId: productIds[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Leite Condensado",
        price: 2.50,
        productId: productIds[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Banana",
        price: 1.50,
        productId: productIds[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Morango",
        price: 3.00,
        productId: productIds[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Granola",
        price: 2.00,
        productId: productIds[1],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Leite Condensado",
        price: 2.50,
        productId: productIds[1],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Banana",
        price: 1.50,
        productId: productIds[1],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Morango",
        price: 3.00,
        productId: productIds[1],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    await db.addons.bulkAdd(addons);
    
    console.log("Sample data created");
  }
}
