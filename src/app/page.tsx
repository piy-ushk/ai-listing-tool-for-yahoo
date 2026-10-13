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

// Pre-defined boilerplates
const BOILERPLATES: Record<string, string> = {
  book: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  dvd: `【商品の状態】\n中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生には問題ありません。\nパッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  bluray: `【商品の状態】\n中古Blu-rayとなります。ディスクに細かな傷がある場合がありますが、再生には問題ありません。\nパッケージのスレ等はご了承ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  game: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。動作確認済みです。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  magazine: `【商品の状態】\n中古品ですので細かい傷・ヤケ・スレ等ある場合がございます。神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
  other: `【商品の状態】\n中古品ですので細かい傷・スレ等ある場合がございます。神経質な方のご入札はご遠慮ください。\n写真に写っているものが全てとなります。\nノークレーム・ノーリターンでお願いいたします。`,
};

// Helper: Compress and resize image client-side before sending to serverless function
// This avoids Vercel's 4.5MB payload limit (413 FUNCTION_PAYLOAD_TOO_LARGE) and speeds up analysis
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

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  
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
  const [draftDescription, setDraftDescription] = useState('');
  const [draftPublisher, setDraftPublisher] = useState('');
  const [useAiDesc, setUseAiDesc] = useState(false);
  const [activeBoilerplate, setActiveBoilerplate] = useState('other');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Session Queue (Temporary before DB is connected)
  const [sessionListings, setSessionListings] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setRawAiResult(null);

    try {
      // Compress image client-side to prevent Vercel 4.5MB limit
      const compressedBase64 = await compressImage(file);
      setImageUrl(compressedBase64);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressedBase64 })
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

      // Auto-apply the correct boilerplate based on detected product type
      const pType = data.product_type || 'other';
      setActiveBoilerplate(pType);
      const template = BOILERPLATES[pType] || BOILERPLATES['other'];
      setDraftDescription(template);
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
      if (e.target) e.target.value = '';
    }
  };

  const applyBoilerplate = (type: string, aiToggleOverride?: boolean) => {
    setActiveBoilerplate(type);
    const template = BOILERPLATES[type] || BOILERPLATES['other'];
    const includeAi = aiToggleOverride !== undefined ? aiToggleOverride : useAiDesc;
    const aiText = includeAi && rawAiResult?.description ? `\n\n${rawAiResult.description}` : '';
    setDraftDescription(template + aiText);
  };

  const finalTitle = mngNumber ? `[${mngNumber}] ${draftTitle}` : draftTitle;

  const saveToSessionQueue = () => {
    const newListing = {
      managementNumber: mngNumber,
      title: finalTitle,
      category: draftCategory,
      publisher: draftPublisher,
      description: draftDescription,
    };
    
    setSessionListings([...sessionListings, newListing]);
    alert("バッチキューに保存しました！");
    
    // Reset for next item — auto-generate new management number
    setImageUrl(null);
    setRawAiResult(null);
    setDraftTitle('');
    setDraftCategory('');
    setIsCustomCategory(false);
    setDraftDescription('');
    setDraftPublisher('');
    setMngNumber(generateMngNumber());
  };

  const downloadCSV = () => {
    if (sessionListings.length === 0) {
      alert("ダウンロードするアイテムがありません。");
      return;
    }

    const headers = ["管理番号", "タイトル", "カテゴリ", "出版社/メーカー", "商品説明"];
    const rows = sessionListings.map(item => [
      `"${item.managementNumber}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${(item.publisher || '').replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""').replace(/\n/g, '\\n')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    // Add BOM for Japanese Excel compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `yahoo_batch_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', cursor: 'not-allowed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            在庫DB
            <span style={{ fontSize: '10px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>未実装</span>
          </div>
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', cursor: 'not-allowed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            定型文設定
            <span style={{ fontSize: '10px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>未実装</span>
          </div>
        </nav>

        {/* Batch Queue Widget */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>バッチ出力キュー</p>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
            {sessionListings.length} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>件</span>
          </div>
          <button 
            onClick={downloadCSV} 
            className="btn-primary" 
            style={{ width: '100%', fontSize: '13px', opacity: sessionListings.length === 0 ? 0.5 : 1, cursor: sessionListings.length === 0 ? 'not-allowed' : 'pointer' }}
            disabled={sessionListings.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            ヤフオク用CSV出力
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="animate-fade-up" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>新規出品登録</h1>
          <p style={{ color: 'var(--text-secondary)' }}>商品画像をアップロードし、AIが生成したデータを確認・編集して保存してください。</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: (rawAiResult || isUploading) ? '1fr 1.5fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          
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
                <label className="btn-primary" style={{ marginTop: '16px', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
                  {isUploading ? "テキスト読み取り中..." : "ファイルを選択"}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                </label>
              </>
            ) : (
              <div>
                <img src={imageUrl} alt="アップロード済み" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-color)' }} />
                <button className="btn-secondary" onClick={() => { setImageUrl(null); setRawAiResult(null); }} style={{ width: '100%' }}>
                  画像を削除
                </button>
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
                画像からタイトル、カテゴリなどを<br/>自動で読み取っています。数秒お待ちください。
              </p>
              
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="loading-pulse" style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="loading-pulse" style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="loading-pulse" style={{ height: '80px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}></div>
              </div>
            </section>
          ) : rawAiResult && (
            <section className="glass-card animate-fade-up delay-100" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>出品データ（下書き）</h3>
                <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px' }}>AI抽出済み</span>
              </div>

              {/* Title & Management Num */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '110px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>管理番号</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>出品タイトル</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="input-field" 
                    value={mngNumber} 
                    onChange={(e) => setMngNumber(e.target.value)} 
                    style={{ width: '110px', fontWeight: 'bold' }} 
                    placeholder="管理番号" 
                  />
                  <input 
                    className="input-field" 
                    value={draftTitle} 
                    onChange={(e) => setDraftTitle(e.target.value)} 
                    style={{ flex: 1 }} 
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  プレビュー：<strong style={{ color: 'var(--text-primary)' }}>{finalTitle}</strong>
                </div>
              </div>

              {/* Category (Hierarchical Selector with Keyword Search) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      カテゴリ
                    </label>
                    <span style={{ fontSize: '11px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                      ヤフオク階層型選択
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
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
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

                {draftCategory && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    選択中: <span style={{ color: 'var(--text-primary)' }}>{draftCategory}</span>
                  </div>
                )}
              </div>

              {/* Publisher */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  出版社 / メーカー
                </label>
                <input 
                  className="input-field" 
                  value={draftPublisher} 
                  onChange={(e) => setDraftPublisher(e.target.value)} 
                  placeholder="例：集英社、双葉社、マドンナ" 
                />
              </div>

              {/* Boilerplate Injection */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>定型文を挿入</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('book')}>本・写真集</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('dvd')}>DVD</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('bluray')}>Blu-ray</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('game')}>ゲーム</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('magazine')}>雑誌</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('other')}>その他</button>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>最終説明文</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useAiDesc} 
                      disabled={isGeneratingDesc}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setUseAiDesc(checked);
                        
                        if (checked && (!rawAiResult || !rawAiResult.description) && imageUrl) {
                          setIsGeneratingDesc(true);
                          try {
                            const response = await fetch('/api/generate-description', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageBase64: imageUrl })
                            });
                            const data = await response.json();
                            
                            setRawAiResult((prev: any) => ({ ...prev, description: data.description }));
                            const template = BOILERPLATES[activeBoilerplate] || BOILERPLATES['other'];
                            setDraftDescription(template + `\n\n${data.description}`);
                          } catch (err) {
                            console.error(err);
                            alert("説明文の生成に失敗しました。");
                            setUseAiDesc(false);
                          } finally {
                            setIsGeneratingDesc(false);
                          }
                        } else {
                          applyBoilerplate(activeBoilerplate, checked);
                        }
                      }} 
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    AI生成の状態説明を含める {isGeneratingDesc && <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>(生成中...)</span>}
                  </label>
                </div>
                <textarea 
                  className="input-field" 
                  value={draftDescription} 
                  onChange={(e) => setDraftDescription(e.target.value)} 
                  style={{ height: '200px', resize: 'vertical', lineHeight: '1.6' }} 
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button className="btn-secondary" onClick={() => { setImageUrl(null); setRawAiResult(null); }}>破棄</button>
                <button className="btn-primary" onClick={saveToSessionQueue}>保存してバッチキューへ</button>
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
