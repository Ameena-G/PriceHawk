import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Relevance filter — skip products unrelated to query ──────────────────────
function isRelevant(title, query) {
  if (!title || !query) return false;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const titleLower = title.toLowerCase();
  // At least 1 meaningful query word must appear in title
  return queryWords.some(w => titleLower.includes(w));
}

// ── Amazon India ──────────────────────────────────────────────────────────────
async function scrapeAmazon(browser, query, screenshotDir) {
  console.log('\n🌐 Amazon India...');
  let ctx, page;
  try {
    ctx = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1366, height: 768 }, locale: 'en-IN' });
    await ctx.route('**/*.{woff,woff2,ttf,mp4,gif}', r => r.abort());
    page = await ctx.newPage();

    await page.goto(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2500);
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(800);
    await page.screenshot({ path: path.join(screenshotDir, 'amazon.jpg'), type: 'jpeg', quality: 80 });

    const products = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('[data-component-type="s-search-result"]').forEach(item => {
        // Pick longest span inside h2 = full product title
        const h2 = item.querySelector('h2');
        let title = null;
        if (h2) {
          const spans = [...h2.querySelectorAll('span')];
          title = spans.reduce((best, el) => {
            const t = el.textContent?.trim();
            return (t && t.length > (best?.length || 0)) ? t : best;
          }, '');
        }
        if (!title || title.length < 8) return;

        const offscreen = item.querySelector('.a-price .a-offscreen');
        if (!offscreen) return;
        const priceNum = parseFloat(offscreen.textContent.replace(/[^0-9.]/g, ''));
        if (!priceNum || priceNum < 100) return;

        const ratingText = item.querySelector('.a-icon-alt')?.textContent?.trim();
        const rating = parseFloat(ratingText?.match(/^([\d.]+)/)?.[1]) || null;
        const reviewText = item.querySelector('.a-size-base.s-underline-text')?.textContent?.replace(/[^0-9]/g, '');

        results.push({
          title, price: priceNum, currency: 'INR',
          rating: isNaN(rating) ? null : rating,
          reviewCount: reviewText ? parseInt(reviewText) : null,
          availability: 'in stock', source: 'Amazon',
        });
      });
      return results.slice(0, 12);
    });

    // Apply relevance filter
    const filtered = products.filter(p => isRelevant(p.title, query));
    console.log(`   ✅ Amazon: ${filtered.length}/${products.length} relevant products`);
    filtered.slice(0, 3).forEach(p => console.log(`      • "${p.title.slice(0,55)}" ₹${p.price}`));
    await ctx.close();
    return filtered;
  } catch (err) {
    console.error('   ❌ Amazon:', err.message);
    if (ctx) await ctx.close().catch(() => {});
    return [];
  }
}

// ── Flipkart ──────────────────────────────────────────────────────────────────
async function scrapeFlipkart(browser, query, screenshotDir) {
  console.log('\n🌐 Flipkart...');
  let ctx, page;
  try {
    ctx = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1366, height: 768 }, locale: 'en-IN' });
    await ctx.route('**/*.{woff,woff2,ttf,mp4,gif}', r => r.abort());
    page = await ctx.newPage();

    await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}&sort=relevance`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    // Dismiss login popup
    await page.keyboard.press('Escape').catch(() => {});
    await delay(3000);
    await page.evaluate(() => window.scrollBy(0, 400));
    await delay(800);
    await page.screenshot({ path: path.join(screenshotDir, 'flipkart.jpg'), type: 'jpeg', quality: 80 });

    const products = await page.evaluate(() => {
      const results = [];

      // Layout A: Grid view (phones, electronics)
      document.querySelectorAll('div[data-id]').forEach(item => {
        const title =
          item.querySelector('._4rR01T')?.textContent?.trim() ||
          item.querySelector('.s1Q9rs')?.textContent?.trim() ||
          item.querySelector('.KzDlHZ')?.textContent?.trim() ||
          item.querySelector('.WKTcLC')?.textContent?.trim() ||
          item.querySelector('a[title]')?.getAttribute('title')?.trim();

        const priceEl =
          item.querySelector('._30jeq3') ||
          item.querySelector('.Nx9bqj') ||
          item.querySelector('._1_WHN1');

        if (!title || !priceEl) return;
        const priceNum = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        if (!priceNum || priceNum < 100) return;

        const ratingEl = item.querySelector('._3LWZlK') || item.querySelector('.XQDdHH');
        const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : null;
        const reviewEl = item.querySelector('._2_R_DZ span') || item.querySelector('._13vcmD span');
        const reviewCount = reviewEl ? parseInt(reviewEl.textContent.replace(/[^0-9]/g, '')) : null;

        results.push({
          title, price: priceNum, currency: 'INR',
          rating: isNaN(rating) ? null : rating,
          reviewCount, availability: 'in stock', source: 'Flipkart',
        });
      });

      // Layout B: List view fallback
      if (results.length === 0) {
        document.querySelectorAll('._1xHGtK, ._3pLy-c').forEach(item => {
          const title = item.querySelector('._2mylT6, .IRpwTa, ._4rR01T')?.textContent?.trim();
          const priceEl = item.querySelector('._30jeq3, .Nx9bqj');
          if (!title || !priceEl) return;
          const priceNum = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
          if (!priceNum || priceNum < 100) return;
          results.push({ title, price: priceNum, currency: 'INR', rating: null, reviewCount: null, availability: 'in stock', source: 'Flipkart' });
        });
      }

      // Deduplicate
      const seen = new Set();
      return results.filter(p => {
        if (seen.has(p.title)) return false;
        seen.add(p.title);
        return true;
      }).slice(0, 12);
    });

    const filtered = products.filter(p => isRelevant(p.title, query));
    console.log(`   ✅ Flipkart: ${filtered.length}/${products.length} relevant products`);
    filtered.slice(0, 3).forEach(p => console.log(`      • "${p.title.slice(0,55)}" ₹${p.price}`));
    await ctx.close();
    return filtered;
  } catch (err) {
    console.error('   ❌ Flipkart:', err.message);
    if (ctx) await ctx.close().catch(() => {});
    return [];
  }
}

// ── Croma ─────────────────────────────────────────────────────────────────────
async function scrapeCroma(browser, query, screenshotDir) {
  console.log('\n🌐 Croma...');
  let ctx, page;
  try {
    ctx = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1366, height: 768 }, locale: 'en-IN' });
    await ctx.route('**/*.{woff,woff2,ttf,mp4,gif}', r => r.abort());
    page = await ctx.newPage();

    await page.goto(`https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await delay(3000);
    await page.evaluate(() => window.scrollBy(0, 400));
    await delay(600);
    await page.screenshot({ path: path.join(screenshotDir, 'croma.jpg'), type: 'jpeg', quality: 80 });

    const products = await page.evaluate(() => {
      const results = [];
      // Croma uses li.product-item
      document.querySelectorAll('li.product-item, .product-item').forEach(item => {
        const title =
          item.querySelector('h3.product-title')?.textContent?.trim() ||
          item.querySelector('.product-title')?.textContent?.trim() ||
          item.querySelector('a.product-title')?.textContent?.trim();

        const priceEl =
          item.querySelector('.amount') ||
          item.querySelector('.new-price') ||
          item.querySelector('[class*="price"]');

        if (!title || !priceEl) return;
        const priceNum = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        if (!priceNum || priceNum < 100) return;

        const ratingEl = item.querySelector('.review-score-box');
        const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : null;

        results.push({
          title, price: priceNum, currency: 'INR',
          rating: isNaN(rating) ? null : rating,
          reviewCount: null, availability: 'in stock', source: 'Croma',
        });
      });
      return results.slice(0, 10);
    });

    const filtered = products.filter(p => isRelevant(p.title, query));
    console.log(`   ✅ Croma: ${filtered.length}/${products.length} relevant products`);
    await ctx.close();
    return filtered;
  } catch (err) {
    console.error('   ❌ Croma:', err.message);
    if (ctx) await ctx.close().catch(() => {});
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function runShoppingAgent(query, jobId) {
  const screenshotDir = path.join(os.tmpdir(), `pricehawk_${jobId}`);
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log(`\n📁 Screenshots: ${screenshotDir}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  });

  let allProducts = [];

  try {
    const [amazonR, flipkartR, cromaR] = await Promise.allSettled([
      scrapeAmazon(browser, query, screenshotDir),
      scrapeFlipkart(browser, query, screenshotDir),
      scrapeCroma(browser, query, screenshotDir),
    ]);

    if (amazonR.status === 'fulfilled')   allProducts.push(...amazonR.value);
    if (flipkartR.status === 'fulfilled') allProducts.push(...flipkartR.value);
    if (cromaR.status === 'fulfilled')    allProducts.push(...cromaR.value);

    // Final dedup across all stores
    const seen = new Set();
    allProducts = allProducts.filter(p => {
      const key = `${p.title?.slice(0, 35).toLowerCase()}_${p.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`\n✅ TOTAL: ${allProducts.length} products from [${[...new Set(allProducts.map(p => p.source))].join(', ')}]`);
  } finally {
    await browser.close();
  }

  return {
    products: allProducts,
    screenshots: fs.readdirSync(screenshotDir).filter(f => f.endsWith('.jpg')).map(f => path.join(screenshotDir, f)),
    errors: allProducts.length === 0 ? [{ error: 'No products found' }] : [],
  };
}