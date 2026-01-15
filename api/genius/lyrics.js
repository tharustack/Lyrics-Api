const { scrapeGeniusLyrics, searchGenius } = require('../utils/scraper');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, song } = req.query;

  if (!url && !song) {
    return res.status(400).json({
      error: 'Missing parameter: provide either "url" or "song"',
      examples: {
        byUrl: '/api/genius/lyrics?url=https://genius.com/...',
        bySearch: '/api/genius/lyrics?song=song name'
      }
    });
  }

  try {
    let lyricsUrl = url;
    let songInfo = null;

    // If searching by song name, get the URL first
    if (song && !url) {
      const searchResults = await searchGenius(song);
      if (!searchResults || searchResults.length === 0) {
        return res.status(404).json({
          error: 'Song not found on Genius',
          query: song
        });
      }
      lyricsUrl = searchResults[0].url;
      songInfo = searchResults[0];
    }

    const lyrics = await scrapeGeniusLyrics(lyricsUrl);

    if (!lyrics) {
      return res.status(404).json({
        error: 'Could not fetch lyrics from Genius',
        url: lyricsUrl
      });
    }

    res.status(200).json({
      source: 'genius',
      ...(songInfo && {
        title: songInfo.title,
        artist: songInfo.artist,
        thumbnail: songInfo.thumbnail,
        language: songInfo.language
      }),
      url: lyricsUrl,
      lyrics: lyrics
    });
  } catch (error) {
    console.error('Genius lyrics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
