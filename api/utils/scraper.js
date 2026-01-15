const axios = require('axios');
const cheerio = require('cheerio');

// Search for songs on Genius
async function searchGenius(songName) {
  try {
    const searchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(songName)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const sections = response.data.response.sections;
    const songsSection = sections.find(s => s.type === 'song');
    
    if (!songsSection || !songsSection.hits.length) {
      return null;
    }

    return songsSection.hits.map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url,
      thumbnail: hit.result.song_art_image_thumbnail_url,
      language: hit.result.language || 'en'
    }));
  } catch (error) {
    console.error('Genius search error:', error.message);
    return null;
  }
}

// Scrape lyrics from Genius URL
async function scrapeGeniusLyrics(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let lyrics = '';
    $('div[data-lyrics-container="true"]').each((i, elem) => {
      lyrics += $(elem).text() + '\n\n';
    });

    lyrics = lyrics.trim();
    
    return lyrics || null;
  } catch (error) {
    console.error('Genius scraping error:', error.message);
    return null;
  }
}

// Search Sinhala lyrics sites
async function searchSinhalaLyrics(songName) {
  try {
    // Try sinhalasongbook.com
    const searchUrl = `https://www.sinhalasongbook.com/?s=${encodeURIComponent(songName)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Parse search results
    $('article.post').each((i, elem) => {
      if (i < 5) { // Limit to top 5 results
        const title = $(elem).find('h2.entry-title a').text().trim();
        const url = $(elem).find('h2.entry-title a').attr('href');
        
        if (title && url) {
          results.push({
            title: title,
            url: url,
            source: 'sinhalasongbook'
          });
        }
      }
    });

    return results.length > 0 ? results : null;
  } catch (error) {
    console.error('Sinhala search error:', error.message);
    return null;
  }
}

// Scrape Sinhala lyrics
async function scrapeSinhalaLyrics(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Try different selectors for different sites
    let lyrics = '';
    
    // For sinhalasongbook.com
    const lyricsDiv = $('.entry-content');
    if (lyricsDiv.length > 0) {
      // Remove unwanted elements
      lyricsDiv.find('script, style, .sharedaddy, .jp-relatedposts').remove();
      lyrics = lyricsDiv.text().trim();
    }

    return lyrics || null;
  } catch (error) {
    console.error('Sinhala scraping error:', error.message);
    return null;
  }
}

// Multi-source search (Genius + Sinhala sites)
async function multiSourceSearch(songName) {
  const results = {
    genius: null,
    sinhala: null
  };

  // Search both sources in parallel
  const [geniusResults, sinhalaResults] = await Promise.all([
    searchGenius(songName),
    searchSinhalaLyrics(songName)
  ]);

  if (geniusResults) results.genius = geniusResults;
  if (sinhalaResults) results.sinhala = sinhalaResults;

  return results;
}

// Get lyrics from best available source
async function getLyrics(songName) {
  // Try Genius first
  const geniusResults = await searchGenius(songName);
  if (geniusResults && geniusResults.length > 0) {
    const lyrics = await scrapeGeniusLyrics(geniusResults[0].url);
    if (lyrics) {
      return {
        source: 'genius',
        ...geniusResults[0],
        lyrics: lyrics
      };
    }
  }

  // Fallback to Sinhala sites
  const sinhalaResults = await searchSinhalaLyrics(songName);
  if (sinhalaResults && sinhalaResults.length > 0) {
    const lyrics = await scrapeSinhalaLyrics(sinhalaResults[0].url);
    if (lyrics) {
      return {
        source: 'sinhalasongbook',
        title: sinhalaResults[0].title,
        url: sinhalaResults[0].url,
        lyrics: lyrics
      };
    }
  }

  return null;
}

module.exports = {
  searchGenius,
  scrapeGeniusLyrics,
  searchSinhalaLyrics,
  scrapeSinhalaLyrics,
  multiSourceSearch,
  getLyrics
};
