import { Product } from './Product';

export const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
    category: 'Electronics',
    price: 199.99,
    stock: 45,
    sku: 'WBH-001',
    weight: 0.25,
    dimensions: {
      length: 20,
      width: 18,
      height: 8
    },
    imageUrl: 'https://example.com/images/headphones.jpg',
    brand: 'AudioTech',
    isActive: true
  },
  {
    id: '2',
    name: 'Ergonomic Office Chair',
    description: 'Comfortable office chair with lumbar support and adjustable height',
    category: 'Furniture',
    price: 349.99,
    stock: 12,
    sku: 'EOC-002',
    weight: 15.5,
    dimensions: {
      length: 65,
      width: 65,
      height: 120
    },
    imageUrl: 'https://example.com/images/chair.jpg',
    brand: 'ComfortSeating',
    isActive: true
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours',
    category: 'Sports & Outdoors',
    price: 34.99,
    stock: 78,
    sku: 'SSWB-003',
    weight: 0.4,
    dimensions: {
      length: 7,
      width: 7,
      height: 28
    },
    imageUrl: 'https://example.com/images/bottle.jpg',
    brand: 'HydroMax',
    isActive: true
  },
  {
    id: '4',
    name: 'Organic Cotton T-Shirt',
    description: 'Soft and breathable organic cotton t-shirt in various colors',
    category: 'Clothing',
    price: 24.99,
    stock: 156,
    sku: 'OCT-004',
    weight: 0.2,
    dimensions: {
      length: 30,
      width: 25,
      height: 1
    },
    imageUrl: 'https://example.com/images/tshirt.jpg',
    brand: 'EcoWear',
    isActive: true
  },
  // Products 5-10 added 2026-09-20 for the 22 September local checks (seed
  // data brief) - three more Electronics items plus one each for the
  // remaining categories, so the catalog holds 10 products across the 4
  // categories the scaffold already declared rather than inventing new ones.
  {
    id: '5',
    name: '15-inch Ultrabook Laptop',
    description: 'Slim aluminum-body laptop with a 15-inch display, all-day battery and a fast NVMe SSD',
    category: 'Electronics',
    price: 1299.00,
    stock: 3, // deliberately near out-of-stock - see README seed-data note
    sku: 'UBL-005',
    weight: 1.6,
    dimensions: {
      length: 34,
      width: 24,
      height: 1.8
    },
    imageUrl: 'https://example.com/images/ultrabook.jpg',
    brand: 'NimbusTech',
    isActive: true
  },
  {
    id: '6',
    name: 'Mechanical Keyboard RGB',
    description: 'Hot-swappable mechanical keyboard with per-key RGB lighting and tactile brown switches',
    category: 'Electronics',
    price: 89.99,
    stock: 60,
    sku: 'MKB-006',
    weight: 0.9,
    dimensions: {
      length: 44,
      width: 14,
      height: 3.5
    },
    imageUrl: 'https://example.com/images/keyboard.jpg',
    brand: 'KeyForge',
    isActive: true
  },
  {
    id: '7',
    name: '27-inch 4K Monitor',
    description: '27-inch IPS 4K display with USB-C power delivery and an adjustable stand',
    category: 'Electronics',
    price: 429.00,
    stock: 24,
    sku: 'MON-007',
    weight: 5.4,
    dimensions: {
      length: 61,
      width: 20,
      height: 47
    },
    imageUrl: 'https://example.com/images/monitor.jpg',
    brand: 'ViewCrest',
    isActive: true
  },
  {
    id: '8',
    name: 'Adjustable Standing Desk',
    description: 'Electric height-adjustable desk with memory presets and a 120x60cm work surface',
    category: 'Furniture',
    price: 599.00,
    stock: 8,
    sku: 'ASD-008',
    weight: 38,
    dimensions: {
      length: 120,
      width: 60,
      height: 75
    },
    imageUrl: 'https://example.com/images/standing-desk.jpg',
    brand: 'ElevateWorks',
    isActive: true
  },
  {
    id: '9',
    name: 'Premium Yoga Mat',
    description: 'Extra-thick non-slip yoga mat with a carrying strap, ideal for home workouts',
    category: 'Sports & Outdoors',
    price: 39.99,
    stock: 500, // deliberately plentiful - see README seed-data note
    sku: 'PYM-009',
    weight: 1.1,
    dimensions: {
      length: 183,
      width: 61,
      height: 0.6
    },
    imageUrl: 'https://example.com/images/yoga-mat.jpg',
    brand: 'FlexCore',
    isActive: true
  },
  {
    id: '10',
    name: 'Tech Hoodie Unisex',
    description: 'Soft fleece hoodie with a hidden chest pocket sized for a phone or tablet',
    category: 'Clothing',
    price: 54.99,
    stock: 90,
    sku: 'THU-010',
    weight: 0.6,
    dimensions: {
      length: 32,
      width: 27,
      height: 2
    },
    imageUrl: 'https://example.com/images/tech-hoodie.jpg',
    brand: 'EcoWear',
    isActive: true
  }
];

export const customerDiscounts: Record<string, number> = {
  'customer-1': 10, // 10% discount
  'customer-2': 15, // 15% discount
  'customer-3': 5,  // 5% discount
};