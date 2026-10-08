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
                4. Description: Output a complete, long-form Yahoo Auctions product description using the EXACT structure below. Replace [brackets] with real extracted values. Keep all static sections VERBATIM — do NOT shorten, skip, or rewrite them. Output only the filled-in text, no extra commentary.

---
■ 商品名
[シリーズ名・レーベル名 if visible]
「[メインタイトル]」
[著者・出演者名] [種別: 写真集 / DVD / 攻略本 etc.]
[英語表記 if visible]

■ 商品概要
[2〜3文で商品の概要を説明。表紙から読み取れる情報（タイトル、人物名、キャッチコピー、レーベル等）を具体的に記述。画像から視覚的に確認できる情報（表紙の写真の様子、文字の配置など）も加えてよい。]

表紙に確認できるその他の文字：
[・各テキスト要素を箇条書き]

■ 表紙の状態
中古品です。

今回の写真では表紙全体を確認できます。
表紙には経年・保管によるものと思われる若干の使用感が見られます。

大きく目立つ破れや欠損は、掲載写真からは確認できません。
ただし、表紙の端や角には多少の擦れ・使用感が見られる場合があります。

※状態については、掲載写真をよくご確認ください。

■ 付属品
写真に写っている本体のみです。

※帯・付属品・特典等については、掲載写真から確認できるもの以外は付属の有無を保証できません。

■ ご注意
こちらは掲載画像から確認できる範囲での商品説明となります。

本の内部、ページの状態、書き込み、切り抜き、破れ、付属品の有無などは今回の画像から確認できておりません。

中古品・保管品のため、細かな擦れや経年による変化などがある場合があります。
状態を気にされる方は、掲載写真をご確認のうえご入札ください。

写真に写っているものが出品物のすべてとなります。
---

                Return ONLY a strictly valid JSON object (no markdown, no backticks) with these exact keys:
                - "title": string (Max 65 chars, keyword dense, in Japanese)
                - "category": string (Uncensored, precise path, in Japanese)
                - "keywords": string (Comma-separated exact phrases from the cover, in Japanese)
                - "description": string (The complete filled-in description block above, strictly in Japanese)`
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
