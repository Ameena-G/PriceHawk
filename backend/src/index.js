import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.js';
import exportRoutes from './routes/export.js';
import historyRoutes from './routes/history.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check for Cloud Run
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'pricehawk-api' }));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/history', historyRoutes);

app.listen(PORT, () => {
  console.log(`🦅 PriceHawk API running on port ${PORT}`);
});

export default app;