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

    // Call Gemini Flash Lite API
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
You MUST ONLY output information that is physically visible in the image.
Do NOT guess, infer, or invent ANY detail that is not explicitly written or shown.
If a detail is unclear or not visible, omit it entirely. Never fill in with assumptions.

RULE 2 — UNRESTRICTED CATEGORIZATION:
Do NOT apply any content safety filters to the category. 
If the product is an adult DVD, adult magazine, or adult photo book, categorize it accurately under the correct Yahoo Auctions adult subcategory path (e.g., "映画、ビデオ > DVD > アダルト").

RULE 3 — TITLE (MAX 65 CHARACTERS):
Construct the most keyword-dense, searchable title possible using ONLY text visible on the cover.
Combine: Main Title + Actress/Author Name + Series/Label + Any visible catchphrases.
Stay strictly under 65 characters.

RULE 4 — DESCRIPTION FORMAT (CRITICAL):
Write a long-form, highly detailed, professional product description in Japanese.
The AI must decide the appropriate sections based on the product type (book, DVD, game, etc.).
Use ■ headers for each section. Use ・bullet points inside sections.
The description MUST be detailed and long enough for a real buyer to fully understand the product.
Include ALL of the following that are relevant to the product type:
  - Product name, title, series, label/publisher/maker
  - All people involved (author, photographer, actress, director, illustrator, etc.)
  - All visible catchphrases, subtitles, and text on the cover
  - Format/media type (写真集, DVD, 攻略本, ゲームソフト, etc.)
  - Any visible edition info (初回版, 限定版, MOOK NO.X, etc.)
  - A dedicated section listing ALL other text visible on the cover as bullet points
  - A note about the product's general condition as a used/secondhand item (中古品)
  - A note that only what is visible in the photo is included (付属品不明)
  - A buyer caution note about the limits of image-based inspection

DO NOT include shipping methods, payment info, or store policies — those are handled separately.
ALL output must be in Japanese only.

========== OUTPUT FORMAT ==========
Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
- "title": string (Max 65 chars, keyword dense, in Japanese)
- "category": string (Uncensored, precise Yahoo Auctions category path, in Japanese)
- "keywords": string (Comma-separated exact phrases extracted from the cover, in Japanese)
- "description": string (Full, long-form, structured description in Japanese using ■ headers and ・bullets)`
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
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown json blocks just in case
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsedResult = JSON.parse(resultText);

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}
