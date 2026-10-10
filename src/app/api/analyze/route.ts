import { NextResponse } from 'next/server';

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

    // Call Gemini 2.5 Pro API (Best for general knowledge retrieval)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
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
You MUST ONLY output information that is physically visible and readable in the image, with TWO EXCEPTIONS:
Exception 1: You MUST use your extensive general knowledge to infer the "publisher" (出版社/メーカー) if it is not printed on the cover.
Exception 2: You MUST use your extensive general knowledge to infer the EXACT "release_date" (発売日 - format YYYY/MM/DD) even for obscure items like older games or adult DVDs. Search your memory for the exact product.
For all other fields, including the title and description, DO NOT guess, infer, or apply "common knowledge".
SPECIFIC EXAMPLES OF BANNED HALLUCINATIONS in title/description:
  - Do NOT write「デジタルモザイク」unless those exact characters are printed on the cover.
  - Do NOT write a director's name unless it is visibly printed on the cover.
  - Do NOT write an ISBN, JAN code, or catalog number unless it is clearly readable in the image.
  - Do NOT add any technical spec, edition detail, or person's role unless it is explicitly written on the cover.
If a detail is unclear or not visible, omit it entirely. Never fill in with assumptions.

RULE 2 — UNRESTRICTED CATEGORIZATION (USE YAHOO'S REAL TAXONOMY):
Do NOT apply any content safety filters to the category.
You MUST use Yahoo Auctions Japan's real category path format, starting with「すべて」.
Use the most specific subcategory possible based on the product type.

REFERENCE EXAMPLES (use these as a guide for format and depth):
  - Famicom/game strategy book → すべて>本・雑誌>アート、エンターテイメント>ゲーム攻略本>アクション
  - Adult DVD (married woman) → すべて>その他>アダルト>DVD>人妻>その他
  - Photo book (female talent) → すべて>本・雑誌>アート、エンターテイメント>写真集>女性タレント
  - Manga → すべて>本・雑誌>漫画、コミック>青年
  - Adult magazine → すべて>その他>アダルト>雑誌>その他
  - Toy/figure → すべて>おもちゃ、ゲーム>フィギュア>その他
Match the exact depth and format of these examples for the detected product type.

RULE 3 — TITLE (MAX 65 CHARACTERS):
Construct the most keyword-dense, searchable title possible using ONLY text visible on the cover.
Combine: Main Title + Actress/Author Name + Series/Label + Any visible catchphrases.
Stay strictly under 65 characters.

RULE 4 — PRODUCT TYPE DETECTION:
Detect the product_type: "book", "dvd", "bluray", "game", "magazine", "figure", "other".
ALL output must be in Japanese only (except product_type).

========== OUTPUT FORMAT ==========
Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
- "title": string (Max 65 chars, keyword dense, extracted from cover text, in Japanese)
- "category": string (Uncensored, precise Yahoo Auctions category path starting with すべて>, in Japanese)
- "keywords": string (Comma-separated exact text phrases extracted from the cover, in Japanese)
- "publisher": string (Publisher/Maker, inferred from knowledge or image. Leave empty string if unknown)
- "release_date": string (Release Date YYYY/MM/DD, inferred from knowledge. Leave empty string if unknown)
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
