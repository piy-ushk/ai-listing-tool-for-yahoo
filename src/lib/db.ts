import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

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
  category: string;
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
    content: `【商品の状態】\n経年による細かい傷・ヤケ・スレ等がある場合がございます。\n通読には問題ございませんが、完全な美品をお求めの神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_book',
    name: '書籍・単行本・攻略本標準',
    category: 'book',
    content: `【商品の状態】\n中古品ですので細かい傷・スレ・ページの開き癖等ある場合がございます。\n書き込み等は確認できる範囲で記載しておりますが、見落としがある可能性もございます。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_dvd',
    name: 'DVD標準',
    category: 'dvd',
    content: `【商品の状態】\n中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで視聴には問題ありません。\nケース・パッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_bluray',
    name: 'Blu-ray標準',
    category: 'bluray',
    content: `【商品の状態】\n中古Blu-rayとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで問題ありません。\nケース・ジャケットのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_game',
    name: 'ゲームソフト・周辺機器標準',
    category: 'game',
    content: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。起動確認済みです。\nセーブデータやバックアップ電池の残量は保証対象外となります。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_other',
    name: '汎用・その他商品',
    category: 'other',
    content: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。\n状態は掲載写真にてご確認いただき、神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
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

// -------------------------------------------------------------
// Products CRUD (Supabase with Local File DB Fallback)
// -------------------------------------------------------------

export async function getProducts(filters?: {
  search?: string;
  status?: string;
  category?: string;
}): Promise<Product[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('products').select('*').order('updatedAt', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.ilike('category', `%${filters.category}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        let list = data as Product[];
        if (filters?.search && filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          list = list.filter(
            p =>
              p.title.toLowerCase().includes(q) ||
              p.managementNumber.toLowerCase().includes(q) ||
              (p.janIsbn && p.janIsbn.toLowerCase().includes(q)) ||
              (p.publisher && p.publisher.toLowerCase().includes(q))
          );
        }
        return list;
      }
      console.warn('Supabase fetch failed, falling back to local file DB:', error?.message);
    } catch (e: any) {
      console.warn('Supabase error, falling back to file DB:', e.message);
    }
  }

  // Local File Fallback
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

    return products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('Error reading local products file:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) return data as Product;
    } catch (e) {
      // fallback
    }
  }

  const products = await getProducts();
  return products.find(p => p.id === id) || null;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...data,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: data.status || 'pending',
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: inserted, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && inserted) return inserted as Product;
      console.warn('Supabase product insert failed, writing to local file:', error?.message);
    } catch (e: any) {
      console.warn('Supabase product insert error:', e.message);
    }
  }

  // Local File Fallback
  ensureFilesExist();
  const products = await getProducts();
  products.unshift(newProduct);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<Product | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: updated, error } = await supabase
        .from('products')
        .update({ ...updates, updatedAt: now })
        .eq('id', id)
        .select()
        .single();
      if (!error && updated) return updated as Product;
    } catch (e: any) {
      console.warn('Supabase update failed:', e.message);
    }
  }

  ensureFilesExist();
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updated: Product = {
    ...products[index],
    ...updates,
    updatedAt: now,
  };

  products[index] = updated;
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      // fallback
    }
  }

  ensureFilesExist();
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

// -------------------------------------------------------------
// Templates CRUD (Supabase with Local File DB Fallback)
// -------------------------------------------------------------

export async function getTemplates(): Promise<Template[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('templates').select('*').order('createdAt', { ascending: true });
      if (!error && data && data.length > 0) return data as Template[];
    } catch (e: any) {
      console.warn('Supabase templates fetch error:', e.message);
    }
  }

  ensureFilesExist();
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
    const templates: Template[] = JSON.parse(raw);
    return templates;
  } catch (err) {
    console.error('Error reading local templates:', err);
    return DEFAULT_TEMPLATES;
  }
}

export async function getTemplateById(id: string): Promise<Template | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
      if (!error && data) return data as Template;
    } catch (e) {
      // fallback
    }
  }

  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
}

export async function createTemplate(
  data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Template> {
  const now = new Date().toISOString();
  const newTemplate: Template = {
    ...data,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: inserted, error } = await supabase.from('templates').insert([newTemplate]).select().single();
      if (!error && inserted) return inserted as Template;
    } catch (e: any) {
      console.warn('Supabase template create error:', e.message);
    }
  }

  ensureFilesExist();
  const templates = await getTemplates();
  templates.push(newTemplate);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  return newTemplate;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<Template, 'id' | 'createdAt'>>
): Promise<Template | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: updated, error } = await supabase
        .from('templates')
        .update({ ...updates, updatedAt: now })
        .eq('id', id)
        .select()
        .single();
      if (!error && updated) return updated as Template;
    } catch (e: any) {
      console.warn('Supabase template update error:', e.message);
    }
  }

  ensureFilesExist();
  const templates = await getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return null;

  const updated: Template = {
    ...templates[index],
    ...updates,
    updatedAt: now,
  };

  templates[index] = updated;
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      // fallback
    }
  }

  ensureFilesExist();
  const templates = await getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return false;

  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
