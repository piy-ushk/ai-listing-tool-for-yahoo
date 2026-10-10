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
        description: "■商品詳細\nご覧いただきありがとうございます。\n※これはAPIキーが未設定のため返されたテストデータです。\n・テスト項目1\n・テスト項目2"
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
Your task is to analyze the product image and generate a highly detailed, professional product description in Japanese.

========== STRICT RULES ==========
1. Start the description exactly with:
■商品詳細
ご覧いただきありがとうございます。

2. Use ■ headers for sections (e.g., ■カバー記載のテキスト一覧). 
3. Use ・bullet points inside sections.
4. List ALL visible text, titles, cast, catchphrases from the cover.
5. DO NOT include standard condition, shipping, or payment boilerplates. Just describe the product details found on the cover.
6. DO NOT output JSON. Output ONLY the raw Japanese text description. No markdown code blocks.`
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
          responseMimeType: "text/plain",
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ description: resultText });

  } catch (error: any) {
    console.error("Description Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate description' }, { status: 500 });
  }
}
