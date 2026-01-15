const { searchGenius } = require('../utils/scraper');

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
      example: '/api/genius/search?q=song name'
    });
  }

  try {
    const results = await searchGenius(q);

    if (!results) {
      return res.status(404).json({
        error: 'No songs found on Genius',
        query: q
      });
    }

    res.status(200).json({
      source: 'genius',
      query: q,
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Genius search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
