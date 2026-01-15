const { getLyrics } = require('./utils/scraper');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { song } = req.query;

  if (!song) {
    return res.status(400).json({
      error: 'Missing query parameter "song"',
      example: '/api/lyrics?song=song name'
    });
  }

  try {
    const result = await getLyrics(song);

    if (!result) {
      return res.status(404).json({
        error: 'Lyrics not found',
        query: song,
        suggestion: 'Try searching first with /api/search?q=song name'
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
