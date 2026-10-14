import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  managementNumber: string;
  title: string;
  category: string;
  publisher?: string;
  janIsbn?: string;
  price: number;
  buyoutPrice?: number | null;
  conditionRank: string;
  shippingPayer: 'seller' | 'buyer';
  shippingMethod: string;
  shippingOrigin: string;
  description: string;
  imageUrl?: string | null;
  productType: string;
  status: 'pending' | 'listed' | 'sold';
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: string; // 'book' | 'magazine' | 'dvd' | 'bluray' | 'game' | 'other' | 'all'
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl_magazine',
    name: '雑誌・週刊誌（ジャンプ等）標準',
    category: 'magazine',
    content: `【商品の状態】
経年による細かい傷・ヤケ・スレ等がある場合がございます。
通読には問題ございませんが、完全な美品をお求めの神経質な方のご入札はご遠慮ください。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_book',
    name: '書籍・単行本・攻略本標準',
    category: 'book',
    content: `【商品の状態】
中古品ですので細かい傷・スレ・ページの開き癖等ある場合がございます。
書き込み等は確認できる範囲で記載しておりますが、見落としがある可能性もございます。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_dvd',
    name: 'DVD標準',
    category: 'dvd',
    content: `【商品の状態】
中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで視聴には問題ありません。
ケース・パッケージのスレ等はご了承ください。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_bluray',
    name: 'Blu-ray標準',
    category: 'bluray',
    content: `【商品の状態】
中古Blu-rayとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで問題ありません。
ケース・ジャケットのスレ等はご了承ください。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_game',
    name: 'ゲームソフト・周辺機器標準',
    category: 'game',
    content: `【商品の状態】
中古品ですので細かい傷・スレ等ある場合がございます。起動確認済みです。
セーブデータやバックアップ電池の残量は保証対象外となります。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_other',
    name: '汎用・その他商品',
    category: 'other',
    content: `【商品の状態】
中古品ですので細かい傷・スレ等ある場合がございます。
状態は掲載写真にてご確認いただき、神経質な方のご入札はご遠慮ください。
写真に写っているものが全てとなります。
ノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ensureFilesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), 'utf-8');
  }
}

// Read products safely
export async function getProducts(filters?: {
  search?: string;
  status?: string;
  category?: string;
}): Promise<Product[]> {
  ensureFilesExist();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    let products: Product[] = JSON.parse(raw);

    if (filters?.status && filters.status !== 'all') {
      products = products.filter(p => p.status === filters.status);
    }

    if (filters?.category && filters.category !== 'all') {
      products = products.filter(p => p.category.includes(filters.category!) || p.productType === filters.category);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.managementNumber.toLowerCase().includes(q) ||
          (p.janIsbn && p.janIsbn.toLowerCase().includes(q)) ||
          (p.publisher && p.publisher.toLowerCase().includes(q))
      );
    }

    // Sort by latest updated first
    return products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('Error reading products:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find(p => p.id === id) || null;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  ensureFilesExist();
  const products = await getProducts();
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...data,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: data.status || 'pending',
    createdAt: now,
    updatedAt: now,
  };

  products.unshift(newProduct);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<Product | null> {
  ensureFilesExist();
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updated: Product = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updated;
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  ensureFilesExist();
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

// Templates CRUD
export async function getTemplates(): Promise<Template[]> {
  ensureFilesExist();
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
    const templates: Template[] = JSON.parse(raw);
    return templates;
  } catch (err) {
    console.error('Error reading templates:', err);
    return DEFAULT_TEMPLATES;
  }
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
}

export async function createTemplate(
  data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Template> {
  ensureFilesExist();
  const templates = await getTemplates();
  const now = new Date().toISOString();

  const newTemplate: Template = {
    ...data,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  templates.push(newTemplate);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  return newTemplate;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<Template, 'id' | 'createdAt'>>
): Promise<Template | null> {
  ensureFilesExist();
  const templates = await getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return null;

  const updated: Template = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  ensureFilesExist();
  const templates = await getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return false;

  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
