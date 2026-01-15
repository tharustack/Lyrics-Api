const axios = require('axios');
const cheerio = require('cheerio');

class GeniusScraper {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://genius.com/',
      }
    });

    // Add response interceptor to handle redirects
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 403) {
          console.log('403 detected, trying with different headers...');
          // Try with different user agent
          error.config.headers['User-Agent'] = this.getRandomUserAgent();
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async scrapeLyrics(url) {
    try {
      console.log(`Scraping lyrics from: ${url}`);
      
      // Add delay to avoid rate limiting
      await this.delay(1000);
      
      const response = await this.client.get(url);
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = response.data;
      
      // Check if we got a CAPTCHA or blocked page
      if (html.includes('captcha') || html.includes('Access Denied') || html.includes('blocked')) {
        throw new Error('Access blocked by Genius (CAPTCHA or rate limit)');
      }
      
      const $ = cheerio.load(html);
      
      // Method 1: Try to get lyrics from structured data
      let lyrics = this.extractLyricsFromStructuredData($);
      
      if (!lyrics) {
        // Method 2: Try to extract from specific Genius selectors
        lyrics = this.extractLyricsFromGeniusSelectors($);
      }
      
      if (!lyrics) {
        // Method 3: Try to find lyrics in script tags
        lyrics = this.extractLyricsFromScriptTags($);
      }
      
      if (!lyrics) {
        throw new Error('Could not find lyrics on the page');
      }
      
      return this.cleanLyrics(lyrics);
      
    } catch (error) {
      console.error(`Scraping error for ${url}:`, error.message);
      
      // For 403 errors, try using a different approach
      if (error.message.includes('403') || error.message.includes('blocked')) {
        console.log('Trying alternative scraping method...');
        return await this.scrapeLyricsAlternative(url);
      }
      
      throw error;
    }
  }

  extractLyricsFromStructuredData($) {
    // Try multiple selectors that Genius uses
    const selectors = [
      '[data-lyrics-container="true"]',
      'div[class*="Lyrics__Container"]',
      'div[class*="lyrics"]',
      'div.lyrics',
      'section[class*="Lyrics__Root"]',
      '.song_body-lyrics',
      '#lyrics-root',
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        console.log(`Found lyrics with selector: ${selector}`);
        return element.html();
      }
    }
    
    return null;
  }

  extractLyricsFromGeniusSelectors($) {
    // Look for lyrics in common Genius structures
    const lyricsContainers = $('div').filter((i, el) => {
      const className = $(el).attr('class') || '';
      return className.includes('Lyrics') || 
             className.includes('lyrics') || 
             className.includes('Lyric');
    });
    
    if (lyricsContainers.length > 0) {
      return lyricsContainers.first().html();
    }
    
    return null;
  }

  extractLyricsFromScriptTags($) {
    // Look for lyrics in JavaScript data
    const scripts = $('script');
    
    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html();
      
      if (scriptContent) {
        // Look for JSON containing lyrics
        const jsonPatterns = [
          /"lyrics_data":\s*({.*?})/s,
          /"body":\s*{\s*"html":\s*"([^"]+)"/s,
          /"lyrics":\s*{\s*"body":\s*{\s*"html":\s*"([^"]+)"/s,
          /window\.__PRELOADED_STATE__\s*=\s*({.*?});/s,
        ];
        
        for (const pattern of jsonPatterns) {
          const match = scriptContent.match(pattern);
          if (match) {
            try {
              if (pattern.toString().includes('__PRELOADED_STATE__')) {
                const jsonStr = match[1];
                const data = JSON.parse(jsonStr);
                // Navigate through the structure to find lyrics
                if (data.songPage?.lyricsData?.body?.html) {
                  return data.songPage.lyricsData.body.html;
                }
              } else if (match[1].startsWith('{')) {
                const data = JSON.parse(match[1]);
                // Try different paths
                if (data.body?.html) {
                  return data.body.html;
                }
              } else {
                // Direct HTML string
                const escapedHtml = match[1];
                const html = escapedHtml
                  .replace(/\\"/g, '"')
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\u(\w{4})/g, (match, p1) => 
                    String.fromCharCode(parseInt(p1, 16))
                  );
                return html;
              }
            } catch (parseError) {
              console.error('Failed to parse script JSON:', parseError.message);
              continue;
            }
          }
        }
      }
    }
    
    return null;
  }

  async scrapeLyricsAlternative(url) {
    // Alternative method using a different approach
    try {
      // Try with a completely different user agent
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html',
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(response.data);
      
      // Try to find lyrics in plain text
      const pageText = $('body').text();
      const lines = pageText.split('\n');
      
      // Look for lines that look like lyrics (contain common lyric patterns)
      const lyricLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 20 && 
               !trimmed.includes('http') &&
               !trimmed.includes('@') &&
               !trimmed.includes('Advertisement') &&
               (trimmed.includes('[') || /^[A-Z][a-z]/.test(trimmed));
      });
      
      if (lyricLines.length > 10) {
        return lyricLines.join('\n');
      }
      
      throw new Error('Could not extract lyrics with alternative method');
      
    } catch (error) {
      throw new Error(`Alternative method failed: ${error.message}`);
    }
  }

  cleanLyrics(html) {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    
    // Remove all script and style tags
    $('script, style').remove();
    
    // Process links - keep text but remove href
    $('a').each((i, elem) => {
      const $elem = $(elem);
      $elem.replaceWith($elem.text());
    });
    
    // Handle line breaks
    $('br').each((i, elem) => {
      $(elem).replaceWith('\n');
    });
    
    // Handle paragraphs
    $('p').each((i, elem) => {
      const $elem = $(elem);
      $elem.replaceWith($elem.text() + '\n\n');
    });
    
    // Handle divs - add newlines
    $('div').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      if (text) {
        $elem.replaceWith(text + '\n');
      }
    });
    
    // Get text and clean it
    let text = $.text();
    
    // Clean up
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.replace(/\[.*?\]/g, (match) => '\n' + match + '\n'); // Format section headers
    text = text.trim();
    
    return text;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeSongDetails(url) {
    try {
      const lyrics = await this.scrapeLyrics(url);
      
      if (!lyrics) {
        throw new Error('Could not extract lyrics');
      }
      
      // Try to get metadata from the page
      const response = await this.client.get(url);
      const $ = cheerio.load(response.data);
      
      const title = $('h1').first().text().trim() ||
                    $('title').text().split('|')[0].trim();
      
      const artist = $('a[href*="/artists/"]').first().text().trim() ||
                     $('[class*="Artist"]').first().text().trim() ||
                     'Unknown Artist';
      
      const image = $('meta[property="og:image"]').attr('content') ||
                    $('img[class*="cover"]').attr('src') ||
                    $('img[alt*="cover"]').attr('src');
      
      return {
        title,
        artist,
        image,
        lyrics,
        url
      };
      
    } catch (error) {
      console.error('Scrape song details error:', error.message);
      throw error;
    }
  }
}

module.exports = new GeniusScraper();
