"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';
import CategoryModal from '../components/CategoryModal';

// Generate a random management number e.g. "60925a"
const generateMngNumber = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  return `${num}${letter}`;
};

// Fallback boilerplates in case /api/templates is still loading
const INITIAL_BOILERPLATES: Record<string, string> = {
  magazine: `【商品の状態】\n経年による細かい傷・ヤケ・スレ等がある場合がございます。\n通読には問題ございませんが、完全な美品をお求めの神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  book: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  dvd: `【商品の状態】\n中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生には問題ありません。\nパッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  bluray: `【商品の状態】\n中古Blu-rayとなります。ディスクに細かな傷がある場合がありますが、再生には問題ありません。\nパッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  game: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。動作確認済みです。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  other: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
};

const CONDITION_RANKS = [
  '新品、未使用',
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
  '全体的に状態が悪い',
];

const SHIPPING_METHODS = [
  'ネコポス',
  'ゆうパケット',
  '宅急便（EAZY）',
  'ゆうパック',
  'レターパックプラス',
  'レターパックライト',
  '定形外郵便',
  'その他',
];

// Helper: Compress and resize image client-side before sending to serverless function
const compressImage = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  content: string;
  isDefault?: boolean;
}

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  
  // AI Raw Results
  const [rawAiResult, setRawAiResult] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Editable Draft State — management number auto-generated on client mount
  const [mngNumber, setMngNumber] = useState('');

  useEffect(() => {
    setMngNumber(generateMngNumber());
  }, []);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [draftPublisher, setDraftPublisher] = useState('');
  const [draftJanIsbn, setDraftJanIsbn] = useState('');
  const [draftPrice, setDraftPrice] = useState<number>(1000);
  const [draftBuyoutPrice, setDraftBuyoutPrice] = useState<number | ''>('');
  const [draftCondition, setDraftCondition] = useState<string>('目立った傷や汚れなし');
  const [draftShippingPayer, setDraftShippingPayer] = useState<'seller' | 'buyer'>('seller');
  const [draftShippingMethod, setDraftShippingMethod] = useState<string>('ネコポス');
  const [draftDescription, setDraftDescription] = useState('');
  const [detectedProductType, setDetectedProductType] = useState('other');

  // Templates from API
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_other');
  const [descriptionMode, setDescriptionMode] = useState<'template_only' | 'template_manual' | 'template_ai'>('template_manual');
  const [useAiDesc, setUseAiDesc] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Workflow Control: AI Auto-Analysis Toggle & Keep Previous Data Toggle
  const [autoAiAnalyze, setAutoAiAnalyze] = useState(true);
  const [keepPreviousData, setKeepPreviousData] = useState(true);

  // Database / Queue counts
  const [dbProductCount, setDbProductCount] = useState<number>(0);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Fetch templates & DB product count on mount
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
          setSelectedTemplateId(prev => {
            const exists = data.templates.some((t: TemplateItem) => t.id === prev);
            return exists ? prev : data.templates[0].id;
          });
        }
      })
      .catch(err => console.error("Could not fetch templates", err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setDbProductCount(data.products.length);
        }
      })
      .catch(err => console.error("Could not fetch product count", err));
  }, []);

  // Execute AI analysis on demand
  const runAiAnalysis = async (base64String: string) => {
    setIsUploading(true);
    setRawAiResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64String })
      });

      let data: any;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        if (response.status === 413) {
          throw new Error('画像サイズが大きすぎます（Vercel 4.5MB制限）。');
        }
        throw new Error(`サーバーエラー (${response.status})`);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || `解析に失敗しました (${response.status})`);
      }

      setRawAiResult(data);

      // Populate Draft
      setDraftTitle(data.title || '');
      setDraftCategory(data.category || '');
      setIsCustomCategory(false);
      setDraftPublisher(data.publisher || '');
      if (data.jan_isbn) {
        setDraftJanIsbn(data.jan_isbn);
      }

      const pType = data.product_type || 'other';
      setDetectedProductType(pType);

      // Auto-apply matching template
      const matchedTpl = templates.find(t => t.category === pType && t.isDefault)
        || templates.find(t => t.category === pType)
        || templates.find(t => t.category === 'other')
        || templates[0];
      if (matchedTpl) {
        setSelectedTemplateId(matchedTpl.id);
        setDraftDescription(matchedTpl.content);
      } else {
        const templateContent = INITIAL_BOILERPLATES[pType] || INITIAL_BOILERPLATES['other'];
        setDraftDescription(templateContent);
      }
      setUseAiDesc(false);

    } catch (err: any) {
      console.error("Error analyzing image", err);
      let errorMsg = err.message || '通信エラー';
      if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
        errorMsg = 'AIサーバーが一時的に混雑しています。数秒後に再度お試しください。(503)';
      }
      alert(`画像の解析に失敗しました。\n詳細: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Regenerate Title while retaining management number
  const handleRegenerateTitle = async () => {
    if (!imageUrl) {
      alert("画像を先に選択してください。");
      return;
    }

    try {
      setIsRegeneratingTitle(true);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageUrl })
      });

      const data = await response.json();
      if (data.title) {
        setDraftTitle(data.title);
        // Management number is untouched!
      }
    } catch (err) {
      alert("タイトルの再生成に失敗しました。");
    } finally {
      setIsRegeneratingTitle(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setImageUrl(compressedBase64);

      if (!autoAiAnalyze) {
        if (!draftDescription) {
          const matchedTpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
          setDraftDescription(matchedTpl ? matchedTpl.content : (INITIAL_BOILERPLATES['other']));
        }
        return;
      }

      await runAiAnalysis(compressedBase64);
    } catch (err: any) {
      console.error("Error loading image", err);
      alert(`画像の読み込みに失敗しました。\n詳細: ${err.message || '通信エラー'}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const applyTemplateById = (templateId: string, aiToggleOverride?: boolean) => {
    setSelectedTemplateId(templateId);
    const matched = templates.find(t => t.id === templateId);
    const templateContent = matched ? matched.content : INITIAL_BOILERPLATES['other'];
    const includeAi = aiToggleOverride !== undefined ? aiToggleOverride : (descriptionMode === 'template_ai');
    const aiText = includeAi && rawAiResult?.description ? `\n\n${rawAiResult.description}` : '';
    setDraftDescription(templateContent + aiText);
  };

  const formatTitleWithTag = (tag: string, title: string) => {
    if (!tag || !tag.trim()) return title;
    const cleanTag = tag.trim();
    if (cleanTag.startsWith('【') || cleanTag.startsWith('[')) {
      return `${cleanTag} ${title}`;
    }
    return `【${cleanTag}】${title}`;
  };

  const finalTitle = formatTitleWithTag(mngNumber, draftTitle);

  const clearForm = () => {
    setImageUrl(null);
    setRawAiResult(null);
    setDraftTitle('');
    setDraftCategory('');
    setIsCustomCategory(false);
    setDraftDescription('');
    setDraftPublisher('');
    setDraftJanIsbn('');
    setDraftPrice(1000);
    setDraftBuyoutPrice('');
    setMngNumber(generateMngNumber());
  };

  // Save to Kongo-do Database & Session Queue
  const saveToDatabase = async () => {
    if (!draftTitle.trim()) {
      alert("出品タイトルを入力してください。");
      return;
    }

    try {
      setIsSavingDb(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managementNumber: mngNumber,
          title: finalTitle,
          category: draftCategory || 'すべて>本、雑誌',
          publisher: draftPublisher || '',
          janIsbn: draftJanIsbn || '',
          price: Number(draftPrice) || 1000,
          buyoutPrice: draftBuyoutPrice ? Number(draftBuyoutPrice) : null,
          conditionRank: draftCondition,
          shippingPayer: draftShippingPayer,
          shippingMethod: draftShippingMethod,
          shippingOrigin: '東京都',
          description: draftDescription,
          imageUrl: imageUrl || null,
          productType: detectedProductType || 'other',
          status: 'pending',
        })
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || 'データベースへの保存に失敗しました');
      }

      setDbProductCount(prev => prev + 1);
      alert("金剛洞データベース（出品待ち）に保存しました！\n複数PCから「在庫DB」画面で確認・一括出力が可能です。");

      // Auto-generate next management number
      setMngNumber(generateMngNumber());
      setImageUrl(null);
      setRawAiResult(null);

      if (!keepPreviousData && autoAiAnalyze) {
        setDraftTitle('');
        setDraftCategory('');
        setIsCustomCategory(false);
        setDraftDescription('');
        setDraftPublisher('');
        setDraftJanIsbn('');
      }
    } catch (err: any) {
      alert(err.message || "保存に失敗しました");
    } finally {
      setIsSavingDb(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>金剛洞 AI</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>出品・データ管理プラットフォーム</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/" style={{ padding: '12px 16px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            新規出品
          </Link>
          <Link href="/inventory" style={{ padding: '12px 16px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            在庫DB
            <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {dbProductCount}件
            </span>
          </Link>
          <Link href="/settings" style={{ padding: '12px 16px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}>
            定型文設定
          </Link>
        </nav>

        {/* Database Shortcut Widget */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>金剛洞DB 登録済み商品</p>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
            {dbProductCount} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>件</span>
          </div>
          <Link 
            href="/inventory"
            className="btn-primary" 
            style={{ width: '100%', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            在庫DBで一括管理 ↗
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="animate-fade-up" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>新規出品登録</h1>
            <p style={{ color: 'var(--text-secondary)' }}>商品画像を登録し、AI自動判別または手動調整を経て金剛洞DBに保存します。</p>
          </div>

          {/* Workflow Toggles Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            {/* AI Auto-Analyze Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI自動解析:</span>
              <input 
                type="checkbox" 
                checked={autoAiAnalyze} 
                onChange={(e) => setAutoAiAnalyze(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '12px',
                background: autoAiAnalyze ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-primary)',
                color: autoAiAnalyze ? 'var(--accent-primary)' : 'var(--text-muted)' 
              }}>
                {autoAiAnalyze ? 'ON' : 'OFF'}
              </span>
            </label>

            <span style={{ color: 'var(--border-color)' }}>|</span>

            {/* Keep Previous Data Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>前回の入力情報を保持:</span>
              <input 
                type="checkbox" 
                checked={keepPreviousData} 
                onChange={(e) => setKeepPreviousData(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '12px',
                background: keepPreviousData ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                color: keepPreviousData ? '#10b981' : 'var(--text-muted)' 
              }}>
                {keepPreviousData ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
        </header>

        {/* Informative notification if AI auto-analysis is OFF */}
        {!autoAiAnalyze && (
          <div className="animate-fade-up" style={{ marginBottom: '20px', padding: '10px 16px', background: 'rgba(234, 88, 12, 0.08)', border: '1px solid rgba(234, 88, 12, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span>
            <span>
              <strong>AI自動解析OFFモード：</strong>
              画像を選択してもAI解析は行われません。前回のタイトル・カテゴリ・出版社等の情報をそのまま維持し、号数や年代のみを変更して素早く連続出品できます。
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: (isUploading || !!imageUrl || !!rawAiResult || !!draftTitle) ? '1fr 1.5fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: Upload & Image */}
          <section className="glass-panel animate-fade-up" style={{ padding: '32px', textAlign: 'center', border: '2px dashed var(--border-color)' }}>
            {!imageUrl ? (
              <>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{isUploading ? "AI解析中..." : "商品画像をアップロード"}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {autoAiAnalyze ? "画像選択時に自動でタイトル・カテゴリ・型番等を解析します" : "画像選択時、前回の入力情報を維持したまま出品できます"}
                </p>
                <label className="btn-primary" style={{ cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
                  {isUploading ? "テキスト読み取り中..." : "ファイルを選択"}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                </label>
              </>
            ) : (
              <div>
                <img src={imageUrl} alt="アップロード済み" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', gap: '8px', marginBottom: !autoAiAnalyze && !rawAiResult ? '12px' : '0' }}>
                  <label className="btn-secondary" style={{ flex: 1, cursor: 'pointer', fontSize: '13px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    画像を変更
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                  </label>
                  <button className="btn-secondary" onClick={() => { setImageUrl(null); }} style={{ flex: 1, fontSize: '13px' }}>
                    画像を削除
                  </button>
                </div>

                {!autoAiAnalyze && !rawAiResult && (
                  <button 
                    type="button" 
                    onClick={() => runAiAnalysis(imageUrl)} 
                    disabled={isUploading}
                    className="btn-primary" 
                    style={{ width: '100%', fontSize: '13px', marginTop: '8px' }}
                  >
                    ⚡️ この画像をAI解析する
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Right Column: Edit Draft */}
          {isUploading ? (
            <section className="glass-card animate-fade-up delay-100" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
              <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .loading-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
              `}</style>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', marginBottom: '24px' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '12px', fontSize: '20px' }}>AIが商品情報を抽出中...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', textAlign: 'center', lineHeight: '1.6', marginBottom: '32px' }}>
                画像からタイトル、カテゴリ、型番などを<br/>自動で読み取っています。数秒お待ちください。
              </p>
              
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="loading-pulse" style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="loading-pulse" style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="loading-pulse" style={{ height: '80px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
              </div>
            </section>
          ) : (isUploading || !!imageUrl || !!rawAiResult || !!draftTitle) && (
            <section className="glass-card animate-fade-up delay-100" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>出品データ（下書き）</h3>
                  {rawAiResult ? (
                    <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                      AI抽出済み
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', background: 'rgba(234, 88, 12, 0.15)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                      前回データ引継中（手動編集）
                    </span>
                  )}
                </div>

                {imageUrl && !rawAiResult && !isUploading && (
                  <button 
                    type="button" 
                    onClick={() => runAiAnalysis(imageUrl)} 
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                  >
                    ⚡️ この画像をAI解析
                  </button>
                )}
              </div>

              {/* Title & Management Num */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '110px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>管理番号</label>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        管理番号・棚番 ＆ 出品タイトル ({draftTitle.length}/65文字)
                      </label>
                    </div>
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRegenerateTitle}
                      disabled={isRegeneratingTitle}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      title="入力された保管場所・管理番号はそのまま保持し、AIでタイトルのみを再推論します"
                    >
                      {isRegeneratingTitle ? '再生成中...' : '🔄 タイトル再生成 (保管場所番号を保持)'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="input-field" 
                    value={mngNumber} 
                    onChange={(e) => setMngNumber(e.target.value)} 
                    style={{ width: '150px', fontWeight: 'bold' }} 
                    placeholder="管理番号/棚番" 
                    title="商品の保管場所・棚番号。画像認識やAI再生成を行っても消去されず固定されます"
                  />
                  <input 
                    className="input-field" 
                    value={draftTitle} 
                    onChange={(e) => setDraftTitle(e.target.value)} 
                    style={{ flex: 1 }} 
                    placeholder="商品タイトルを入力またはAIで自動生成"
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  ヤフオク掲載プレビュー：<strong style={{ color: 'var(--text-primary)' }}>{finalTitle}</strong>
                </div>
              </div>

              {/* Category (Hierarchical Selector with Keyword Search) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ヤフオク カテゴリ
                    </label>
                    <span style={{ fontSize: '11px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                      階層選択対応
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {isCustomCategory ? '階層選択に戻す' : '直接テキスト編集'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <div>
                    <input
                      className="input-field"
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value)}
                      placeholder="ヤフオクカテゴリパスを入力（例: すべて>本、雑誌>...）"
                    />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                      <div
                        onClick={() => setIsCategoryModalOpen(true)}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '44px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '16px' }}>📂</span>
                          <span
                            style={{
                              color: draftCategory ? 'var(--text-primary)' : 'var(--text-muted)',
                              fontWeight: draftCategory ? 600 : 400,
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {draftCategory || 'カテゴリ未選択（クリックして階層選択）'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}>
                          変更 &gt;
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setIsCategoryModalOpen(true)}
                        style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '10px 16px' }}
                      >
                        階層から選択
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Publisher & JAN/ISBN/Model Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    出版社 / メーカー / レーベル
                  </label>
                  <input 
                    className="input-field" 
                    value={draftPublisher} 
                    onChange={(e) => setDraftPublisher(e.target.value)} 
                    placeholder="例：集英社、双葉社、マドンナ" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    JANコード / ISBN / 型番
                  </label>
                  <input 
                    className="input-field" 
                    value={draftJanIsbn} 
                    onChange={(e) => setDraftJanIsbn(e.target.value)} 
                    placeholder="例: 9784088725093, SLPS-00001" 
                  />
                </div>
              </div>

              {/* Price, Buyout Price & Condition Rank */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    開始価格 (円) *
                  </label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={draftPrice} 
                    onChange={(e) => setDraftPrice(Number(e.target.value))} 
                    placeholder="1000" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    即決価格 (任意)
                  </label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={draftBuyoutPrice} 
                    onChange={(e) => setDraftBuyoutPrice(e.target.value ? Number(e.target.value) : '')} 
                    placeholder="例: 3000" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    商品の状態 (ヤフオク基準)
                  </label>
                  <select 
                    className="input-field"
                    value={draftCondition}
                    onChange={(e) => setDraftCondition(e.target.value)}
                  >
                    {CONDITION_RANKS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shipping Payer & Shipping Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    送料負担
                  </label>
                  <select 
                    className="input-field"
                    value={draftShippingPayer}
                    onChange={(e) => setDraftShippingPayer(e.target.value as any)}
                  >
                    <option value="seller">出品者負担（送料無料）</option>
                    <option value="buyer">落札者負担</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    配送方法
                  </label>
                  <select 
                    className="input-field"
                    value={draftShippingMethod}
                    onChange={(e) => setDraftShippingMethod(e.target.value)}
                  >
                    {SHIPPING_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boilerplate & Description Options */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    定型文テンプレートを選択
                  </label>
                  <Link href="/settings" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                    定型文の設定・追加はこちら ↗
                  </Link>
                </div>

                {/* Quick Select Buttons for ALL templates (including custom ones) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {templates.map(tpl => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplateById(tpl.id)}
                        className="btn-secondary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 600 : 400,
                          background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                          boxShadow: isSelected ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {!tpl.isDefault && (
                          <span style={{
                            fontSize: '10px',
                            background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(234, 88, 12, 0.12)',
                            color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            カスタム
                          </span>
                        )}
                        {tpl.name}
                      </button>
                    );
                  })}
                </div>

                {/* Description Creation Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>説明作成モード:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="desc_mode" 
                      checked={descriptionMode === 'template_only'} 
                      onChange={() => {
                        setDescriptionMode('template_only');
                        applyTemplateById(selectedTemplateId, false);
                      }}
                    />
                    定型文のみ
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="desc_mode" 
                      checked={descriptionMode === 'template_manual'} 
                      onChange={() => setDescriptionMode('template_manual')}
                    />
                    定型文＋手入力説明
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="desc_mode" 
                      checked={descriptionMode === 'template_ai'} 
                      onChange={async () => {
                        setDescriptionMode('template_ai');
                        if ((!rawAiResult || !rawAiResult.description) && imageUrl) {
                          setIsGeneratingDesc(true);
                          try {
                            const response = await fetch('/api/generate-description', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageBase64: imageUrl })
                            });
                            const data = await response.json();
                            setRawAiResult((prev: any) => ({ ...prev, description: data.description }));
                            applyTemplateById(selectedTemplateId, true);
                          } catch (err) {
                            alert("AI特記事項の生成に失敗しました。");
                          } finally {
                            setIsGeneratingDesc(false);
                          }
                        } else {
                          applyTemplateById(selectedTemplateId, true);
                        }
                      }}
                    />
                    定型文＋AI生成特記事項 {isGeneratingDesc && <span style={{ color: 'var(--accent-primary)' }}>(生成中...)</span>}
                  </label>
                </div>
              </div>

              {/* Final Description Textarea */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  ヤフオク掲載用 商品説明文
                </label>
                <textarea 
                  className="input-field" 
                  value={draftDescription} 
                  onChange={(e) => setDraftDescription(e.target.value)} 
                  style={{ height: '180px', resize: 'vertical', lineHeight: '1.6' }} 
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '24px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={clearForm} 
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '13px' }}
                >
                  フォームをクリア
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setImageUrl(null); }} style={{ fontSize: '13px' }}>
                    画像のみ破棄
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={saveToDatabase} 
                    disabled={isSavingDb}
                    style={{ fontSize: '13px' }}
                  >
                    {isSavingDb ? '保存中...' : '金剛洞DBに保存（出品待ち）'}
                  </button>
                </div>
              </div>

            </section>
          )}
        </div>
      </main>

      {/* Hierarchical Category Selection Modal with Keyword Search */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        currentCategory={draftCategory}
        onSelectCategory={(newCat) => setDraftCategory(newCat)}
      />
    </div>
  );
}
