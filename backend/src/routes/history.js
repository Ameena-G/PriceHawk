import express from 'express';
import { getPriceHistory } from '../services/firestore.js';

const router = express.Router();

/**
 * GET /api/history?query=...&days=30
 */
router.get('/', async (req, res) => {
  const { query, days = 30 } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param required' });

  try {
    const history = await getPriceHistory(query, parseInt(days));
    res.json({ query, history });
  } catch (err) {
    res.json({ query, history: {} }); // return empty history locally
  }
});

export default router;