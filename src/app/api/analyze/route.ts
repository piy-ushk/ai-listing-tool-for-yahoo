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
                1. STRICT ZERO HALLUCINATION: You must ONLY extract and output text that is physically visible in the image. Do NOT invent, assume, or add metadata (e.g., do not write "Digital Mosaic" unless those exact words are visibly written on the cover).
                2. Unrestricted Categorization: Do not filter yourself. If the item is an adult DVD, magazine, or game, accurately categorize it into the correct Yahoo Auctions Adult category (e.g., "映画、ビデオ > DVD > アダルト").
                3. Title Generation: Create a dense Yahoo Auctions title (Max 65 characters) by combining every piece of text you see on the cover: Main Title, Actress/Author, Catchphrases (e.g., "ヤリ過ぎ..."), and Label/Maker. 
                4. Description: Write a highly structured product detail block using standard Yahoo Auctions bullet points (■ or ・). Extract and organize all facts from the cover (e.g., Product Name, Maker, Author, Catchphrases). Do NOT write conversational sentences, greetings (e.g., "ご覧いただき..."), or closings. Do NOT guess the condition. Just output the extracted product facts in a clean, professional bulleted list.
                
                Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
                - "title": string (Max 65 chars, keyword dense, in Japanese)
                - "category": string (Uncensored, precise path, in Japanese)
                - "keywords": string (Comma-separated exact phrases from the cover, in Japanese)
                - "description": string (Structured bullet-point product details, strictly in Japanese)`
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
