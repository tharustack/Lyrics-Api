const genius = require('../lib/genius');
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

  const { id, url } = req.query;

  if (!id && !url) {
    return res.status(400).json({ 
      error: 'Either "id" or "url" parameter is required' 
    });
  }

  try {
    let songData;
    let songUrl;

    if (id) {
      // Get song info from Genius API
      const response = await genius.getSong(id);
      songData = response.response.song;
      songUrl = songData.url;
    } else if (url) {
      songUrl = url;
      // Extract ID from URL if possible
      const songId = genius.extractSongIdFromUrl(url);
      if (songId) {
        const response = await genius.getSong(songId);
        songData = response.response.song;
      }
    }

    // Scrape lyrics
    const scrapedData = await scraper.scrapeSongDetails(songUrl);

    // Combine API data with scraped lyrics
    const result = {
      success: true,
      data: {
        id: songData?.id || genius.extractSongIdFromUrl(songUrl),
        title: scrapedData.title || songData?.title,
        artist: scrapedData.artist || songData?.primary_artist?.name,
        url: songUrl,
        image: scrapedData.image || songData?.header_image_url,
        thumbnail: songData?.header_image_thumbnail_url,
        releaseDate: scrapedData.releaseInfo || songData?.release_date_for_display,
        lyrics: scrapedData.lyrics,
        apiData: songData ? {
          annotationCount: songData.annotation_count,
          pyongsCount: songData.pyongs_count,
          lyricsState: songData.lyrics_state,
          artistId: songData.primary_artist?.id,
          apiPath: songData.api_path
        } : null
      }
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Song API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get song details',
      message: error.message
    });
  }
};
