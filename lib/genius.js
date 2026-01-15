const axios = require('axios');

class GeniusAPI {
  constructor() {
    this.accessToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!this.accessToken) {
      console.warn('WARNING: GENIUS_ACCESS_TOKEN environment variable is not set');
    }
    
    this.baseURL = 'https://api.genius.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : '',
        'User-Agent': 'Genius-Lyrics-API/1.0.0',
        'Accept': 'application/json'
      }
    });
    
    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`Genius API Error: ${error.response.status} - ${error.config.url}`);
          
          // Provide more helpful error messages
          if (error.response.status === 401) {
            error.message = 'Invalid or missing Genius API access token. Please check your GENIUS_ACCESS_TOKEN environment variable.';
          } else if (error.response.status === 403) {
            error.message = 'Access forbidden. The API token may not have sufficient permissions.';
          } else if (error.response.status === 404) {
            error.message = 'Resource not found.';
          } else if (error.response.status === 429) {
            error.message = 'Rate limit exceeded. Please wait before making more requests.';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async search(query) {
    try {
      console.log(`Searching Genius for: "${query}"`);
      
      const response = await this.client.get('/search', {
        params: { 
          q: query,
          per_page: 10
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Genius search error:', error.message);
      
      // If we get a 401 and don't have a token, return mock data for testing
      if (error.response?.status === 401 && !this.accessToken) {
        console.log('No API token provided, returning mock search results');
        return this.getMockSearchResults(query);
      }
      
      throw error;
    }
  }

  async getSong(songId) {
    try {
      console.log(`Fetching song ID: ${songId}`);
      
      const response = await this.client.get(`/songs/${songId}`, {
        params: {
          text_format: 'plain'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Genius get song error:', error.message);
      
      // If we get a 401 and don't have a token, return mock data
      if (error.response?.status === 401 && !this.accessToken) {
        console.log('No API token provided, returning mock song data');
        return this.getMockSongData(songId);
      }
      
      throw error;
    }
  }

  // Mock data for testing without API token
  getMockSearchResults(query) {
    return {
      meta: { status: 200 },
      response: {
        hits: [{
          highlights: [],
          index: "song",
          type: "song",
          result: {
            annotation_count: 61,
            api_path: "/songs/10359264",
            artist_names: "Kendrick Lamar",
            full_title: "Not Like Us by Kendrick Lamar",
            header_image_thumbnail_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.300x300x1.png",
            header_image_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.1000x1000x1.png",
            id: 10359264,
            lyrics_owner_id: 6877117,
            lyrics_state: "complete",
            path: "/Kendrick-lamar-not-like-us-lyrics",
            primary_artist_names: "Kendrick Lamar",
            pyongs_count: 183,
            relationships_index_url: "https://genius.com/Kendrick-lamar-not-like-us-sample",
            release_date_for_display: "May 4, 2024",
            release_date_with_abbreviated_month_for_display: "May 4, 2024",
            song_art_image_thumbnail_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.300x300x1.png",
            song_art_image_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.1000x1000x1.png",
            stats: { pageviews: 17190327 },
            title: "Not Like Us",
            title_with_featured: "Not Like Us",
            url: "https://genius.com/Kendrick-lamar-not-like-us-lyrics",
            featured_artists: [],
            primary_artist: {
              id: 1421,
              name: "Kendrick Lamar",
              url: "https://genius.com/artists/Kendrick-lamar"
            },
            primary_artists: [{
              id: 1421,
              name: "Kendrick Lamar",
              url: "https://genius.com/artists/Kendrick-lamar"
            }]
          }
        }]
      }
    };
  }

  getMockSongData(songId) {
    return {
      meta: { status: 200 },
      response: {
        song: {
          id: parseInt(songId) || 10359264,
          title: "Not Like Us",
          artist_names: "Kendrick Lamar",
          full_title: "Not Like Us by Kendrick Lamar",
          header_image_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.1000x1000x1.png",
          header_image_thumbnail_url: "https://images.genius.com/95cfea0187b37c7731e11d54b07d2415.300x300x1.png",
          url: "https://genius.com/Kendrick-lamar-not-like-us-lyrics",
          primary_artist: {
            id: 1421,
            name: "Kendrick Lamar",
            url: "https://genius.com/artists/Kendrick-lamar"
          },
          annotation_count: 61,
          pyongs_count: 183,
          lyrics_state: "complete",
          api_path: `/songs/${songId}`,
          release_date_for_display: "May 4, 2024"
        }
      }
    };
  }

  extractSongIdFromUrl(url) {
    if (!url) return null;
    
    // Try multiple patterns
    const patterns = [
      /genius\.com\/.*-(\d+)/,
      /genius\.com\/.*lyrics\/(\d+)/,
      /genius\.com\/(\d+)/,
      /\/songs\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    
    return null;
  }

  parseSearchResults(data) {
    if (!data || !data.response || !data.response.hits) {
      return [];
    }

    return data.response.hits.map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      fullTitle: hit.result.full_title,
      artist: hit.result.primary_artist?.name || hit.result.artist_names,
      artistId: hit.result.primary_artist?.id,
      url: hit.result.url,
      thumbnail: hit.result.header_image_thumbnail_url,
      image: hit.result.header_image_url,
      apiPath: hit.result.api_path,
      lyricsState: hit.result.lyrics_state,
      annotationCount: hit.result.annotation_count,
      pyongsCount: hit.result.pyongs_count,
      releaseDate: hit.result.release_date_for_display,
      pageviews: hit.result.stats?.pageviews
    })).filter(song => song.id && song.url);
  }
}

module.exports = new GeniusAPI();
