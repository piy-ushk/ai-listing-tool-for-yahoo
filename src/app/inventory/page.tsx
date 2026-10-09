import React from 'react';
import Link from 'next/link';
import '../globals.css';

export default function InventoryPage() {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>金剛洞 AI</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>出品・データ管理プラットフォーム</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            新規出品
          </Link>
          <Link href="/inventory" style={{ padding: '12px 16px', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            在庫DB
          </Link>
          <Link href="/settings" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            定型文設定
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="animate-fade-up" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>在庫DB</h1>
          <p style={{ color: 'var(--text-secondary)' }}>保存済みの出品データを確認・管理します。</p>
        </header>

        <section className="glass-card animate-fade-up delay-100" style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent-primary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>データベース接続が必要です</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            セッションをまたいで出品データを管理するには、Supabaseなどの永続データベースへの接続が必要です。
          </p>
          <button className="btn-primary">データベースを設定する</button>
        </section>
      </main>
    </div>
  );
}
