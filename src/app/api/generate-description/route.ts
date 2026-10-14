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
        description: "■商品詳細\nご覧いただきありがとうございます。\n※これはAPIキーが未設定のため返されたテストデータです。\n・テスト項目1\n・テスト項目2"
      });
    }

    // Call Gemini API with automatic fallback across models to eliminate 429 quota and 503 errors
    const CANDIDATE_MODELS = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ];

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              text: `You are an elite product listing specialist for Yahoo Auctions Japan (ヤフオク).
Your task is to analyze the product image and generate a highly detailed, professional product description in Japanese.

========== STRICT RULES ==========
1. DO NOT write a synopsis, story summary, or product feature review. The user does not use product-specific descriptions.
2. ONLY extract and list special notes visible on the cover (e.g. "Includes map", "Special edition", "Visible scratches on the cover").
3. Format your output strictly under the header:
【特記事項】
・(bullet points of extracted info)

4. If there is absolutely no special text or visible damage on the cover, simply output:
【特記事項】
特に目立つ記載や特記事項はありません。
5. DO NOT output JSON. Output ONLY the raw Japanese text description. No markdown code blocks.`
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
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    let data: any = null;
    let lastErrorText = '';

    for (const model of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
          });

          if (response.ok) {
            data = await response.json();
            break;
          }

          lastErrorText = await response.text();
          console.warn(`Model ${model} attempt ${attempt + 1} failed (${response.status})`);

          // If 503 temporary spike, wait 1.2s and retry before moving to next model
          if (response.status === 503 && attempt === 0) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
          break;
        } catch (err: any) {
          lastErrorText = err.message;
          console.warn(`Model ${model} fetch error: ${err.message}`);
          break;
        }
      }
      if (data) break;
    }

    if (!data) {
      console.error("All candidate Gemini models failed. Last error:", lastErrorText);
      throw new Error(`Gemini API Error: ${lastErrorText}`);
    }
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("No valid content found in API response", JSON.stringify(data, null, 2));
      throw new Error('API returned an empty or blocked response.');
    }
    const resultText = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ description: resultText });

  } catch (error: any) {
    console.error("Description Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate description' }, { status: 500 });
  }
}
