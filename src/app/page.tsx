"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';

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
  const [draftDescription, setDraftDescription] = useState('');
  const [draftPublisher, setDraftPublisher] = useState('');
  const [draftReleaseDate, setDraftReleaseDate] = useState('');
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

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      setImageUrl(base64String);
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String })
        });
        
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to analyze image');
        }
        setRawAiResult(data);
        
        // Populate Draft
        setDraftTitle(data.title || '');
        setDraftCategory(data.category || '');
        setDraftPublisher(data.publisher || '');
        setDraftReleaseDate(data.release_date || '');
        
        // Auto-apply the correct boilerplate based on detected product type
        const pType = data.product_type || 'other';
        setActiveBoilerplate(pType);
        const template = BOILERPLATES[pType] || BOILERPLATES['other'];
        // At this stage, description is never generated yet, so just apply template
        setDraftDescription(template);
        // Reset checkbox state
        setUseAiDesc(false);
        
      } catch (err) {
        console.error("Error analyzing image", err);
        alert("画像の解析に失敗しました。");
      } finally {
        setIsUploading(false);
      }
    };
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
      releaseDate: draftReleaseDate,
      description: draftDescription,
    };
    
    setSessionListings([...sessionListings, newListing]);
    alert("バッチキューに保存しました！");
    
    // Reset for next item — auto-generate new management number
    setImageUrl(null);
    setRawAiResult(null);
    setDraftTitle('');
    setDraftDescription('');
    setDraftPublisher('');
    setDraftReleaseDate('');
    setMngNumber(generateMngNumber());
  };

  const downloadCSV = () => {
    if (sessionListings.length === 0) {
      alert("ダウンロードするアイテムがありません。");
      return;
    }

    const headers = ["管理番号", "タイトル", "カテゴリ", "出版社/メーカー", "発売日", "商品説明"];
    const rows = sessionListings.map(item => [
      `"${item.managementNumber}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${(item.publisher || '').replace(/"/g, '""')}"`,
      `"${(item.releaseDate || '').replace(/"/g, '""')}"`,
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
          <Link href="/inventory" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            在庫DB
          </Link>
          <Link href="/settings" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            定型文設定
          </Link>
        </nav>

        {/* Batch Queue Widget */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>バッチ出力キュー</p>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
            {sessionListings.length} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>件</span>
          </div>
          <button onClick={downloadCSV} className="btn-primary" style={{ width: '100%', fontSize: '13px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: rawAiResult ? '1fr 1.5fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          
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
          {rawAiResult && (
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

              {/* Category */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>カテゴリ</label>
                <input className="input-field" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} />
              </div>

              {/* Publisher & Release Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    出版社 / メーカー
                  </label>
                  <input className="input-field" value={draftPublisher} onChange={(e) => setDraftPublisher(e.target.value)} placeholder="例：双葉社、マドンナ" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    発売日
                  </label>
                  <input className="input-field" value={draftReleaseDate} onChange={(e) => setDraftReleaseDate(e.target.value)} placeholder="例：1987/03/20" />
                </div>
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
    </div>
  );
}
