"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '../globals.css';

interface Product {
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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Yahoo Listing Modal State
  const [listingProduct, setListingProduct] = useState<Product | null>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateProductStatus = async (id: string, newStatus: 'pending' | 'listed' | 'sold') => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ステータス更新に失敗しました');
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || '更新に失敗しました');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`商品「${title}」を削除してもよろしいですか？`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '削除に失敗しました');
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (err: any) {
      alert(err.message || '削除に失敗しました');
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct({ ...p });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '更新に失敗しました');
      setProducts(prev =>
        prev.map(p => (p.id === editingProduct.id ? data.product : p))
      );
      closeEditModal();
    } catch (err: any) {
      alert(err.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const openListingModal = (p: Product) => {
    setListingProduct(p);
    setIsListingModalOpen(true);
    setCopiedField(null);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // CSV Export
  const exportCSV = (selectedOnly = false) => {
    const targetProducts = selectedOnly
      ? products.filter(p => selectedIds.includes(p.id))
      : products;

    if (targetProducts.length === 0) {
      alert('出力対象の商品がありません。');
      return;
    }

    const headers = [
      '管理番号',
      '出品タイトル',
      'カテゴリ',
      '出版社/メーカー',
      'JAN/ISBN/型番',
      '開始価格',
      '即決価格',
      '商品の状態',
      '送料負担',
      '配送方法',
      '発送元の地域',
      '商品説明',
      'ステータス',
      '登録日時',
    ];

    const rows = targetProducts.map(p => [
      `"${p.managementNumber}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      `"${(p.publisher || '').replace(/"/g, '""')}"`,
      `"${(p.janIsbn || '').replace(/"/g, '""')}"`,
      p.price,
      p.buyoutPrice || '',
      `"${p.conditionRank}"`,
      `"${p.shippingPayer === 'seller' ? '出品者負担' : '落札者負担'}"`,
      `"${p.shippingMethod}"`,
      `"${p.shippingOrigin}"`,
      `"${p.description.replace(/"/g, '""').replace(/\n/g, '\\n')}"`,
      `"${p.status === 'pending' ? '出品待ち' : p.status === 'listed' ? '出品中' : '出品完了'}"`,
      `"${p.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kongodo_inventory_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalCount = products.length;
  const pendingCount = products.filter(p => p.status === 'pending').length;
  const listedCount = products.filter(p => p.status === 'listed').length;
  const soldCount = products.filter(p => p.status === 'sold').length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>金剛洞 AI</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            出品・データ管理プラットフォーム
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            新規出品
          </Link>
          <Link
            href="/inventory"
            style={{
              padding: '12px 16px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            在庫DB
          </Link>
          <Link href="/settings" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            定型文設定
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header
          className="animate-fade-up"
          style={{
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>金剛洞 商品データベース</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              保存された出品待ち・出品中商品の確認、修正、ヤフオク出品反映およびCSV一括管理を行います。
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => exportCSV(selectedIds.length > 0)}
              className="btn-secondary"
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {selectedIds.length > 0 ? `選択(${selectedIds.length}件)をCSV出力` : '全件CSV出力'}
            </button>
            <Link href="/" className="btn-primary" style={{ fontSize: '13px' }}>
              ＋ 新規出品を作成
            </Link>
          </div>
        </header>

        {/* Stats Summary Cards */}
        <div
          className="animate-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>総登録数</p>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalCount} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>件</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-primary)' }}>
            <p style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 600 }}>出品待ち</p>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {pendingCount} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>件</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb' }}>
            <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px', fontWeight: 600 }}>出品中</p>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>
              {listedCount} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>件</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
            <p style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px', fontWeight: 600 }}>出品完了・落札</p>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {soldCount} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>件</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className="glass-panel animate-fade-up"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'すべて' },
              { id: 'pending', label: '出品待ち' },
              { id: 'listed', label: '出品中' },
              { id: 'sold', label: '出品完了' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: statusFilter === tab.id ? 600 : 400,
                  background: statusFilter === tab.id ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: statusFilter === tab.id ? 'none' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '320px' }}>
            <input
              type="text"
              placeholder="タイトル、管理番号、JAN/ISBNで検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              検索
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                解除
              </button>
            )}
          </form>
        </div>

        {/* Product Table */}
        <div className="glass-panel animate-fade-up" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              データを読み込み中...
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                該当する商品データがありません。
              </p>
              <Link href="/" className="btn-primary" style={{ fontSize: '13px' }}>
                新規出品を作成してDBに保存
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ width: '70px' }}>画像</th>
                    <th style={{ width: '100px' }}>管理番号</th>
                    <th>タイトル / カテゴリ</th>
                    <th style={{ width: '130px' }}>JAN/ISBN/型番</th>
                    <th style={{ width: '110px' }}>価格</th>
                    <th style={{ width: '110px' }}>状態</th>
                    <th style={{ width: '110px' }}>ステータス</th>
                    <th style={{ width: '160px', textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectOne(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            style={{
                              width: '54px',
                              height: '54px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              background: 'var(--bg-primary)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '10px',
                            }}
                          >
                            No Img
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 6px',
                            background: 'rgba(234, 88, 12, 0.08)',
                            color: 'var(--accent-primary)',
                            borderRadius: '4px',
                            border: '1px solid rgba(234, 88, 12, 0.2)',
                          }}
                        >
                          {p.managementNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {p.category}
                        </div>
                      </td>
                      <td>
                        {p.janIsbn ? (
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {p.janIsbn}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>¥{p.price.toLocaleString()}</div>
                        {p.buyoutPrice && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            即決 ¥{p.buyoutPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {p.conditionRank}
                        </span>
                      </td>
                      <td>
                        <select
                          value={p.status}
                          onChange={e => updateProductStatus(p.id, e.target.value as any)}
                          className={`badge badge-${p.status}`}
                          style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                        >
                          <option value="pending">出品待ち</option>
                          <option value="listed">出品中</option>
                          <option value="sold">出品完了</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openListingModal(p)}
                            className="btn-primary"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                            title="ヤフオク出品画面へ反映"
                          >
                            ヤフオク出品
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            className="btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Edit Product */}
        {isEditModalOpen && editingProduct && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div
              className="modal-container"
              style={{ maxWidth: '720px', padding: '28px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px' }}>商品情報の確認・編集</h2>
                <button onClick={closeEditModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      管理番号
                    </label>
                    <input
                      type="text"
                      value={editingProduct.managementNumber}
                      onChange={e => setEditingProduct({ ...editingProduct, managementNumber: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      出品タイトル *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.title}
                      onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    ヤフオクカテゴリパス
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      出版社 / メーカー / レーベル
                    </label>
                    <input
                      type="text"
                      value={editingProduct.publisher || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, publisher: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      JAN / ISBN / 型番
                    </label>
                    <input
                      type="text"
                      value={editingProduct.janIsbn || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, janIsbn: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      開始価格 (円)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      即決価格 (任意)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.buyoutPrice || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, buyoutPrice: e.target.value ? Number(e.target.value) : null })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      商品の状態
                    </label>
                    <select
                      value={editingProduct.conditionRank}
                      onChange={e => setEditingProduct({ ...editingProduct, conditionRank: e.target.value })}
                      className="input-field"
                    >
                      {CONDITION_RANKS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      送料負担
                    </label>
                    <select
                      value={editingProduct.shippingPayer}
                      onChange={e => setEditingProduct({ ...editingProduct, shippingPayer: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="seller">出品者負担</option>
                      <option value="buyer">落札者負担</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      配送方法
                    </label>
                    <select
                      value={editingProduct.shippingMethod}
                      onChange={e => setEditingProduct({ ...editingProduct, shippingMethod: e.target.value })}
                      className="input-field"
                    >
                      {SHIPPING_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      ステータス
                    </label>
                    <select
                      value={editingProduct.status}
                      onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="pending">出品待ち</option>
                      <option value="listed">出品中</option>
                      <option value="sold">出品完了</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    商品説明文
                  </label>
                  <textarea
                    rows={6}
                    value={editingProduct.description}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="input-field"
                    style={{ lineHeight: '1.6' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={closeEditModal} className="btn-secondary" disabled={isSaving}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? '保存中...' : '変更を保存する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Yahoo Auctions Listing Reflection */}
        {isListingModalOpen && listingProduct && (
          <div className="modal-overlay" onClick={() => setIsListingModalOpen(false)}>
            <div
              className="modal-container"
              style={{ maxWidth: '680px', padding: '28px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-pending">ヤフオク出品アシスト</span>
                  <h2 style={{ fontSize: '20px' }}>ヤフオク!出品画面へのデータ反映</h2>
                </div>
                <button onClick={() => setIsListingModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                以下の項目をワンクリックでコピーし、ヤフオク出品フォームへ貼り付けが可能です。
              </p>

              {/* Quick Copy Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {/* Title */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      出品タイトル ({listingProduct.title.length}/65文字)
                    </span>
                    <button
                      onClick={() => copyToClipboard(listingProduct.title, 'title')}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', color: copiedField === 'title' ? '#10b981' : 'inherit' }}
                    >
                      {copiedField === 'title' ? '✓ コピー完了' : 'タイトルをコピー'}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{listingProduct.title}</div>
                </div>

                {/* Category */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      カテゴリパス
                    </span>
                    <button
                      onClick={() => copyToClipboard(listingProduct.category, 'category')}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', color: copiedField === 'category' ? '#10b981' : 'inherit' }}
                    >
                      {copiedField === 'category' ? '✓ コピー完了' : 'カテゴリをコピー'}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px' }}>{listingProduct.category}</div>
                </div>

                {/* Price & Condition */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>開始価格</span>
                      <button
                        onClick={() => copyToClipboard(String(listingProduct.price), 'price')}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', color: copiedField === 'price' ? '#10b981' : 'inherit' }}
                      >
                        {copiedField === 'price' ? '✓' : 'コピー'}
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>¥{listingProduct.price.toLocaleString()}</div>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>商品の状態</div>
                    <div style={{ fontSize: '13px' }}>{listingProduct.conditionRank}</div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      商品説明
                    </span>
                    <button
                      onClick={() => copyToClipboard(listingProduct.description, 'description')}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', color: copiedField === 'description' ? '#10b981' : 'inherit' }}
                    >
                      {copiedField === 'description' ? '✓ コピー完了' : '説明文をコピー'}
                    </button>
                  </div>
                  <pre style={{ fontSize: '12px', maxHeight: '140px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {listingProduct.description}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => {
                    updateProductStatus(listingProduct.id, 'listed');
                    setIsListingModalOpen(false);
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '13px', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
                >
                  ✓ 出品中ステータスに変更
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setIsListingModalOpen(false)} className="btn-secondary" style={{ fontSize: '13px' }}>
                    閉じる
                  </button>
                  <a
                    href="https://auctions.yahoo.co.jp/sell/jp/show/submit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ fontSize: '13px', textDecoration: 'none' }}
                  >
                    ヤフオク出品画面を開く ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
