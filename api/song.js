const genius = require('../lib/genius');
const scraper = require('../lib/scraper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  const { id, url } = req.query;

  if (!id && !url) {
    return res.status(400).json({ 
      success: false,
      error: 'Either "id" or "url" parameter is required' 
    });
  }

  try {
    let songData = null;
    let songUrl = url;
    let songId = id;

    // If URL is provided, try to extract ID from it
    if (url && !id) {
      songId = genius.extractSongIdFromUrl(url);
    }
    
    // If ID is provided but no URL, construct the URL
    if (id && !url) {
      // We'll get the URL from the API response or use a default pattern
      songUrl = null;
    }

    // Try to get data from Genius API (optional - works even without token)
    try {
      if (songId) {
        const apiResponse = await genius.getSong(songId);
        songData = apiResponse.response?.song;
        
        if (songData && !songUrl) {
          songUrl = songData.url;
        }
      }
    } catch (apiError) {
      console.log('Genius API call failed, continuing with scraping only:', apiError.message);
    }

    // Always scrape the page for lyrics
    let scrapedData = null;
    let scrapeError = null;
    
    if (songUrl) {
      try {
        scrapedData = await scraper.scrapeSongDetails(songUrl);
      } catch (scrapeError) {
        console.error('Scraping failed:', scrapeError.message);
        // Continue with API data only
      }
    }

    // If scraping failed but we have API data, try direct lyrics scraping
    if ((!scrapedData || !scrapedData.lyrics) && songUrl) {
      try {
        const lyrics = await scraper.scrapeLyrics(songUrl);
        if (lyrics) {
          scrapedData = scrapedData || {};
          scrapedData.lyrics = lyrics;
        }
      } catch (lyricsError) {
        console.error('Direct lyrics scraping also failed:', lyricsError.message);
      }
    }

    // Build the response
    const result = {
      success: true,
      data: {
        id: songId || genius.extractSongIdFromUrl(songUrl),
        title: scrapedData?.title || songData?.title || 'Unknown Title',
        artist: scrapedData?.artist || songData?.primary_artist?.name || songData?.artist_names || 'Unknown Artist',
        url: songUrl || `https://genius.com/songs/${songId}`,
        image: scrapedData?.image || songData?.header_image_url,
        thumbnail: songData?.header_image_thumbnail_url,
        releaseDate: scrapedData?.releaseDate || songData?.release_date_for_display,
        lyrics: scrapedData?.lyrics || null,
        apiData: songData ? {
          annotationCount: songData.annotation_count,
          pyongsCount: songData.pyongs_count,
          lyricsState: songData.lyrics_state,
          artistId: songData.primary_artist?.id,
          apiPath: songData.api_path
        } : null,
        note: !scrapedData?.lyrics ? 'Lyrics could not be extracted. Genius may be blocking requests.' : null
      }
    };

    // If no lyrics were found, still return success but with a note
    if (!result.data.lyrics) {
      result.success = false;
      result.error = 'Could not extract lyrics from the page';
      result.data.lyrics = 'Lyrics extraction failed. This could be due to:\n1. Genius blocking automated requests\n2. Page structure changed\n3. Rate limiting\n\nTry visiting the URL directly: ' + result.data.url;
    }

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Song API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      suggestion: 'Try using the direct URL parameter instead of ID'
    });
  }
};
