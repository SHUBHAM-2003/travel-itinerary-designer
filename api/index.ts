import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const UNSPLASH_KEY = "sVoIVhGn3xXm0y-5OyMuPH8PYFB21gr7IYlOlpUB8Fc";

function parseJSONResponse(rawText: string) {
  let text = rawText.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  try { return JSON.parse(text); } catch (e) {}
  try { return JSON.parse(jsonrepair(text)); } catch (e) {}
  throw new Error("AI returned invalid JSON");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET" && req.url?.includes("/unsplash")) {
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const q = url.searchParams.get("query") || "travel";
      const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
      });
      const d: any = await r.json();
      if (d.results?.length) return res.redirect(d.results[0].urls.regular);
      res.redirect(`https://source.unsplash.com/600x400/?${encodeURIComponent(q)}`);
    } catch { res.redirect("https://source.unsplash.com/600x400/?travel"); }
    return;
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { rawData, apiKey, provider = "gemini", model } = req.body;
    if (!rawData) return res.status(400).json({ error: "raw data is required" });

    const prompt = `I am a professional travel itinerary designer. Transform this raw trip data into a detailed, beautifully written itinerary.

Raw Trip Data:
${rawData}

CRITICAL INSTRUCTIONS:
1. OVERVIEW: Write 2-3 paragraphs like a travel magazine. Use evocative, vivid language.
2. DAYS: Each day must have multiple activities with specific times (e.g. "08:00", "12:00") and 2-3 sentences of rich description.
3. INCLUSIONS/EXCLUSIONS: Generate 5-6 comprehensive items each.
4. CATEGORY: Choose from Devotional, Historical, Adventure, Educational, Honeymoon, Family, Wildlife, Hill Station, Beach, Corporate.
5. IMAGES: Pick descriptive image queries for Unsplash.

Return ONLY valid JSON. No markdown. No extra text.`;

    const actualApiKey = apiKey || process.env.GEMINI_API_KEY;
    const actualOpenRouterKey = apiKey || process.env.OPENROUTER_API_KEY;
    let data;

    if (provider === "openrouter") {
      if (!actualOpenRouterKey) return res.status(400).json({ error: "API Key required for OpenRouter" });
      const targetModel = model || "google/gemma-3-27b-it:free";
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${actualOpenRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
          "X-Title": "Karvir Tours Itinerary Designer"
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: "You are a professional travel itinerary designer. Respond with ONLY valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      const orData = await orRes.json();
      if (!orRes.ok || orData.error) throw new Error(orData.error?.message || "OpenRouter API error");
      const text = orData.choices?.[0]?.message?.content;
      if (!text) throw new Error("No response from OpenRouter");
      data = parseJSONResponse(text);
    } else {
      const targetModel = model || "gemini-2.5-flash";
      const ai = new GoogleGenAI({ apiKey: actualApiKey, httpOptions: { headers: { "User-Agent": "karvir-tours/1.0" } } });
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          systemInstruction: "You are a professional travel itinerary designer. Produce structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              duration: { type: Type.STRING },
              groupType: { type: Type.STRING },
              price: { type: Type.STRING },
              overview: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayTitle: { type: Type.STRING },
                    activities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["time", "description"] } },
                    meals: { type: Type.STRING },
                    stay: { type: Type.STRING },
                    imageQuery: { type: Type.STRING }
                  },
                  required: ["dayTitle", "activities", "imageQuery"]
                }
              },
              inclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
              exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
              importantNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "category", "duration", "groupType", "price", "overview", "days"]
          }
        }
      });
      if (!response.text) throw new Error("No response from Gemini");
      data = parseJSONResponse(response.text);
    }
    res.status(200).json(data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to generate" });
  }
}
