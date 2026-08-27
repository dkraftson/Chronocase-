import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { synthesizeWatchFromQuery } from "./src/data/fallbackHorology";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to execute Gemini generateContent with automatic retry and model fallback cascade
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  baseConfig: any,
  modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
) {
  let lastError: any = null;

  for (const model of modelsToTry) {
    const isLite = model.includes("lite");
    const configWithThinking = {
      ...baseConfig,
      thinkingConfig: {
        thinkingLevel: isLite ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
      },
    };

    // Up to 2 attempts per model with exponential backoff on 503/429/overload
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Calling Gemini with model '${model}' (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: configWithThinking,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("temporarily unavailable");

        console.warn(`Attempt ${attempt} for model ${model} failed:`, errMsg);

        if (isTransient && attempt === 1) {
          // Wait 1.0s + jitter before quick retry on the same model
          const delay = 1000 + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // If not transient or already retried, break to next model in fallback cascade
        break;
      }
    }
  }

  throw lastError || new Error("All AI models are currently experiencing high demand. Please try again shortly.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API endpoint to analyze watch and generate horological facts and rendering params
app.post("/api/watches/generate", async (req, res) => {
  const { query, customNotes, sourceLens } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Watch query is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.info("Gemini API key not configured, synthesizing watch from authoritative horology engine");
    const synthesized = synthesizeWatchFromQuery(query, customNotes, sourceLens);
    return res.json(synthesized);
  }

  try {
    const prompt = `You are a world-renowned master horologist, luxury watch historian, master watchmaker, and senior curator.
Analyze and generate a comprehensive, highly accurate horological specification, history, and rendering configuration for this watch request: "${query}".
${sourceLens ? `Selected Source Lens: "${sourceLens}". Ground the analysis in the perspective of that authority.` : ""}
${customNotes ? `User note: ${customNotes}` : ""}

AUTHORITATIVE SOURCES KNOWLEDGE BASE TO DRAW FROM:
1. "The Watch, Thoroughly Revised" (Gene Stone & Stephen Pulvirent): Haute horlogerie landmarks, holy trinity heritage (Patek, AP, Vacheron), historical genesis, manufacture calibers, milestone auctions.
2. Chrono24: Global secondary market liquidity indices, reference number precision, real-world valuation ranges, market appreciation trends.
3. Mayors: Premier authorized luxury boutique catalog (Rolex, Tudor, Omega, Cartier, IWC, Grand Seiko, Breitling, Jaeger-LeCoultre).
4. Primer Magazine: Enthusiast value champions, smart tool watches, accessible dress classics ($500 - $3,000 category), versatile style pairings.
5. Teddy Baldassarre: Curated modern enthusiast library, independent watchmakers, microbrand standouts, in-depth spec comparisons, in-house caliber tolerances.
6. eBay Authenticity Vault: Verified vintage grails, military-issue watches, pre-moon rarities, patina characteristics, rare dial variations.

Provide authentic, accurate details about brand, model, exact reference number, historical release year, case dimensions, movement specs (caliber, power reserve, frequency, jewels, key features), water resistance, market values, source citation, and exact visual design traits.

CRITICAL COLOR & FINISH ACCURACY RULES:
- If the requested watch is stainless steel, silver, white metal, or titanium, caseFinish MUST be 'steel' (or 'titanium'/'platinum'). Do NOT default to yellow_gold or rose_gold unless the watch is explicitly a gold reference.
- For silver, argenté, rhodium, opaline, or white dials, dialColor MUST be a clean silver (#e2e8f0, #cbd5e1) or white (#f8fafc). NEVER set dialColor to gold, yellow, or champagne (#d97706 or #eab308) unless the user explicitly requested a champagne or yellow gold dial.
- Hands and marker colors (handsColor, markerColor) for steel/silver watches must be silver/steel/white (#ffffff, #e2e8f0, #cbd5e1, or blued #1e3a8a), NOT gold.

Ensure the renderingConfig accurately mirrors this exact watch's visual look (case shape, finish, bezel type, bezel color/accent, dial color, dial pattern, marker type, hands style, lume, date window, cyclops, subdials, and strap).`;

    const config = {
      systemInstruction: "You are an elite horological analyst combining knowledge from 'The Watch, Thoroughly Revised', Chrono24, Mayors, Primer Magazine, Teddy Baldassarre, and eBay Vault. Return valid JSON adhering to the provided schema with high precision watch data. Pay meticulous attention to case metal (default to steel for stainless watches) and dial color (use crisp silver/white #e2e8f0/#f8fafc for silver/white dials, never gold).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Model name, e.g., Submariner Date" },
          brand: { type: Type.STRING, description: "Brand name, e.g., Rolex" },
          reference: { type: Type.STRING, description: "Reference number, e.g., 126610LN" },
          yearIntroduced: { type: Type.STRING, description: "Year or era first introduced, e.g., 1953 or 2020" },
          category: {
            type: Type.STRING,
            enum: ["Diver", "Chronograph", "Dress", "Pilot", "Integrated", "GMT / Travel", "Grand Complication", "Field", "Everyday"],
          },
          provenanceSource: {
            type: Type.STRING,
            enum: ["the_watch_revised", "chrono24", "mayors", "primer_magazine", "teddy_baldassarre", "ebay_vault"],
            description: "The primary authoritative source context best matching this watch",
          },
          sourceBadgeLabel: { type: Type.STRING, description: "Display source badge label, e.g., '📚 The Watch, Thoroughly Revised' or '🌐 Chrono24 Market Index'" },
          msrp: { type: Type.STRING, description: "Original MSRP / retail price string, e.g., '$10,250 USD'" },
          marketPrice: { type: Type.STRING, description: "Current estimated market value, e.g., '$13,500 - $15,000 USD'" },
          caseDiameter: { type: Type.NUMBER, description: "Diameter in mm, e.g., 41" },
          caseThickness: { type: Type.NUMBER, description: "Thickness in mm, e.g., 12.3" },
          lugToLug: { type: Type.NUMBER, description: "Lug to lug in mm, e.g., 48.1" },
          lugWidth: { type: Type.NUMBER, description: "Lug width in mm, e.g., 20 or 21" },
          waterResistance: { type: Type.STRING, description: "Water resistance rating, e.g., '300m / 1,000ft'" },
          movement: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                enum: ["Automatic", "Manual Wind", "Quartz", "Spring Drive", "Co-Axial", "Tourbillon"],
              },
              caliber: { type: Type.STRING, description: "Movement caliber name, e.g., 'Calibre 3235'" },
              powerReserve: { type: Type.STRING, description: "Power reserve, e.g., '70 Hours'" },
              frequencyVph: { type: Type.INTEGER, description: "Beats per hour (VPH), usually 28800, 36000, 21600, or 18000" },
              jewels: { type: Type.INTEGER, description: "Number of jewels, e.g., 31" },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Notable movement tech, e.g., Chronergy Escapement, Parachrom hairspring, column wheel",
              },
            },
            required: ["type", "caliber", "powerReserve", "frequencyVph", "features"],
          },
          renderingConfig: {
            type: Type.OBJECT,
            properties: {
              caseShape: {
                type: Type.STRING,
                enum: ["round", "cushion", "square", "tonneau", "octagonal", "tank"],
              },
              caseFinish: {
                type: Type.STRING,
                enum: ["steel", "yellow_gold", "rose_gold", "white_gold", "platinum", "titanium", "bronze", "black_ceramic", "two_tone"],
                description: "Case metal finish. Use 'steel' for all stainless steel / silver models unless explicitly gold or titanium.",
              },
              caseBezelType: {
                type: Type.STRING,
                enum: ["smooth", "fluted", "diver_60", "tachymeter", "gmt_24", "diamond", "octagonal_screws", "stepped"],
              },
              bezelColor: { type: Type.STRING, description: "Hex color for bezel insert, e.g., #0f172a or #1e3a8a" },
              bezelAccentColor: { type: Type.STRING, description: "Secondary bezel color for bi-color bezels (Pepsi, Batman)" },
              dialColor: { type: Type.STRING, description: "Hex color of main dial background. Use #e2e8f0 for silver/rhodium/argenté dials, #f8fafc for white, #09090b for black, #1e3a8a for blue. Never use gold unless champagne dial." },
              dialPattern: {
                type: Type.STRING,
                enum: ["sunburst", "matte", "tapisserie", "snowflake", "guilloche", "enamel", "gradient", "carbon"],
              },
              markerType: {
                type: Type.STRING,
                enum: ["applied_batons", "applied_dots", "roman_numerals", "arabic_numerals", "diver_mixed", "breguet_numerals", "minimal_indices"],
              },
              markerColor: { type: Type.STRING, description: "Hex color for hour markers, e.g., #e2e8f0 (silver/steel) or #f59e0b (gold)" },
              handsType: {
                type: Type.STRING,
                enum: ["mercedes", "dauphine", "sword", "baton", "breguet", "cathedral", "alpha", "skeleton"],
              },
              handsColor: { type: Type.STRING, description: "Hex color for hands, e.g., #ffffff or #e2e8f0 (silver/steel), or #fbbf24 (gold)" },
              secondsHandColor: { type: Type.STRING, description: "Hex color for seconds hand, e.g., #ef4444 or #f8fafc or #1e3a8a" },
              lumeColor: {
                type: Type.STRING,
                enum: ["green", "ice_blue", "vintage_tritium", "none"],
              },
              dateWindow: { type: Type.BOOLEAN, description: "Whether dial has date window at 3 o'clock or 4:30 or 6" },
              cyclops: { type: Type.BOOLEAN, description: "Whether watch crystal has magnifying cyclops over date" },
              dayDate: { type: Type.BOOLEAN, description: "Whether watch displays day and date" },
              subdials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    position: { type: Type.STRING, enum: ["3", "6", "9", "12", "sub_seconds", "chronograph_tri"] },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["seconds", "chrono_min", "chrono_hour", "power_reserve", "gmt", "moonphase"] },
                  },
                  required: ["position", "label", "type"],
                },
              },
              strapType: {
                type: Type.STRING,
                enum: ["oyster_bracelet", "jubilee_bracelet", "president_bracelet", "leather_alligator", "leather_suede", "nato_fabric", "rubber_oysterflex", "integrated_steel"],
              },
              strapColor: { type: Type.STRING, description: "Hex color for strap/bracelet, e.g., #94a3b8 or #3e2723" },
              accentColor: { type: Type.STRING, description: "Accent color hex, e.g. for GMT hand or red text line" },
            },
            required: ["caseShape", "caseFinish", "caseBezelType", "dialColor", "dialPattern", "markerType", "handsType", "lumeColor", "strapType"],
          },
          facts: {
            type: Type.OBJECT,
            properties: {
              tagline: { type: Type.STRING, description: "Short punchy summary phrase, e.g., 'The Definitive Archetype of the Modern Dive Watch'" },
              storyBlurb: {
                type: Type.STRING,
                description: "A captivating, beautifully written 2-3 sentence narrative blurb explaining the true story behind this piece: why it was created, its design genesis, and what makes its history unforgettable.",
              },
              sourceCitation: { type: Type.STRING, description: "Authoritative citation from The Watch Revised, Chrono24, Mayors, Primer Magazine, Teddy Baldassarre, or eBay Vault" },
              keyHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 bullet point highlights",
              },
              historicalSignificance: { type: Type.STRING, description: "2-3 paragraphs detailing historical origin, lineage, and evolution" },
              movementEngineering: { type: Type.STRING, description: "Details on caliber architecture, balance wheel, escapement, and tolerances" },
              collectorLore: { type: Type.STRING, description: "Nicknames, auction milestones, famous movies/wearers, and quirks" },
              funFacts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4-5 fascinating trivia facts that watch enthusiasts love",
              },
              celebritiesAndIcons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Famous wearers throughout history (astronauts, actors, leaders)",
              },
            },
            required: ["tagline", "keyHighlights", "historicalSignificance", "movementEngineering", "collectorLore", "funFacts"],
          },
        },
        required: ["name", "brand", "reference", "category", "movement", "renderingConfig", "facts"],
      },
    };

    const response = await generateWithFallback(ai, prompt, config);
    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Gemini service unavailable after fallback attempts. Activating Horological Synthesis Engine:", error?.message || error);
    // Seamless fallback to our authoritative synthesis engine so the user is never blocked
    try {
      const synthesized = synthesizeWatchFromQuery(query, customNotes, sourceLens);
      return res.json(synthesized);
    } catch (synthErr) {
      console.error("Synthesizer error:", synthErr);
      return res.status(500).json({
        error: "The AI service is momentarily experiencing high demand. Please select a watch from the Curated Catalogs tab or try again in a few moments.",
      });
    }
  }
});

// Q&A endpoint for asking the Watchmaker questions about a specific watch
app.post("/api/watches/ask", async (req, res) => {
  const { watchName, brand, reference, question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      answer: `Regarding the ${brand || "luxury"} ${watchName || "timepiece"} (Ref: ${reference || "N/A"}): This piece exemplifies superlative watchmaking engineering. When maintaining mechanical watches of this tier, we recommend a complete movement overhaul every 5 to 7 years along with annual water resistance pressure testing.`,
    });
  }

  try {
    const prompt = `You are a master watchmaker, horological conservator, and luxury watch curator.
The user is inspecting the watch: "${brand} ${watchName} (Ref: ${reference || 'N/A'})".
User's Question: "${question}"

Give an insightful, highly knowledgeable, and polite answer (2-4 concise paragraphs) touching on horological nuance, servicing tips, historical context, or collector perspective as appropriate.`;

    const config = {
      systemInstruction: "You are an elite master watchmaker and horologist. Provide warm, knowledgeable, professional advice without sales fluff.",
    };

    const response = await generateWithFallback(ai, prompt, config);
    return res.json({ answer: response.text });
  } catch (error: any) {
    console.warn("Watchmaker Q&A fallback triggered due to capacity spike:", error?.message || error);
    return res.json({
      answer: `Regarding the ${brand || "luxury"} ${watchName || "timepiece"} (Ref: ${reference || "N/A"}): While our live AI master watchmaker link is under temporary peak load, this reference is widely celebrated for its robust movement architecture, refined case ergonomics, and horological heritage. We advise regular amplitude checks and keeping it away from strong magnetic fields exceeding 1,000 Gauss unless shielded.`,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Virtual Watch Gallery server running on http://localhost:${PORT}`);
  });
}

startServer();
