import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import crypto from 'crypto';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── In-memory cache (survives the session) ───────────────────────────────────
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCacheKey(filePath, site) {
  // Hash file contents so same screenshot = same key
  const buf = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 12);
  return `${site}_${hash}`;
}

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  console.log(`   ✅ Cache hit for ${key}`);
  return entry.data;
}

function toCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Retry with exponential backoff ───────────────────────────────────────────
async function callGeminiWithRetry(payload, maxRetries = 3) {
  // Try gemini-2.0-flash first, fall back to gemini-1.5-flash (separate quota)
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await genai.models.generateContent({ model, ...payload });
        console.log(`   ✅ Gemini responded (${model}, attempt ${attempt})`);
        return response;
      } catch (err) {
        const msg = err.message || '';
        const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        const retryMatch = msg.match(/retry in (\d+(\.\d+)?)s/i);
        const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) * 1000 : attempt * 12000;

        if (is429) {
          if (attempt < maxRetries) {
            console.log(`   ⏳ Rate limited on ${model}. Waiting ${Math.round(retryAfter/1000)}s (attempt ${attempt}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, retryAfter));
          } else {
            console.log(`   ⚠️  ${model} quota exhausted, trying next model...`);
            break; // try next model
          }
        } else {
          throw err; // non-quota error, don't retry
        }
      }
    }
  }

  throw new Error('All Gemini models quota exhausted. Please wait or add billing.');
}

// ── Prompts ───────────────────────────────────────────────────────────────────
const EXTRACT_PROMPT = `You are a shopping data extraction AI looking at a screenshot of a product search results page.

Extract ALL visible product listings and return a JSON array. For each product extract:
- title: product name (string)
- price: price as a number only (no currency symbols)
- currency: currency code (USD, INR, GBP, etc.)
- rating: rating out of 5 as a float (null if not visible)
- reviewCount: number of reviews (null if not visible)
- seller: seller name (string)
- availability: "in stock", "out of stock", or "unknown"
- nextAction: "scroll_down", "click_next_page", or "done"

Return ONLY valid JSON, no markdown, no explanation:
{
  "products": [...],
  "nextAction": "done",
  "pageContext": "brief description of what page this is"
}`;

// ── Exported functions ────────────────────────────────────────────────────────
export async function extractProductsFromScreenshot(screenshotPath, site) {
  const cacheKey = getCacheKey(screenshotPath, site);
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const imageData = fs.readFileSync(screenshotPath);
  const base64Image = imageData.toString('base64');

  try {
    const response = await callGeminiWithRetry({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `${EXTRACT_PROMPT}\n\nThis screenshot is from: ${site}` },
        ],
      }],
    });

    const text = response.candidates[0].content.parts[0].text;
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    toCache(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error(`   ❌ Gemini extraction failed for ${site}:`, err.message);
    return { products: [], nextAction: 'done', pageContext: 'error' };
  }
}

const COMPARE_PROMPT = (products, query) => `You are a shopping expert. A user searched for: "${query}"

Products found across multiple shopping sites:
${JSON.stringify(products.slice(0, 20), null, 2)}

Return ONLY this JSON (no markdown):
{
  "bestDeal": { ...product, "reason": "why" },
  "bestRated": { ...product, "reason": "why" },
  "summary": "2-3 sentence summary",
  "priceRange": { "min": number, "max": number, "average": number },
  "recommendation": "1-2 sentence recommendation",
  "insights": ["insight1", "insight2", "insight3"]
}`;

export async function compareAndRankProducts(products, query) {
  const cacheKey = `compare_${query.toLowerCase().replace(/\s+/g, '_')}_${products.length}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await callGeminiWithRetry({
      contents: [{
        role: 'user',
        parts: [{ text: COMPARE_PROMPT(products, query) }],
      }],
    });

    const text = response.candidates[0].content.parts[0].text;
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    toCache(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error('Gemini compare failed:', err.message);
    const sorted = [...products].sort((a, b) => (a.price || 99999) - (b.price || 99999));
    return {
      bestDeal: sorted[0] || null,
      bestRated: [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null,
      summary: `Found ${products.length} products across ${new Set(products.map(p => p.source)).size} stores.`,
      priceRange: {
        min: Math.min(...products.map(p => p.price || 0).filter(Boolean)),
        max: Math.max(...products.map(p => p.price || 0).filter(Boolean)),
        average: products.reduce((s, p) => s + (p.price || 0), 0) / products.length,
      },
      recommendation: 'Review results above to find the best option for your needs.',
      insights: [],
    };
  }
}