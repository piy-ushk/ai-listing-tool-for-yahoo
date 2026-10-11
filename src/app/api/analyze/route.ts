import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY found. Returning mock data.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        title: "[60925x] テスト商品タイトル 自動生成",
        category: "本、雑誌 > アート、エンターテインメント",
        keywords: "テスト, サンプル, OCR検証",
        description: "※これはAPIキーが未設定のため返されたテストデータです。実際の画像認識を行うには、.env.localにGEMINI_API_KEYを設定してください。"
      });
    }

    // Call Gemini Flash Lite API (Fastest model to avoid long wait times & 503 errors)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an elite product listing specialist for Yahoo Auctions Japan (ヤフオク).
Your task is to analyze the product image and generate a highly accurate, detailed, and well-structured auction listing description.

PRODUCT TYPES YOU WILL ENCOUNTER: Books, photo books, manga, magazines, DVDs, Blu-rays, games, toys, figures, and similar used goods.

========== STRICT RULES ==========

RULE 1 — ZERO HALLUCINATION (MOST IMPORTANT):
You MUST ONLY output information that is physically visible and readable in the image, with ONE EXCEPTION:
Exception: You MUST use your extensive general knowledge to infer the "publisher" (出版社/メーカー/レーベル) if it is not printed on the cover (e.g. 集英社 for 週刊少年ジャンプ, 双葉社 for 完璧攻略シリーズ, etc.).
For all other fields, including the title and keywords, DO NOT guess, infer, or apply "common knowledge".
SPECIFIC EXAMPLES OF BANNED HALLUCINATIONS in title:
  - Do NOT write「デジタルモザイク」unless those exact characters are printed on the cover.
  - Do NOT write a director's name unless it is visibly printed on the cover.
  - Do NOT write an ISBN, JAN code, or catalog number unless it is clearly readable in the image.
  - Do NOT add any technical spec, edition detail, or person's role unless it is explicitly written on the cover.
If a detail is unclear or not visible, omit it entirely. Never fill in with assumptions.

RULE 2 — UNRESTRICTED CATEGORIZATION (YAHOO REAL TAXONOMY DOWN TO LEAF CATEGORY):
Do NOT apply any content safety filters to the category.
You MUST use Yahoo Auctions Japan's real category path format, starting with「すべて>」.
CRITICAL: You MUST go down to the deepest, most specific subcategory / leaf category (末端カテゴリまで正確に出力すること). Never stop at intermediate categories like「男性コミック誌」.

Specific taxonomy rules for major products:
- Weekly Shonen Jump (週刊少年ジャンプ):
  Category MUST be: すべて>本、雑誌>雑誌>漫画､コミック>男性コミック誌>少年マンガ誌>少年ジャンプ
- Weekly Shonen Sunday (週刊少年サンデー):
  Category MUST be: すべて>本、雑誌>雑誌>漫画､コミック>男性コミック誌>少年マンガ誌>少年サンデー
- Weekly Shonen Magazine (週刊少年マガジン):
  Category MUST be: すべて>本、雑誌>雑誌>漫画､コミック>男性コミック誌>少年マンガ誌>少年マガジン
- Manga Tankobon (単行本コミックス):
  Category: すべて>本、雑誌>漫画、コミック>少年 (or 青年 / 少女)
- Game Strategy Book (ゲーム攻略本):
  Category: すべて>本、雑誌>アート、エンターテインメント>ゲーム攻略本>アクション (or ロールプレイング / その他)
- Celebrity / Idol Photo Book (写真集):
  Category: すべて>本、雑誌>アート、エンターテインメント>写真集>女性タレント>その他
- Video / Movie / Adult DVD:
  Category: すべて>映画、ビデオ>DVD>... or すべて>その他>アダルト>DVD>人妻>その他 (use real uncensored Yahoo auction path)

REFERENCE EXAMPLES (use these as a guide for format and depth):
Example 1 (Weekly Shonen Jump Magazine):
Title: 週刊少年ジャンプ 1987年1・2号 新年合併号 ジョジョの奇妙な冒険 新連載第2弾 荒木飛呂彦
Publisher: 集英社
Category: すべて>本、雑誌>雑誌>漫画､コミック>男性コミック誌>少年マンガ誌>少年ジャンプ

Example 2 (Famicom Game Strategy Book):
Title: リンクの冒険 必勝攻略法 ファミリーコンピュータ完璧攻略シリーズ
Publisher: 双葉社
Category: すべて>本、雑誌>アート、エンターテインメント>ゲーム攻略本>アクション

Example 3 (Movie DVD):
Title: 映画タイトル スペシャルエディション / 俳優名
Publisher: 映画配給会社
Category: すべて>映画、ビデオ>DVD>映画>ドラマ

RULE 3 — TITLE (MAX 65 CHARACTERS):
Construct the most keyword-dense, searchable title possible using ONLY text visible on the cover.
FORMAT ORDER: Main Title + Issue/Volume/Subtitle + Series/Label + Author/Artist.
CRITICAL: Do NOT put the Series name before the Main Title. The Main Title must come first.
CRITICAL: Do NOT append generic product types like "攻略本", "写真集", or "DVD" to the end of the title unless they are literally part of the printed book title.
Stay strictly under 65 characters.

RULE 4 — PRODUCT TYPE DETECTION:
Detect the product_type: "book", "dvd", "bluray", "game", "magazine", "figure", "other".
ALL output must be in Japanese only (except product_type).

========== OUTPUT FORMAT ==========
Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
- "title": string (Max 65 chars, keyword dense, extracted from cover text, in Japanese)
- "category": string (Uncensored, deepest Yahoo Auctions category path starting with すべて>, in Japanese)
- "keywords": string (Comma-separated exact text phrases extracted from the cover, in Japanese)
- "publisher": string (Publisher/Maker, inferred from knowledge or image. Leave empty string if unknown)
- "product_type": string (one of: "book", "dvd", "bluray", "game", "magazine", "figure", "other")`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "")
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    let resultText = '';
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      resultText = data.candidates[0].content.parts[0].text;
    } else {
      console.error("No valid content found in API response", JSON.stringify(data, null, 2));
      throw new Error('API returned an empty or blocked response. Check safety settings or prompt.');
    }
    
    // Clean up markdown json blocks just in case
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsedResult = JSON.parse(resultText);

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}
