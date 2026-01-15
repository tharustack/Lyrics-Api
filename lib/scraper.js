const axios = require('axios');
const cheerio = require('cheerio');

class GeniusScraper {
  constructor() {
    this.client = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  async scrapeLyrics(url) {
    try {
      const response = await this.client.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Extract lyrics from the page (based on the provided HTML structure)
      const lyricsContainer = $('[data-lyrics-container="true"]') || $('.lyrics');
      
      if (!lyricsContainer.length) {
        // Try alternative selectors
        const lyricsHtml = this.extractLyricsFromScript($);
        if (lyricsHtml) {
          return this.cleanLyrics(lyricsHtml);
        }
        return null;
      }

      const lyricsHtml = lyricsContainer.html();
      return this.cleanLyrics(lyricsHtml);
    } catch (error) {
      console.error('Scraping error:', error.message);
      throw error;
    }
  }

  extractLyricsFromScript($) {
    // Look for lyrics data in script tags
    const scripts = $('script');
    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html();
      if (scriptContent && scriptContent.includes('"body":{"html"')) {
        try {
          const jsonMatch = scriptContent.match(/"body":\s*{\s*"html":\s*"([^"]+)"/);
          if (jsonMatch) {
            const escapedHtml = jsonMatch[1];
            const html = escapedHtml.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            return html;
          }
        } catch (e) {
          console.error('Failed to parse script content:', e.message);
        }
      }
    }
    return null;
  }

  cleanLyrics(html) {
    if (!html) return '';

    const $ = cheerio.load(html);
    
    // Remove annotations/links but keep text
    $('a').each((i, elem) => {
      const text = $(elem).text();
      $(elem).replaceWith(text);
    });

    // Remove other unwanted elements
    $('br').replaceWith('\n');
    $('p').each((i, elem) => {
      const text = $(elem).text();
      $(elem).replaceWith(text + '\n\n');
    });

    let text = $.text();
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.trim();

    return text;
  }

  async scrapeSongDetails(url) {
    try {
      const response = await this.client.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Extract metadata
      const title = $('h1[class*="SongHeader__Title"]').text().trim() || 
                    $('h1').first().text().trim();
      
      const artist = $('a[href*="/artists/"]').first().text().trim() ||
                     $('[class*="SongHeader__Artist"]').text().trim();

      // Extract album/cover art
      const image = $('img[class*="SongHeader__CoverArt"]').attr('src') ||
                    $('img[alt*="cover"]').attr('src') ||
                    $('meta[property="og:image"]').attr('content');

      // Extract release date
      const releaseInfo = $('[class*="ReleaseDateLabel"]').text().trim() ||
                          $('span:contains("Released")').text().trim();

      // Get lyrics
      const lyrics = await this.scrapeLyrics(url);

      return {
        title,
        artist,
        image,
        releaseInfo,
        lyrics,
        url
      };
    } catch (error) {
      console.error('Scraping song details error:', error.message);
      throw error;
    }
  }
}

module.exports = new GeniusScraper();
