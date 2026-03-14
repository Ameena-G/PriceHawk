import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (uses Application Default Credentials on GCP)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GCP_PROJECT_ID,
  });
}

const db = admin.firestore();

/**
 * Save a search result to Firestore
 */
export async function saveSearchResult(jobId, query, products, analysis) {
  const docRef = db.collection('searches').doc(jobId);
  await docRef.set({
    jobId,
    query,
    products,
    analysis,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    productCount: products.length,
  });
  return jobId;
}

/**
 * Record price history for a product
 * Uses query + source as a composite key
 */
export async function recordPriceHistory(query, products) {
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();

  for (const product of products) {
    if (!product.price || !product.source) continue;

    const key = `${query.toLowerCase().replace(/\s+/g, '_')}_${product.source.toLowerCase()}`;
    const histRef = db.collection('price_history').doc(key).collection('points').doc();

    batch.set(histRef, {
      query,
      price: product.price,
      currency: product.currency || 'USD',
      source: product.source,
      title: product.title,
      timestamp: now,
    });
  }

  await batch.commit();
}

/**
 * Get price history for a query across all sources
 */
export async function getPriceHistory(query, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const key = query.toLowerCase().replace(/\s+/g, '_');
  const sources = ['Amazon', 'Flipkart', 'eBay', 'Walmart', 'Best Buy'];
  const history = {};

  await Promise.all(
    sources.map(async (source) => {
      const docKey = `${key}_${source.toLowerCase()}`;
      try {
        const snapshot = await db
          .collection('price_history')
          .doc(docKey)
          .collection('points')
          .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(since))
          .orderBy('timestamp', 'asc')
          .get();

        if (!snapshot.empty) {
          history[source] = snapshot.docs.map((d) => ({
            price: d.data().price,
            date: d.data().timestamp.toDate().toISOString(),
          }));
        }
      } catch {
        // No history for this source yet
      }
    })
  );

  return history;
}

/**
 * Get a cached search result
 */
export async function getCachedSearch(jobId) {
  const doc = await db.collection('searches').doc(jobId).get();
  return doc.exists ? doc.data() : null;
}