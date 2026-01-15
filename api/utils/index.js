module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    name: 'Multi-Language Lyrics API',
    version: '1.0.0',
    description: 'Scrapes lyrics from Genius and Sinhala lyrics sites',
    endpoints: {
      search: {
        method: 'GET',
        path: '/api/search?q=song_name',
        description: 'Search for songs across multiple sources',
        example: '/api/search?q=bohemian rhapsody',
        sources: ['Genius', 'SinhalaSongBook']
      },
      lyrics: {
        method: 'GET',
        path: '/api/lyrics?song=song_name',
        description: 'Get lyrics by song name (auto-selects best source)',
        example: '/api/lyrics?song=සඳ එළිය',
        note: 'Works with English, Sinhala, Korean, Japanese, etc.'
      },
      geniusSearch: {
        method: 'GET',
        path: '/api/genius/search?q=song_name',
        description: 'Search only on Genius',
        example: '/api/genius/search?q=gangnam style'
      },
      geniusLyrics: {
        method: 'GET',
        path: '/api/genius/lyrics?url=genius_url',
        description: 'Get lyrics from Genius URL',
        example: '/api/genius/lyrics?url=https://genius.com/Queen-bohemian-rhapsody-lyrics'
      },
      sinhalaSearch: {
        method: 'GET',
        path: '/api/sinhala/search?q=song_name',
        description: 'Search only on Sinhala lyrics sites',
        example: '/api/sinhala/search?q=සඳ එළිය'
      },
      sinhalaLyrics: {
        method: 'GET',
        path: '/api/sinhala/lyrics?url=sinhala_lyrics_url',
        description: 'Get lyrics from Sinhala lyrics URL',
        example: '/api/sinhala/lyrics?url=https://www.sinhalasongbook.com/...'
      }
    },
    features: [
      '✅ Multi-language support (English, Sinhala, Korean, Japanese, Hindi, Spanish, etc.)',
      '✅ Auto-fallback between sources',
      '✅ Fast serverless deployment',
      '✅ CORS enabled',
      '✅ No authentication required'
    ],
    notes: [
      'Please use responsibly',
      'Respect copyright and terms of service',
      'Rate limiting may apply from source sites'
    ],
    github: 'https://github.com/tharustack/lyrics-api',
    author: 'Tharusha Dilshan'
  });
};
