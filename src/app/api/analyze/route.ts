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
                text: `You are an elite product appraiser and data extractor for Yahoo Auctions Japan (ヤフオク).
                Your goal is to achieve 100% accuracy in reading text from the provided image and formatting it perfectly for a listing.
                
                Analyze the provided image (book, DVD, game, or product).
                
                CRITICAL RULES:
                1. OCR Accuracy: Transcribe the exact Japanese text visible on the cover. Do not hallucinate names.
                2. Title Generation: Create a highly searchable Yahoo Auctions title. Include the main title, author/maker, format (DVD/Book), and key selling points (e.g., 初回限定盤, 帯付き if visible).
                3. Category: Guess the most precise Yahoo Auctions category path (e.g., "本、雑誌 > 文学、小説 > ロマンス" instead of just "本").
                4. Description: Describe exactly what you see. Mention if a barcode (JAN), obi (帯), or special packaging is visible. Do not make up plot summaries; stick to physical traits.
                
                Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
                - "title": string (Max 65 characters)
                - "category": string
                - "keywords": string (Comma-separated, highly relevant search terms)
                - "description": string (Physical condition and visible text description)`
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
