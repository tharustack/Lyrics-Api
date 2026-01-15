const { multiSourceSearch } = require('./utils/scraper');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      error: 'Missing query parameter "q"',
      example: '/api/search?q=song name'
    });
  }

  try {
    const results = await multiSourceSearch(q);

    // Combine results
    const allResults = [];
    if (results.genius) {
      allResults.push(...results.genius.map(r => ({ ...r, source: 'genius' })));
    }
    if (results.sinhala) {
      allResults.push(...results.sinhala);
    }

    if (allResults.length === 0) {
      return res.status(404).json({
        error: 'No songs found',
        query: q
      });
    }

    res.status(200).json({
      query: q,
      count: allResults.length,
      sources: {
        genius: results.genius ? results.genius.length : 0,
        sinhala: results.sinhala ? results.sinhala.length : 0
      },
      results: allResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
