import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function buildEmailHTML(query, products, analysis) {
  const topProducts = products.slice(0, 10);

  const rows = topProducts.map((p) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.title?.slice(0, 60) || 'N/A'}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#16a34a">${p.currency || '$'} ${p.price || 'N/A'}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.rating ? `⭐ ${p.rating}` : 'N/A'}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.source}</td>
    </tr>
  `).join('');

  return `
  <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
    <div style="background:#0f172a;padding:24px;border-radius:12px 12px 0 0">
      <h1 style="color:#f59e0b;margin:0">🦅 PriceHawk Results</h1>
      <p style="color:#94a3b8;margin:8px 0 0">Search: <strong style="color:#e2e8f0">${query}</strong></p>
    </div>
    <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0">
      <h2 style="color:#1e293b">🏆 Best Deal</h2>
      <div style="background:#fff;padding:16px;border-radius:8px;border:2px solid #f59e0b">
        <strong>${analysis.bestDeal?.title || 'N/A'}</strong><br/>
        <span style="color:#16a34a;font-size:20px">${analysis.bestDeal?.currency || '$'} ${analysis.bestDeal?.price || 'N/A'}</span>
        from <strong>${analysis.bestDeal?.source || 'N/A'}</strong><br/>
        <em style="color:#64748b">${analysis.bestDeal?.reason || ''}</em>
      </div>
      <h2 style="color:#1e293b;margin-top:24px">📊 All Results</h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#0f172a">
            <th style="padding:10px;color:#e2e8f0;text-align:left">Product</th>
            <th style="padding:10px;color:#e2e8f0;text-align:left">Price</th>
            <th style="padding:10px;color:#e2e8f0;text-align:left">Rating</th>
            <th style="padding:10px;color:#e2e8f0;text-align:left">Store</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a">
        <strong>💡 Gemini Recommendation:</strong><br/>
        ${analysis.recommendation || analysis.summary || ''}
      </div>
    </div>
    <div style="background:#0f172a;padding:16px;border-radius:0 0 12px 12px;text-align:center">
      <p style="color:#64748b;font-size:12px;margin:0">Powered by PriceHawk · Gemini 2.0 Flash · Google Cloud</p>
    </div>
  </div>`;
}

/**
 * POST /api/export/email
 */
router.post('/email', async (req, res) => {
  const { email, query, products, analysis } = req.body;

  if (!email || !query) {
    return res.status(400).json({ error: 'Email and query are required' });
  }

  try {
    await transporter.sendMail({
      from: `"PriceHawk 🦅" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🦅 PriceHawk Results: ${query}`,
      html: buildEmailHTML(query, products || [], analysis || {}),
    });

    res.json({ success: true, message: `Results sent to ${email}` });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/export/csv
 */
router.post('/csv', (req, res) => {
  const { products, query } = req.body;
  if (!products?.length) return res.status(400).json({ error: 'No products to export' });

  const headers = ['Title', 'Price', 'Currency', 'Rating', 'Reviews', 'Source', 'Availability'];
  const rows = products.map((p) => [
    `"${(p.title || '').replace(/"/g, '""')}"`,
    p.price || '',
    p.currency || '',
    p.rating || '',
    p.reviewCount || '',
    p.source || '',
    p.availability || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="pricehawk_${query.replace(/\s+/g, '_')}.csv"`);
  res.send(csv);
});

export default router;