import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json());

// API Route to process raw trip data
app.post("/api/itinerary/generate", async (req, res) => {
    try {
      const { rawData, numImages = 3, apiKey, provider = "gemini", model } = req.body;
      
      if (!rawData) {
        return res.status(400).json({ error: "raw data is required" });
      }

      console.log(`Generating itinerary using ${provider}...`);
      
      const prompt = `I am a professional travel itinerary designer. You must transform this raw trip data into a very long, highly detailed, beautifully written itinerary.

Raw Trip Data:
${rawData}

CRITICAL WRITING INSTRUCTIONS:
1. OVERVIEW: Write a 2-3 paragraph overview that reads like an exclusive travel magazine (e.g., "Discover the untouched beauty...", "Let the gentle rhythm of waves..."). Use highly evocative, "curious words" and vivid adjectives.
2. DAYS & ACTIVITIES: Do NOT write short bullet points. Each day should be packed with detail. For EACH activity, provide the specific time (e.g., "08:00", "09:30") and write 2-3 sentences of rich description for what the guest will experience (e.g., "Guided scuba diving session to explore vibrant coral gardens where you will encounter...").
3. INCLUSIONS & EXCLUSIONS: Generate comprehensive lists. Exclusions should be realistic (e.g., "Flights, Travel Insurance, Personal expenses"). Inclusion should list 5-6 comprehensive items.
4. CATEGORY: Choose from Devotional, Historical, Adventure, Educational, Honeymoon, Family, Wildlife, Hill Station, Beach, Corporate.
5. IMAGES: Pick highly descriptive image queries (e.g., "Kavaratti Island lagoon", "Agatti Island coral reef") to fetch beautiful Unsplash photos.

Produce pure structured JSON. No markdown wrappers.`;

      function parseJSONResponse(rawText: string) {
        let text = rawText.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        try {
          return JSON.parse(text);
        } catch (error) {
          try {
            const repaired = jsonrepair(text);
            return JSON.parse(repaired);
          } catch (repairError) {
            console.error("Failed to parse JSON. Raw text:", rawText);
            throw new Error(`Received malformed JSON from AI provider. ${repairError}`);
          }
        }
      }

      let data;
      const actualApiKey = apiKey || process.env.GEMINI_API_KEY;
      const actualOpenRouterKey = apiKey || process.env.OPENROUTER_API_KEY;

      if (provider === "openrouter") {
        if (!actualOpenRouterKey) {
          return res.status(400).json({ error: "API Key is required for OpenRouter. Set OPENROUTER_API_KEY in .env or pass it in the request." });
        }
        
        const targetModel = model || "google/gemma-4-26b-a4b-it:free";
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${actualOpenRouterKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              {
                role: "system",
                content: `You are a professional travel itinerary designer. Produce structured JSON that describes a travel itinerary. 
You must respond with ONLY valid JSON and no markdown formatting or extra text.
Expected JSON format:
{
  "title": "string",
  "category": "string",
  "duration": "string",
  "groupType": "string",
  "price": "string",
  "overview": "string",
  "days": [
    {
      "dayTitle": "string",
      "activities": [
        {
          "time": "string",
          "description": "string"
        }
      ],
      "meals": "string",
      "stay": "string",
      "imageQuery": "string"
    }
  ],
  "inclusions": ["string"],
  "exclusions": ["string"],
  "importantNotes": ["string"]
}`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        const orData = await orRes.json();
        if (!orRes.ok || orData.error) {
          const errMsg = orData.error?.message || JSON.stringify(orData.error) || "OpenRouter error";
          throw new Error(`OpenRouter API Error: ${errMsg}`);
        }
        
        const text = orData.choices?.[0]?.message?.content;
        if (!text) {
          console.error("OpenRouter returned no text. Full response:", JSON.stringify(orData, null, 2));
          throw new Error("No response from OpenRouter");
        }
        data = parseJSONResponse(text);

      } else {
        // Gemini
        const targetModel = model || "gemini-2.5-flash";
        const localAi = new GoogleGenAI({
          apiKey: actualApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await localAi.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            systemInstruction: "You are a professional travel itinerary designer. Produce structured JSON that describes a travel itinerary.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Catchy auto-generated tour title" },
                category: { type: Type.STRING },
                duration: { type: Type.STRING },
                groupType: { type: Type.STRING },
                price: { type: Type.STRING },
                overview: { type: Type.STRING, description: "3 lines, tone-matched to category" },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayTitle: { type: Type.STRING, description: "Like Day 1: Ancient Heritage" },
                      activities: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            time: { type: Type.STRING, description: "e.g., Morning (06.00 - 09.00)" },
                            description: { type: Type.STRING, description: "Rich, tone-matched description" }
                          },
                          required: ["time", "description"]
                        }
                      },
                      meals: { type: Type.STRING },
                      stay: { type: Type.STRING },
                      imageQuery: { type: Type.STRING, description: "Specific location for an image thumbnail for this day." }
                    },
                    required: ["dayTitle", "activities", "imageQuery"]
                  }
                },
                inclusions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                exclusions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                importantNotes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "category", "duration", "groupType", "price", "overview", "days"]
            }
          }
        });

        const text = response.text;
        if (!text) throw new Error("No text returned from Gemini");
        
        data = parseJSONResponse(text);
      }
      
      res.json(data);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate itinerary" });
    }
  });

  // Unsplash image proxy
  app.get("/api/unsplash", async (req, res) => {
    try {
      const { query } = req.query;
      const q = (query as string) || "travel";
      const accessKey = "sVoIVhGn3xXm0y-5OyMuPH8PYFB21gr7IYlOlpUB8Fc";
      const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      const data: any = await unsplashRes.json();
      if (data.results && data.results.length > 0) {
        res.redirect(data.results[0].urls.regular);
      } else {
        const fallbackQ = q.replace(/[^a-zA-Z]/g, "");
        res.redirect(`https://loremflickr.com/600/450/${fallbackQ}`);
      }
    } catch (err) {
      const fallbackQ = ((req.query.query as string) || "travel").replace(/[^a-zA-Z]/g, "");
      res.redirect(`https://loremflickr.com/600/450/${fallbackQ}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      }).then((vite) => {
        app.use(vite.middlewares);
      });
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
