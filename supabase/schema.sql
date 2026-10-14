-- ========================================================
-- Kongo-do AI Listing Platform (金剛洞 AI)
-- Supabase Schema & Initial Data
-- ========================================================

-- 1. Create Products Table (金剛洞 商品データベース)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  "managementNumber" TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  publisher TEXT,
  "janIsbn" TEXT,
  price NUMERIC NOT NULL DEFAULT 1000,
  "buyoutPrice" NUMERIC,
  "conditionRank" TEXT NOT NULL DEFAULT '目立った傷や汚れなし',
  "shippingPayer" TEXT NOT NULL DEFAULT 'seller',
  "shippingMethod" TEXT NOT NULL DEFAULT 'ネコポス',
  "shippingOrigin" TEXT NOT NULL DEFAULT '東京都',
  description TEXT NOT NULL DEFAULT '',
  "imageUrl" TEXT,
  "productType" TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_mng_num ON products("managementNumber");
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products("createdAt" DESC);

-- Enable Row Level Security (open for service role / anon API keys)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for products" ON products FOR ALL USING (true) WITH CHECK (true);

-- 2. Create Templates Table (定型文テンプレート)
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for templates" ON templates FOR ALL USING (true) WITH CHECK (true);

-- 3. Insert Default System Templates
INSERT INTO templates (id, name, category, content, "isDefault")
VALUES
  (
    'tpl_magazine',
    '雑誌・週刊誌（ジャンプ等）標準',
    'magazine',
    '【商品の状態】\n経年による細かい傷・ヤケ・スレ等がある場合がございます。\n通読には問題ございませんが、完全な美品をお求めの神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  ),
  (
    'tpl_book',
    '書籍・単行本・攻略本標準',
    'book',
    '【商品の状態】\n中古品ですので細かい傷・スレ・ページの開き癖等ある場合がございます。\n書き込み等は確認できる範囲で記載しておりますが、見落としがある可能性もございます。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  ),
  (
    'tpl_dvd',
    'DVD標準',
    'dvd',
    '【商品の状態】\n中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで視聴には問題ありません。\nケース・パッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  ),
  (
    'tpl_bluray',
    'Blu-ray標準',
    'bluray',
    '【商品の状態】\n中古Blu-rayとなります。ディスクに細かな傷がある場合がありますが、再生確認済みで問題ありません。\nケース・ジャケットのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  ),
  (
    'tpl_game',
    'ゲームソフト・周辺機器標準',
    'game',
    '【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。起動確認済みです。\nセーブデータやバックアップ電池の残量は保証対象外となります。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  ),
  (
    'tpl_other',
    '汎用・その他商品',
    'other',
    '【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。\n状態は掲載写真にてご確認いただき、神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。',
    true
  )
ON CONFLICT (id) DO NOTHING;
