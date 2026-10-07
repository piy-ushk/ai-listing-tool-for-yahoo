"use client";

import React, { useState } from 'react';
import './globals.css';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    // Convert file to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String })
        });
        
        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.error("Error analyzing image", err);
        alert("Failed to analyze image.");
      } finally {
        setIsUploading(false);
      }
    };
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 className="gradient-text" style={{ fontSize: '24px' }}>Kongo-do AI</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Assetization Platform</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="#" className="glass-card" style={{ padding: '12px 16px', background: 'var(--bg-glass-hover)', borderLeft: '3px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#fff', fontWeight: 500 }}>Dashboard</span>
          </a>
          <a href="#" className="glass-card" style={{ padding: '12px 16px', border: '1px solid transparent', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Inventory DB</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="animate-fade-up" style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Test AI Extraction Engine</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upload an image to see real-time AI parsing results.</p>
        </header>

        {/* Upload Zone */}
        <section className="glass-panel animate-fade-up delay-100" style={{ padding: '60px 40px', textAlign: 'center', marginBottom: '40px', border: '2px dashed var(--border-color)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
              {isUploading ? "AI is analyzing image..." : "Upload Test Image"}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Select an image from your computer to test the accuracy.
            </p>
            
            <label className="btn-primary" style={{ padding: '10px 32px', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
              {isUploading ? "Processing..." : "Select File"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
            </label>
          </div>
        </section>

        {/* Results Area */}
        {result && (
          <section className="animate-fade-up glass-card" style={{ marginTop: '20px', border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--accent-primary)' }}>AI Extraction Result</h3>
            
            {result.description && result.description.includes('未設定') && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {result.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '15px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Generated Title:</div>
              <div style={{ fontWeight: 600 }}>{result.title}</div>
              
              <div style={{ color: 'var(--text-secondary)' }}>Category:</div>
              <div>{result.category}</div>
              
              <div style={{ color: 'var(--text-secondary)' }}>Keywords:</div>
              <div>{result.keywords}</div>
              
              {!result.description?.includes('未設定') && (
                <>
                  <div style={{ color: 'var(--text-secondary)' }}>AI Notes:</div>
                  <div>{result.description}</div>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
