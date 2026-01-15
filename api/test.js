const scraper = require('../lib/scraper');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Test with a known working URL
  const testUrl = 'https://genius.com/Kendrick-lamar-not-like-us-lyrics';
  
  try {
    console.log('Testing scraper with URL:', testUrl);
    
    const startTime = Date.now();
    const lyrics = await scraper.scrapeLyrics(testUrl);
    const endTime = Date.now();
    
    const result = {
      success: !!lyrics,
      testUrl,
      timeTaken: `${endTime - startTime}ms`,
      hasLyrics: !!lyrics,
      lyricsLength: lyrics ? lyrics.length : 0,
      sample: lyrics ? lyrics.substring(0, 200) + '...' : null,
      headersInfo: 'Using rotating User-Agents and delays to avoid blocking',
      note: lyrics ? 'Scraping successful!' : 'Scraping failed - Genius may be blocking'
    };
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestion: 'Check if the URL is accessible from your location'
    });
  }
};
