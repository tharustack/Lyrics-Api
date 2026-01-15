const scraper = require('../lib/scraper');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Validate URL
  if (!url.includes('genius.com')) {
    return res.status(400).json({ error: 'Invalid Genius URL' });
  }

  try {
    const lyrics = await scraper.scrapeLyrics(url);

    if (!lyrics) {
      return res.status(404).json({
        success: false,
        error: 'Lyrics not found'
      });
    }

    res.status(200).json({
      success: true,
      url,
      lyrics,
      length: lyrics.length
    });
  } catch (error) {
    console.error('Lyrics API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lyrics',
      message: error.message
    });
  }
};
