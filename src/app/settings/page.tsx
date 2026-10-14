"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '../globals.css';

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: '全カテゴリ共通',
  magazine: '雑誌・週刊誌',
  book: '書籍・単行本',
  dvd: 'DVD',
  bluray: 'Blu-ray',
  game: 'ゲーム',
  other: 'その他・汎用',
};

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('other');
  const [formContent, setFormContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCategory('other');
    setFormContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Template) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormCategory(t.category);
    setFormContent(t.content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) {
      alert('テンプレート名と内容を入力してください。');
      return;
    }

    try {
      setIsSaving(true);
      if (editingTemplate) {
        // Update
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory,
            content: formContent.trim(),
          }),
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        // Create
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory,
            content: formContent.trim(),
          }),
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }

      await fetchTemplates();
      closeModal();
    } catch (err: any) {
      alert(err.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`テンプレート「${name}」を削除してもよろしいですか？`)) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      await fetchTemplates();
    } catch (err: any) {
      alert(err.message || '削除に失敗しました');
    }
  };

  const filteredTemplates = templates.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  );

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
          <Link href="/inventory" style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
            在庫DB
          </Link>
          <Link
            href="/settings"
            style={{
              padding: '12px 16px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            定型文設定
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header
          className="animate-fade-up"
          style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>定型文（テンプレート）管理</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              商品カテゴリ別の説明文テンプレートを追加・編集・削除できます。
            </p>
          </div>

          <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: '14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            定型文を新規追加
          </button>
        </header>

        {/* Category Tabs */}
        <div
          className="animate-fade-up"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
          }}
        >
          {Object.entries({ all: 'すべて', ...CATEGORY_LABELS }).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: selectedCategory === key ? 600 : 400,
                background: selectedCategory === key ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedCategory === key ? '#ffffff' : 'var(--text-secondary)',
                border: selectedCategory === key ? 'none' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Template List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            読み込み中...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              該当する定型文がありません。
            </p>
            <button onClick={openCreateModal} className="btn-secondary" style={{ fontSize: '13px' }}>
              新しい定型文を作成する
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '20px' }}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="glass-card animate-fade-up"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(234, 88, 12, 0.1)',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          display: 'inline-block',
                          marginBottom: '6px',
                        }}
                      >
                        {CATEGORY_LABELS[template.category] || template.category}
                      </span>
                      <h3 style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{template.name}</h3>
                    </div>

                    {template.isDefault && (
                      <span style={{ fontSize: '11px', background: 'var(--bg-primary)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        システム規定
                      </span>
                    )}
                  </div>

                  <pre
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      marginBottom: '16px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {template.content}
                  </pre>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px',
                  }}
                >
                  <button
                    onClick={() => openEditModal(template)}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="btn-secondary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit Template */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-container"
              style={{ maxWidth: '600px', padding: '28px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px' }}>
                  {editingTemplate ? '定型文を編集' : '新しい定型文を追加'}
                </h2>
                <button
                  onClick={closeModal}
                  style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    テンプレート名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="例: 週刊少年ジャンプ専用定型文"
                    className="input-field"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    対象商品カテゴリ
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    定型文本文 *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder="【商品の状態】&#10;中古品ですので細かい傷・スレ等ある場合がございます。..."
                    className="input-field"
                    style={{ resize: 'vertical', lineHeight: '1.6' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={closeModal} className="btn-secondary" disabled={isSaving}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? '保存中...' : '保存する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
