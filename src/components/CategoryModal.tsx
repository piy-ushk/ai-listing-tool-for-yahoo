"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  YAHOO_CATEGORY_TREE,
  CategoryNode,
  searchCategoryByKeyword,
  parseCategorySegments,
  buildCategoryPath,
  FlatCategory
} from "../data/yahooCategoryTree";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: string;
  onSelectCategory: (newCategory: string) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  currentCategory,
  onSelectCategory
}: CategoryModalProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    return searchCategoryByKeyword(searchQuery, 30);
  }, [searchQuery]);

  // Selected segments path: e.g. ['本、雑誌', '雑誌', '漫画､コミック', '男性コミック誌', '少年マンガ誌', '少年ジャンプ']
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const columnsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize selectedSegments when modal opens or currentCategory changes
  useEffect(() => {
    if (isOpen) {
      const initial = parseCategorySegments(currentCategory);
      setSelectedSegments(initial);
      setSearchQuery("");
    }
  }, [isOpen, currentCategory]);

  // Auto-scroll columns container to the right when deep level selected
  useEffect(() => {
    if (columnsContainerRef.current) {
      columnsContainerRef.current.scrollTo({
        left: columnsContainerRef.current.scrollWidth,
        behavior: "smooth"
      });
    }
  }, [selectedSegments]);

  if (!isOpen) return null;

  // Build the levels of columns based on currently selected segments
  // Column 0: Root nodes (YAHOO_CATEGORY_TREE)
  // Column 1: Children of selectedSegments[0]
  // Column 2: Children of selectedSegments[1] ...
  const columnsData: { level: number; nodes: CategoryNode[]; selectedName: string | undefined }[] = [];

  let currentLevelNodes: CategoryNode[] | undefined = YAHOO_CATEGORY_TREE;
  for (let i = 0; i <= selectedSegments.length; i++) {
    if (!currentLevelNodes || currentLevelNodes.length === 0) break;

    const selectedNameAtThisLevel = selectedSegments[i];
    columnsData.push({
      level: i,
      nodes: currentLevelNodes,
      selectedName: selectedNameAtThisLevel
    });

    if (selectedNameAtThisLevel) {
      const foundNode: CategoryNode | undefined = currentLevelNodes.find(
        (n: CategoryNode) => n.name === selectedNameAtThisLevel
      );
      currentLevelNodes = foundNode ? foundNode.children : undefined;
    } else {
      break;
    }
  }

  // Handle clicking an item in column `level`
  const handleItemClick = (level: number, node: CategoryNode) => {
    // Truncate segments up to this level, then append this node's name
    const newSegments = [...selectedSegments.slice(0, level), node.name];
    setSelectedSegments(newSegments);
  };

  // Handle clicking a search result
  const handleSelectSearchResult = (result: FlatCategory) => {
    setSelectedSegments(result.segments);
    setSearchQuery(""); // Clear search to show the hierarchy
  };

  // Preview of final full path
  const currentFormattedPath = buildCategoryPath(selectedSegments);

  const handleConfirm = () => {
    if (selectedSegments.length > 0) {
      onSelectCategory(currentFormattedPath);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "1050px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              ヤフオク カテゴリ選択
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              大カテゴリから小カテゴリへ順に選択、またはキーワード検索で指定できます。
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                color: "var(--text-muted)",
                fontSize: "16px",
                pointerEvents: "none"
              }}
            >
              🔍
            </span>
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="カテゴリ名で検索（例: 少年ジャンプ、攻略本、DVD、写真集、ファミコンなど）"
              style={{ paddingLeft: "42px", paddingRight: searchQuery ? "36px" : "12px", width: "100%" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown Overlay / View */}
        {searchQuery.trim().length > 0 ? (
          <div
            style={{
              flex: 1,
              minHeight: "360px",
              maxHeight: "450px",
              overflowY: "auto",
              background: "var(--bg-primary)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              padding: "8px"
            }}
          >
            <div style={{ padding: "8px 12px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              検索結果 ({searchResults.length}件)
            </div>
            {searchResults.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                一致するカテゴリが見つかりませんでした。「{searchQuery}」以外のキーワードをお試しください。
              </div>
            ) : (
              searchResults.map((result) => {
                const isCurrent = buildCategoryPath(result.segments) === currentFormattedPath;
                return (
                  <div
                    key={result.path}
                    onClick={() => handleSelectSearchResult(result)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      marginBottom: "4px",
                      background: isCurrent ? "rgba(234, 88, 12, 0.15)" : "transparent",
                      border: isCurrent ? "1px solid var(--accent-primary)" : "1px solid transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget.style.background = "var(--bg-secondary)");
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) (e.currentTarget.style.background = "transparent");
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                        {result.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {result.displayPath}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        background: result.isLeaf ? "rgba(16, 185, 129, 0.1)" : "var(--bg-secondary)",
                        color: result.isLeaf ? "#10b981" : "var(--text-muted)",
                        padding: "2px 8px",
                        borderRadius: "10px"
                      }}
                    >
                      {result.isLeaf ? "末端カテゴリ" : "階層"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Hierarchical Miller Columns View */
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "360px" }}>
            {/* Breadcrumb Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
                padding: "8px 12px",
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                marginBottom: "12px",
                fontSize: "13px"
              }}
            >
              <span
                onClick={() => setSelectedSegments([])}
                style={{
                  cursor: "pointer",
                  color: selectedSegments.length === 0 ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: 600
                }}
              >
                すべて
              </span>
              {selectedSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  <span style={{ color: "var(--text-muted)" }}>&gt;</span>
                  <span
                    onClick={() => setSelectedSegments(selectedSegments.slice(0, index + 1))}
                    style={{
                      cursor: "pointer",
                      color: index === selectedSegments.length - 1 ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontWeight: index === selectedSegments.length - 1 ? 700 : 500
                    }}
                  >
                    {segment}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Cascading Columns Container */}
            <div
              ref={columnsContainerRef}
              style={{
                display: "flex",
                gap: "10px",
                height: "330px",
                overflowX: "auto",
                overflowY: "hidden",
                paddingBottom: "6px"
              }}
            >
              {columnsData.map((col) => {
                const levelTitles = ["第1階層（大カテゴリ）", "第2階層", "第3階層", "第4階層", "第5階層", "第6階層"];
                const title = levelTitles[col.level] || `第${col.level + 1}階層`;

                return (
                  <div
                    key={col.level}
                    style={{
                      flex: "0 0 210px",
                      width: "210px",
                      display: "flex",
                      flexDirection: "column",
                      background: "var(--bg-primary)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderBottom: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>{title}</span>
                      <span style={{ fontSize: "11px" }}>{col.nodes.length}件</span>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
                      {col.nodes.map((node) => {
                        const isSelected = col.selectedName === node.name;
                        const hasChildren = node.children && node.children.length > 0;

                        return (
                          <div
                            key={node.name}
                            onClick={() => handleItemClick(col.level, node)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "2px",
                              background: isSelected ? "var(--accent-primary)" : "transparent",
                              color: isSelected ? "#ffffff" : "var(--text-primary)",
                              fontWeight: isSelected ? 600 : 400,
                              transition: "all 0.1s ease"
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) (e.currentTarget.style.background = "var(--bg-secondary)");
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) (e.currentTarget.style.background = "transparent");
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {node.name}
                            </span>
                            {hasChildren ? (
                              <span style={{ opacity: isSelected ? 1 : 0.4, fontSize: "12px", marginLeft: "4px" }}>
                                &gt;
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: isSelected ? "rgba(255, 255, 255, 0.2)" : "rgba(16, 185, 129, 0.15)",
                                  color: isSelected ? "#fff" : "#10b981",
                                  marginLeft: "4px"
                                }}
                              >
                                決定
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ flex: 1, minWidth: "260px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
              選択中のカテゴリ：
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: currentFormattedPath ? "var(--accent-primary)" : "var(--text-muted)",
                wordBreak: "break-all"
              }}
            >
              {currentFormattedPath || "未選択"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ padding: "8px 18px", fontSize: "13px" }}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirm}
              disabled={selectedSegments.length === 0}
              style={{
                padding: "8px 22px",
                fontSize: "13px",
                opacity: selectedSegments.length === 0 ? 0.5 : 1,
                cursor: selectedSegments.length === 0 ? "not-allowed" : "pointer"
              }}
            >
              このカテゴリに決定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
