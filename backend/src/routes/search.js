import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runShoppingAgent } from '../services/browser.js';
import { compareAndRankProducts } from '../services/gemini.js';

const router = express.Router();

// In-memory job store
const jobs = new Map();

router.post('/', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }
  const jobId = uuidv4();
  jobs.set(jobId, { status: 'running', progress: 5, query: query.trim(), startedAt: Date.now() });
  res.json({ jobId, status: 'running' });
  runJob(jobId, query.trim()).catch(console.error);
});

router.get('/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ── Build a basic analysis without Gemini ────────────────────────────────────
function buildFallbackAnalysis(products, query) {
  if (!products.length) return { summary: 'No products found.', insights: [] };

  const withPrices = products.filter(p => p.price > 0);
  const sorted = [...withPrices].sort((a, b) => a.price - b.price);
  const sortedByRating = [...products].filter(p => p.rating).sort((a, b) => b.rating - a.rating);

  const bestDeal = sorted[0] || products[0];
  const bestRated = sortedByRating[0] || products[0];
  const prices = withPrices.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;

  const stores = [...new Set(products.map(p => p.source))];
  const savings = max - min;

  return {
    bestDeal: { ...bestDeal, reason: 'Lowest price found' },
    bestRated: bestRated ? { ...bestRated, reason: 'Highest customer rating' } : null,
    summary: `Found ${products.length} results for "${query}" across ${stores.length} store${stores.length > 1 ? 's' : ''}. Prices range from $${min.toFixed(2)} to $${max.toFixed(2)}.`,
    priceRange: { min, max, average: parseFloat(average.toFixed(2)) },
    recommendation: savings > 10
      ? `You could save up to $${savings.toFixed(2)} by choosing the cheapest option over the most expensive.`
      : 'Prices are fairly consistent across stores.',
    insights: [
      `${products.length} listings found`,
      `${stores.join(', ')}`,
      savings > 0 ? `$${savings.toFixed(2)} price spread` : 'Consistent pricing',
    ],
    geminiUsed: false,
  };
}

async function runJob(jobId, query) {
  const update = (patch) => jobs.set(jobId, { ...jobs.get(jobId), ...patch });

  try {
    update({ status: 'browsing', progress: 15, message: 'Opening shopping sites...' });

    const { products, errors } = await runShoppingAgent(query, jobId);

    update({ status: 'analyzing', progress: 75, message: `Found ${products.length} products. Analyzing...` });

    // Deduplicate
    const seen = new Set();
    const unique = products.filter(p => {
      const key = `${p.title?.toLowerCase().slice(0, 40)}_${p.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Try Gemini, fall back gracefully
    let analysis;
    if (unique.length > 0) {
      try {
        analysis = await compareAndRankProducts(unique, query);
        analysis.geminiUsed = true;
        console.log('✅ Gemini analysis complete');
      } catch (err) {
        console.warn('⚠️  Gemini unavailable, using fallback analysis:', err.message);
        analysis = buildFallbackAnalysis(unique, query);
      }
    } else {
      analysis = { summary: 'No products found. Try a different search term.', insights: [] };
    }

    // Try Firestore (optional)
    try {
      const { saveSearchResult, recordPriceHistory } = await import('../services/firestore.js');
      await saveSearchResult(jobId, query, unique, analysis);
      await recordPriceHistory(query, unique);
    } catch {
      // Firestore not configured locally — that's fine
    }

    update({
      status: 'done',
      progress: 100,
      message: 'Complete',
      products: unique,
      analysis,
      errors,
      completedAt: Date.now(),
    });

  } catch (err) {
    console.error('Job failed:', err);
    update({ status: 'error', error: err.message });
  }
}

export default router;