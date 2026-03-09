# vxfedi

> Enhanced link previews for Fediverse posts and profiles - Like vxTwitter, but for the Fediverse 💜

**vxfedi** is a self-hostable service that generates rich Open Graph, Twitter Card, and oEmbed metadata for Fediverse (Mastodon, Pleroma, Misskey, etc.) posts and profiles. When you share a vxfedi link on Discord, Twitter/X, Slack, Telegram, WhatsApp, or any other platform that supports link previews, you get beautiful, informative embeds instead of plain links.

## ✨ Features

- 🎨 **Rich Social Embeds** - Beautiful previews with titles, descriptions, media, and author info
- 🤖 **Multi-Format Support** - Generates Open Graph, Twitter Card, and oEmbed metadata
- 🌐 **Universal Compatibility** - Works with Mastodon, Pleroma, Misskey, and other ActivityPub servers
- 📱 **Smart User-Agent Detection** - Shows embeds to bots, redirects humans to original content
- 🖼️ **Media Support** - Handles images, videos, and alt-text
- 🔒 **Privacy-Aware** - Respects sensitive content warnings
- 🐳 **Docker Ready** - Easy deployment with Docker Compose on Alpine Linux
- ⚡ **Lightweight** - Minimal dependencies, fast response times

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for production deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/m4rcel-lol/vxfedi.git
   cd vxfedi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Visit** `http://localhost:3000`

### Docker Deployment

1. **Clone and configure**
   ```bash
   git clone https://github.com/m4rcel-lol/vxfedi.git
   cd vxfedi
   cp .env.example .env
   # Edit .env with your BASE_URL
   ```

2. **Build and start**
   ```bash
   docker-compose up -d
   ```

3. **Check logs**
   ```bash
   docker-compose logs -f
   ```

4. **Access your instance at the configured BASE_URL**

## 📖 How to Use

### Basic Usage

Replace the domain of any Fediverse URL with your vxfedi instance domain:

**Original Fediverse URL:**
```
https://mastodon.social/@user/123456789
```

**vxfedi URL:**
```
https://vx.yourdomain.tld/mastodon.social/@user/123456789
```

### Supported URL Formats

#### Posts/Statuses
- `vx.yourdomain.tld/instance.tld/@username/postid` (Mastodon)
- `vx.yourdomain.tld/instance.tld/@username/statuses/postid` (GoToSocial)
- `vx.yourdomain.tld/instance.tld/users/username/statuses/postid` (ActivityPub)
- `vx.yourdomain.tld/instance.tld/notice/postid` (Pleroma/Akkoma)
- `vx.yourdomain.tld/instance.tld/objects/uuid` (Pleroma/Akkoma ActivityPub)
- `vx.yourdomain.tld/instance.tld/notes/noteid` (Misskey/Firefish/Sharkey)
- `vx.yourdomain.tld/instance.tld/p/username/postid` (Pixelfed)

#### Profiles
- `vx.yourdomain.tld/instance.tld/@username`
- `vx.yourdomain.tld/instance.tld/users/username`

### Examples

```bash
# Mastodon post
https://vx.yourdomain.tld/mastodon.social/@Gargron/109337134326486043

# GoToSocial post
https://vx.yourdomain.tld/social.example.com/@username/statuses/01KK9CG9D9WAHQG5R5FXNR90YD

# User profile
https://vx.yourdomain.tld/mas.to/@dansup

# Pleroma/Akkoma post
https://vx.yourdomain.tld/pleroma.site/notice/AaBbCcDd

# Misskey note
https://vx.yourdomain.tld/misskey.io/notes/9abcdef123456789

# Pixelfed post
https://vx.yourdomain.tld/pixelfed.social/p/username/123456
```

## 🔧 Configuration

Edit `.env` file or set environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `production` | Environment (development/production) |
| `BASE_URL` | `http://localhost:3000` | Your vxfedi instance URL |
| `USER_AGENT` | `vxfedi/1.0` | User agent for API requests |
| `REQUEST_TIMEOUT` | `10000` | API request timeout (ms) |
| `CACHE_MAX_AGE` | `3600` | Cache duration (seconds) |

## 🏗️ Architecture

```
vxfedi/
├── src/
│   ├── index.js              # Main Express server
│   └── utils/
│       ├── urlParser.js      # Parse vxfedi URLs
│       ├── fediverseApi.js   # Fetch from Fediverse instances
│       ├── metaGenerator.js  # Generate Open Graph/Twitter Card metadata
│       ├── pageRenderer.js   # Render HTML landing pages
│       └── userAgent.js      # Detect bots vs. users
├── Dockerfile                # Alpine Linux container
├── docker-compose.yml        # Orchestration config
└── package.json              # Dependencies
```

## 🤖 How It Works

1. **URL Parsing** - Extracts instance, username, and post/profile ID from vxfedi URL
2. **Content Fetching** - Queries the Fediverse instance using Mastodon API and/or ActivityPub
3. **Bot Detection** - Checks User-Agent to identify crawlers (Discord, Twitter, etc.)
4. **For Bots:** Renders HTML with rich Open Graph, Twitter Card, and oEmbed metadata
5. **For Users:** Redirects to the original Fediverse content

## 🌟 Platform Support

vxfedi generates embeds for:

- ✅ **Discord** - Open Graph, oEmbed, Twitter Card
- ✅ **Twitter/X** - Twitter Card metadata
- ✅ **Slack** - Open Graph, oEmbed
- ✅ **Telegram** - Open Graph
- ✅ **WhatsApp** - Open Graph
- ✅ **Signal** - Open Graph
- ✅ **iMessage** - Open Graph
- ✅ **Matrix clients** - Open Graph
- ✅ **LinkedIn, Reddit, Facebook** - Open Graph

## 🔒 Security

- **Input Validation** - All URLs are parsed and validated
- **Request Timeouts** - Prevents hanging on unresponsive instances
- **No User Data Storage** - Stateless design, no database
- **Non-Root User** - Docker container runs as unprivileged user
- **Health Checks** - Built-in monitoring endpoint

## 🐛 Troubleshooting

### Links don't preview on Discord/other platforms

1. Check that your vxfedi instance is publicly accessible
2. Verify `BASE_URL` is set correctly in `.env`
3. Test with Discord's embed debugger or Twitter Card validator
4. Check server logs: `docker-compose logs -f`

### Content not found errors

- Ensure the target Fediverse instance is accessible
- Some instances may block API requests - check their rate limits
- Private profiles and posts won't be accessible

### Slow response times

- Increase `REQUEST_TIMEOUT` if instances are slow
- Check network connectivity to Fediverse instances
- Consider implementing caching for frequently accessed content

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build Docker image
docker build -t vxfedi .

# Run tests (when available)
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [vxTwitter](https://github.com/dylanpdx/BetterTwitFix)
- Built for the Fediverse community
- Supports the open social web

## 🔗 Links

- **Repository:** https://github.com/m4rcel-lol/vxfedi
- **Issues:** https://github.com/m4rcel-lol/vxfedi/issues
- **Fediverse:** Join us on Mastodon!

---

Made with 💜 for the Fediverse
