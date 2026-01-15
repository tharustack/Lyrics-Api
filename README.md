# 🎵 Multi-Language Lyrics API

A serverless lyrics scraper API that supports multiple languages including **English, Sinhala, Korean, Japanese, Hindi, Spanish** and more!

Deployed on Vercel with instant global edge caching.

## ✨ Features

- 🌍 **Multi-language support** (Genius + Sinhala lyrics sites)
- ⚡ **Serverless & Fast** (Vercel Edge Functions)
- 🔄 **Auto-fallback** between sources
- 🆓 **Free to use** (no API key required)
- 🌐 **CORS enabled** (works from any frontend)

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/lyrics-api)

### Manual Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/lyrics-api.git
cd lyrics-api

# Install dependencies
npm install

# Deploy to Vercel
npx vercel --prod
```

## 📚 API Endpoints

### Base URL
```
https://your-project.vercel.app
```

### 1. Search Songs (Multi-source)
Search across Genius and Sinhala lyrics sites.

```bash
GET /api/search?q=song_name
```

**Example:**
```bash
curl "https://your-project.vercel.app/api/search?q=bohemian%20rhapsody"
```

**Response:**
```json
{
  "query": "bohemian rhapsody",
  "count": 5,
  "sources": {
    "genius": 3,
    "sinhala": 2
  },
  "results": [
    {
      "id": 54,
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "url": "https://genius.com/Queen-bohemian-rhapsody-lyrics",
      "thumbnail": "...",
      "source": "genius"
    }
  ]
}
```

### 2. Get Lyrics (Auto-select best source)
Automatically searches and returns lyrics from the best available source.

```bash
GET /api/lyrics?song=song_name
```

**Example:**
```bash
curl "https://your-project.vercel.app/api/lyrics?song=සඳ%20එළිය"
```

**Response:**
```json
{
  "source": "sinhalasongbook",
  "title": "සඳ එළිය",
  "url": "https://www.sinhalasongbook.com/...",
  "lyrics": "..."
}
```

### 3. Genius Search
Search only on Genius.

```bash
GET /api/genius/search?q=song_name
```

### 4. Genius Lyrics
Get lyrics from Genius URL or song name.

```bash
GET /api/genius/lyrics?url=genius_url
GET /api/genius/lyrics?song=song_name
```

**Example:**
```bash
curl "https://your-project.vercel.app/api/genius/lyrics?song=gangnam%20style"
```

### 5. Sinhala Search
Search only on Sinhala lyrics sites.

```bash
GET /api/sinhala/search?q=song_name
```

### 6. Sinhala Lyrics
Get lyrics from Sinhala lyrics URL or song name.

```bash
GET /api/sinhala/lyrics?url=sinhala_url
GET /api/sinhala/lyrics?song=song_name
```

## 🛠️ Project Structure

```
lyrics-api/
├── api/
│   ├── index.js              # API documentation endpoint
│   ├── search.js             # Multi-source search
│   ├── lyrics.js             # Auto-select lyrics
│   ├── genius/
│   │   ├── search.js         # Genius search
│   │   └── lyrics.js         # Genius lyrics
│   ├── sinhala/
│   │   ├── search.js         # Sinhala search
│   │   └── lyrics.js         # Sinhala lyrics
│   └── utils/
│       └── scraper.js        # Core scraping functions
├── package.json
├── vercel.json               # Vercel configuration
└── README.md
```

## 🌐 Supported Languages

- 🇬🇧 English
- 🇱🇰 Sinhala (සිංහල)
- 🇰🇷 Korean (한국어)
- 🇯🇵 Japanese (日本語)
- 🇮🇳 Hindi (हिन्दी)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- And many more...

## 💻 Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# API will be available at http://localhost:3000
```

## 📝 Environment Variables

No environment variables needed! The API works out of the box.

## ⚠️ Important Notes

- **Respect Copyright**: Lyrics are copyrighted material
- **Rate Limiting**: Source sites may rate limit requests
- **Terms of Service**: Use responsibly and respect ToS of source sites
- **For Educational Use**: This project is for educational purposes

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add more lyrics sources
- Improve scraping logic
- Add caching
- Fix bugs

## 📄 License

MIT License - feel free to use in your projects!

## 🙏 Credits

- Lyrics sources: [Genius.com](https://genius.com), [SinhalaSongBook.com](https://sinhalasongbook.com)
- Powered by [Vercel](https://vercel.com)

---

Made with ❤️ for music lovers worldwide 🎶
