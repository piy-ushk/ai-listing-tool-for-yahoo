export interface CategoryNode {
  name: string;
  children?: CategoryNode[];
}

export interface FlatCategory {
  path: string;       // e.g. "すべて>本、雑誌>雑誌>漫画､コミック>男性コミック誌>少年マンガ誌>少年ジャンプ"
  displayPath: string; // e.g. "本、雑誌 > 雑誌 > 漫画､コミック > 男性コミック誌 > 少年マンガ誌 > 少年ジャンプ"
  name: string;       // Leaf name e.g. "少年ジャンプ"
  segments: string[]; // ['本、雑誌', '雑誌', '漫画､コミック', ...]
  isLeaf: boolean;
}

export const YAHOO_CATEGORY_TREE: CategoryNode[] = [
  {
    name: "本、雑誌",
    children: [
      {
        name: "雑誌",
        children: [
          {
            name: "漫画､コミック",
            children: [
              {
                name: "男性コミック誌",
                children: [
                  {
                    name: "少年マンガ誌",
                    children: [
                      { name: "少年ジャンプ" },
                      { name: "少年サンデー" },
                      { name: "少年マガジン" },
                      { name: "少年チャンピオン" },
                      { name: "その他" }
                    ]
                  },
                  {
                    name: "青年マンガ誌",
                    children: [
                      { name: "ヤングジャンプ" },
                      { name: "ヤングマガジン" },
                      { name: "ビッグコミック" },
                      { name: "ヤングアニマル" },
                      { name: "モーニング" },
                      { name: "その他" }
                    ]
                  },
                  { name: "その他" }
                ]
              },
              {
                name: "女性コミック誌",
                children: [
                  { name: "少女マンガ誌" },
                  { name: "女性マンガ誌" },
                  { name: "その他" }
                ]
              },
              { name: "その他" }
            ]
          },
          {
            name: "アート、エンターテインメント",
            children: [
              { name: "アイドル、芸能人" },
              { name: "映画、テレビ" },
              { name: "音楽" },
              { name: "演劇" },
              { name: "サブカルチャー" },
              { name: "その他" }
            ]
          },
          {
            name: "情報、テレビ",
            children: [
              { name: "テレビ" },
              { name: "映画" },
              { name: "情報誌" },
              { name: "その他" }
            ]
          },
          {
            name: "趣味、スポーツ",
            children: [
              { name: "車、バイク" },
              { name: "ゲーム" },
              { name: "競馬" },
              { name: "鉄道" },
              { name: "釣り" },
              { name: "その他" }
            ]
          },
          { name: "その他" }
        ]
      },
      {
        name: "漫画、コミック",
        children: [
          { name: "少年" },
          { name: "青年" },
          { name: "少女" },
          { name: "女性" },
          { name: "全巻セット" },
          { name: "同人誌" },
          { name: "その他" }
        ]
      },
      {
        name: "アート、エンターテインメント",
        children: [
          {
            name: "ゲーム攻略本",
            children: [
              { name: "アクション" },
              { name: "ロールプレイング" },
              { name: "シミュレーション" },
              { name: "対戦格闘ゲーム" },
              { name: "その他" }
            ]
          },
          {
            name: "写真集",
            children: [
              { name: "女性タレント" },
              { name: "女性タレント複数人" },
              { name: "男性タレント" },
              { name: "グラビア" },
              { name: "アート写真" },
              { name: "その他" }
            ]
          },
          {
            name: "アニメーション",
            children: [
              { name: "アニメーション、作画技法" },
              { name: "設定資料集" },
              { name: "原画、動画" },
              { name: "その他" }
            ]
          },
          {
            name: "映画、テレビ",
            children: [
              { name: "映画パンフレット" },
              { name: "作品ガイド" },
              { name: "その他" }
            ]
          },
          {
            name: "音楽、楽譜",
            children: [
              { name: "バンドスコア" },
              { name: "ピアノ曲集" },
              { name: "その他" }
            ]
          },
          { name: "デザイン、グラフィック" },
          { name: "絵画" },
          { name: "その他" }
        ]
      },
      {
        name: "ノンフィクション、教養",
        children: [
          { name: "サブカルチャー" },
          { name: "ドキュメンタリー" },
          { name: "歴史、地理" },
          { name: "社会、政治" },
          { name: "雑学、知識" },
          { name: "その他" }
        ]
      },
      {
        name: "文学、小説",
        children: [
          { name: "小説一般" },
          { name: "ライトノベル" },
          { name: "SF、ミステリー" },
          { name: "エッセイ、随筆" },
          { name: "その他" }
        ]
      },
      {
        name: "古書、古文書",
        children: [
          { name: "和書" },
          { name: "その他" }
        ]
      },
      {
        name: "学習、教育",
        children: [
          { name: "語学" },
          { name: "参考書" },
          { name: "その他" }
        ]
      },
      { name: "趣味、実用" },
      { name: "住まい、暮らし、育児" },
      { name: "その他" }
    ]
  },
  {
    name: "映画、ビデオ",
    children: [
      {
        name: "DVD",
        children: [
          {
            name: "アニメ",
            children: [
              { name: "日本" },
              { name: "海外" },
              { name: "その他" }
            ]
          },
          {
            name: "映画",
            children: [
              { name: "アクション、アドベンチャー" },
              { name: "ドラマ" },
              { name: "SF、ファンタジー" },
              { name: "サスペンス" },
              { name: "ホラー" },
              { name: "コメディ" },
              { name: "その他" }
            ]
          },
          {
            name: "テレビドラマ",
            children: [
              { name: "日本のテレビドラマ" },
              { name: "海外ドラマ" },
              { name: "その他" }
            ]
          },
          {
            name: "ミュージック",
            children: [
              { name: "J-POP" },
              { name: "ロック、ポップス" },
              { name: "その他" }
            ]
          },
          { name: "お笑い、バラエティ" },
          { name: "アイドル、イメージ" },
          { name: "ドキュメンタリー" },
          { name: "その他" }
        ]
      },
      {
        name: "ブルーレイ",
        children: [
          {
            name: "アニメ",
            children: [
              { name: "日本" },
              { name: "海外" },
              { name: "その他" }
            ]
          },
          {
            name: "映画",
            children: [
              { name: "外国映画" },
              { name: "日本映画" },
              { name: "その他" }
            ]
          },
          {
            name: "テレビドラマ",
            children: [
              { name: "日本のテレビドラマ" },
              { name: "海外ドラマ" },
              { name: "その他" }
            ]
          },
          {
            name: "ミュージック",
            children: [
              { name: "J-POP" },
              { name: "ロック、ポップス" },
              { name: "その他" }
            ]
          },
          { name: "アイドル、イメージ" },
          { name: "その他" }
        ]
      },
      {
        name: "レーザーディスク",
        children: [
          { name: "アニメ" },
          { name: "映画" },
          { name: "その他" }
        ]
      },
      {
        name: "ビデオテープ",
        children: [
          { name: "アニメ" },
          { name: "映画" },
          { name: "その他" }
        ]
      },
      { name: "その他" }
    ]
  },
  {
    name: "音楽",
    children: [
      {
        name: "CD",
        children: [
          {
            name: "ジャパニーズポップス",
            children: [
              { name: "ロック、ポップス" },
              { name: "アイドル" },
              { name: "インディーズ" },
              { name: "その他" }
            ]
          },
          {
            name: "アニメソング",
            children: [
              { name: "アニメソング" },
              { name: "ゲームミュージック" },
              { name: "その他" }
            ]
          },
          { name: "ロック、ポップス一般" },
          { name: "クラシック" },
          { name: "ジャズ" },
          { name: "サウンドトラック" },
          { name: "その他" }
        ]
      },
      {
        name: "レコード",
        children: [
          { name: "邦楽" },
          { name: "洋楽" },
          { name: "アニメソング" },
          { name: "その他" }
        ]
      },
      { name: "その他" }
    ]
  },
  {
    name: "おもちゃ、ゲーム",
    children: [
      {
        name: "ゲーム",
        children: [
          {
            name: "テレビゲーム",
            children: [
              {
                name: "ファミコン",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "スーパーファミコン",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "NINTENDO 64",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "ゲームボーイ",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "ゲームボーイアドバンス",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "Nintendo Switch",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "プレイステーション",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "プレイステーション2",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "セガサターン",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "メガドライブ",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              {
                name: "PCエンジン",
                children: [
                  { name: "タイトル" },
                  { name: "本体、アクセサリー" },
                  { name: "その他" }
                ]
              },
              { name: "その他" }
            ]
          },
          {
            name: "トレーディングカードゲーム",
            children: [
              { name: "ポケモンカードゲーム" },
              { name: "遊戯王（コナミ）" },
              { name: "マジック：ザ・ギャザリング" },
              { name: "その他" }
            ]
          },
          { name: "その他" }
        ]
      },
      {
        name: "フィギュア",
        children: [
          {
            name: "コミック、アニメ",
            children: [
              { name: "ドラゴンボール" },
              { name: "ジョジョの奇妙な冒険" },
              { name: "ワンピース" },
              { name: "美少女" },
              { name: "その他" }
            ]
          },
          {
            name: "特撮",
            children: [
              { name: "仮面ライダー" },
              { name: "ウルトラマン" },
              { name: "その他" }
            ]
          },
          { name: "ゲームキャラクター" },
          { name: "その他" }
        ]
      },
      {
        name: "プラモデル",
        children: [
          { name: "ガンダム" },
          { name: "車、バイク" },
          { name: "ミリタリー" },
          { name: "その他" }
        ]
      },
      { name: "その他" }
    ]
  },
  {
    name: "ホビー、カルチャー",
    children: [
      {
        name: "コミック、アニメグッズ",
        children: [
          { name: "ポスター" },
          { name: "タペストリー" },
          { name: "キーホルダー" },
          { name: "クリアファイル" },
          { name: "その他" }
        ]
      },
      {
        name: "タレントグッズ",
        children: [
          { name: "サイン" },
          { name: "写真" },
          { name: "その他" }
        ]
      },
      {
        name: "ミリタリー",
        children: [
          { name: "トイガン" },
          { name: "装備品" },
          { name: "その他" }
        ]
      },
      { name: "美術品" },
      { name: "楽器、器材" },
      { name: "その他" }
    ]
  },
  {
    name: "アンティーク、コレクション",
    children: [
      {
        name: "印刷物",
        children: [
          { name: "チラシ" },
          { name: "ポスター" },
          { name: "切り抜き" },
          { name: "絵はがき" },
          { name: "その他" }
        ]
      },
      {
        name: "雑貨",
        children: [
          { name: "レトロ" },
          { name: "その他" }
        ]
      },
      { name: "トレーディングカード" },
      { name: "その他" }
    ]
  },
  {
    name: "その他",
    children: [
      {
        name: "アダルト",
        children: [
          {
            name: "DVD",
            children: [
              {
                name: "人妻",
                children: [
                  { name: "その他" }
                ]
              },
              { name: "アイドル、イメージ" },
              { name: "女優" },
              { name: "企画物" },
              { name: "その他" }
            ]
          },
          {
            name: "ブルーレイ",
            children: [
              { name: "人妻" },
              { name: "アイドル、イメージ" },
              { name: "女優" },
              { name: "その他" }
            ]
          },
          {
            name: "本、雑誌",
            children: [
              { name: "写真集" },
              { name: "雑誌" },
              { name: "コミック" },
              { name: "その他" }
            ]
          },
          { name: "グッズ" },
          { name: "その他" }
        ]
      },
      { name: "その他" }
    ]
  }
];

// Helper: Flatten all leaf categories for fast keyword searching
export function getAllFlatCategories(): FlatCategory[] {
  const result: FlatCategory[] = [];

  function traverse(nodes: CategoryNode[], currentSegments: string[]) {
    for (const node of nodes) {
      const nextSegments = [...currentSegments, node.name];
      const isLeaf = !node.children || node.children.length === 0;

      const path = "すべて>" + nextSegments.join(">");
      const displayPath = nextSegments.join(" > ");

      result.push({
        path,
        displayPath,
        name: node.name,
        segments: nextSegments,
        isLeaf
      });

      if (node.children && node.children.length > 0) {
        traverse(node.children, nextSegments);
      }
    }
  }

  traverse(YAHOO_CATEGORY_TREE, []);
  return result;
}

const CACHED_FLAT_CATEGORIES = getAllFlatCategories();

// Keyword search across category tree
export function searchCategoryByKeyword(query: string, maxResults = 25): FlatCategory[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const terms = trimmed.split(/[\s　]+/).filter(Boolean);

  return CACHED_FLAT_CATEGORIES.filter((item) => {
    // We prioritize searching leaf categories or deep categories, matching all terms
    const targetString = (item.path + " " + item.displayPath + " " + item.name).toLowerCase();
    return terms.every((term) => targetString.includes(term));
  }).slice(0, maxResults);
}

// Split path into segments without "すべて>"
export function parseCategorySegments(categoryPath: string): string[] {
  if (!categoryPath) return [];
  const clean = categoryPath.replace(/^すべて>/, "").trim();
  if (!clean) return [];
  return clean.split(">").map((s) => s.trim()).filter(Boolean);
}

// Rebuild "すべて>..." path from segments
export function buildCategoryPath(segments: string[]): string {
  if (!segments || segments.length === 0) return "";
  return "すべて>" + segments.join(">");
}
