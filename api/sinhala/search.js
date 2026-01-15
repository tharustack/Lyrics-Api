const { searchSinhalaLyrics } = require('../utils/scraper');

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
      example: '/api/sinhala/search?q=song name'
    });
  }

  try {
    const results = await searchSinhalaLyrics(q);

    if (!results) {
      return res.status(404).json({
        error: 'No songs found on Sinhala lyrics sites',
        query: q
      });
    }

    res.status(200).json({
      source: 'sinhala',
      query: q,
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Sinhala search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
