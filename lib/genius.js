const axios = require('axios');

class GeniusAPI {
  constructor() {
    this.accessToken = process.env.GENIUS_ACCESS_TOKEN;
    this.baseURL = 'https://api.genius.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'User-Agent': 'CompuServe Classic/1.22',
        'Accept': 'application/json'
      }
    });
  }

  async search(query) {
    try {
      const response = await this.client.get('/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Genius search error:', error.message);
      throw error;
    }
  }

  async getSong(songId) {
    try {
      const response = await this.client.get(`/songs/${songId}`);
      return response.data;
    } catch (error) {
      console.error('Genius get song error:', error.message);
      throw error;
    }
  }

  async getSongByUrl(url) {
    try {
      const response = await this.client.get(`/referents`, {
        params: {
          song_id: this.extractSongIdFromUrl(url),
          text_format: 'plain'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Genius get song by URL error:', error.message);
      throw error;
    }
  }

  extractSongIdFromUrl(url) {
    const match = url.match(/genius\.com\/.*-(\d+)/);
    return match ? match[1] : null;
  }

  parseSearchResults(data) {
    if (!data || !data.response || !data.response.hits) {
      return [];
    }

    return data.response.hits.map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      fullTitle: hit.result.full_title,
      artist: hit.result.primary_artist.name,
      artistId: hit.result.primary_artist.id,
      url: hit.result.url,
      thumbnail: hit.result.header_image_thumbnail_url,
      image: hit.result.header_image_url,
      apiPath: hit.result.api_path,
      lyricsState: hit.result.lyrics_state,
      annotationCount: hit.result.annotation_count,
      pyongsCount: hit.result.pyongs_count,
      releaseDate: hit.result.release_date_for_display
    }));
  }
}

module.exports = new GeniusAPI();
