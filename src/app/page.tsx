"use client";

import React, { useState } from 'react';
import './globals.css';

// Pre-defined boilerplates
const BOILERPLATES = {
  book: `【商品について】\n中古品ですので細かい傷等ある場合がございますので神経質な方の入札はご遠慮いたします。\n状態は画像をご覧下さい。\n全ページ隅々まで切り抜き等の確認しておりませんのでご了承ください。\n写真に写っているものが全てとなります。`,
  dvd: `【商品について】\n中古DVDとなります。ディスクに細かな傷がある場合がありますが、再生には問題ありません。\nパッケージのスレ等は画像でご確認ください。`
};

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  
  // AI Raw Results
  const [rawAiResult, setRawAiResult] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Editable Draft State
  const [mngNumber, setMngNumber] = useState('60925a');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [useAiDesc, setUseAiDesc] = useState(true);

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
        setRawAiResult(data);
        
        // Populate Draft
        setDraftTitle(data.title || '');
        setDraftCategory(data.category || '');
        setDraftDescription(data.description || '');
        
      } catch (err) {
        console.error("Error analyzing image", err);
        alert("Failed to analyze image.");
      } finally {
        setIsUploading(false);
      }
    };
  };

  const applyBoilerplate = (type: 'book' | 'dvd') => {
    const template = BOILERPLATES[type];
    const aiText = useAiDesc && rawAiResult?.description ? `\n\n【AI判別詳細】\n${rawAiResult.description}` : '';
    setDraftDescription(template + aiText);
  };

  const finalTitle = `[${mngNumber}] ${draftTitle}`;

  const saveToSessionQueue = () => {
    const newListing = {
      managementNumber: mngNumber,
      title: finalTitle,
      category: draftCategory,
      description: draftDescription,
    };
    
    setSessionListings([...sessionListings, newListing]);
    alert("Saved to batch queue!");
    
    // Reset for next item
    setImageUrl(null);
    setRawAiResult(null);
    setDraftTitle('');
    setDraftDescription('');
  };

  const downloadCSV = () => {
    if (sessionListings.length === 0) {
      alert("No items in queue to download.");
      return;
    }

    // Standard Yahoo Auctions Bulk CSV headers (simplified for MVP)
    const headers = ["管理番号", "タイトル", "カテゴリ", "商品説明"];
    const rows = sessionListings.map(item => [
      `"${item.managementNumber}"`,
      `"${item.title.replace(/"/g, '""')}"`, // escape quotes
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""').replace(/\n/g, '\\n')}"` // escape newlines for basic CSV
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
          <h2 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>Kongo-do AI</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Listing DB Platform</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="#" style={{ padding: '12px 16px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            New Listing
          </a>
          <a href="#" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            Inventory DB
          </a>
          <a href="#" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            Boilerplate Settings
          </a>
        </nav>

        {/* Batch Queue Widget */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>BATCH EXPORT QUEUE</p>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
            {sessionListings.length} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>items</span>
          </div>
          <button onClick={downloadCSV} className="btn-primary" style={{ width: '100%', fontSize: '13px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download CSV for Yahoo
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="animate-fade-up" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Create New Listing</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upload an item to generate data, apply boilerplates, and save to DB.</p>
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
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{isUploading ? "AI Processing..." : "Upload Image"}</h3>
                <label className="btn-primary" style={{ marginTop: '16px', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
                  {isUploading ? "Reading Text..." : "Select File"}
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                </label>
              </>
            ) : (
              <div>
                <img src={imageUrl} alt="Uploaded" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-color)' }} />
                <button className="btn-secondary" onClick={() => { setImageUrl(null); setRawAiResult(null); }} style={{ width: '100%' }}>
                  Discard Image
                </button>
              </div>
            )}
          </section>

          {/* Right Column: Edit Draft */}
          {rawAiResult && (
            <section className="glass-card animate-fade-up delay-100" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>Draft Listing Data</h3>
                <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px' }}>AI Extracted</span>
              </div>

              {/* Title & Management Num */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Listing Title</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="input-field" 
                    value={mngNumber} 
                    onChange={(e) => setMngNumber(e.target.value)} 
                    style={{ width: '100px', fontWeight: 'bold' }} 
                    placeholder="Mgmt #" 
                  />
                  <input 
                    className="input-field" 
                    value={draftTitle} 
                    onChange={(e) => setDraftTitle(e.target.value)} 
                    style={{ flex: 1 }} 
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Preview: <strong style={{ color: 'var(--text-primary)' }}>{finalTitle}</strong>
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
                <input className="input-field" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} />
              </div>

              {/* Boilerplate Injection */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Insert Boilerplate (定型文)</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('book')}>+ Book Template</button>
                  <button className="btn-secondary" onClick={() => applyBoilerplate('dvd')}>+ DVD Template</button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useAiDesc} 
                    onChange={(e) => setUseAiDesc(e.target.checked)} 
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  Include AI-generated condition description
                </label>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Final Description</label>
                <textarea 
                  className="input-field" 
                  value={draftDescription} 
                  onChange={(e) => setDraftDescription(e.target.value)} 
                  style={{ height: '180px', resize: 'vertical', lineHeight: '1.5' }} 
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button className="btn-secondary" onClick={() => { setImageUrl(null); setRawAiResult(null); }}>Discard</button>
                <button className="btn-primary" onClick={saveToSessionQueue}>Save & Queue for Batch</button>
              </div>

            </section>
          )}
        </div>
      </main>
    </div>
  );
}
