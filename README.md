# vxfedi

> Enhanced link previews for Fediverse posts and profiles - Like vxTwitter, but for the Fediverse 💜

**vxfedi** is a self-hostable service that generates rich Open Graph, Twitter Card, and oEmbed metadata for Fediverse posts, profiles, communities, and videos across the whole network — Mastodon, GoToSocial, Pleroma/Akkoma, Misskey/Firefish/Sharkey, Pixelfed, **Lemmy/PieFed**, **Mbin/Kbin**, and **PeerTube**. When you share a vxfedi link on Discord, Twitter/X, Slack, Telegram, WhatsApp, or any other platform that supports link previews, you get beautiful, informative embeds instead of plain links.

## ✨ Features

- 🎨 **Rich Social Embeds** - Beautiful previews with titles, descriptions, media, and author info
- 💬 **Engagement Indicators** - Comment, boost, and like counts shown right in the embed (boosts auto-hidden on platforms without a repost mechanism)
- 🤖 **Multi-Format Support** - Generates Open Graph, Twitter Card, and oEmbed metadata
- 🌐 **Universal Compatibility** - Works with Mastodon, GoToSocial, Pleroma/Akkoma, Misskey/Firefish/Sharkey, Pixelfed, Lemmy/PieFed, Mbin/Kbin, PeerTube, and other ActivityPub servers
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

5. **Visit** `http://localhost:41530`

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
- `vx.yourdomain.tld/instance.tld/post/id` (Lemmy/PieFed post)
- `vx.yourdomain.tld/instance.tld/comment/id` (Lemmy/PieFed comment)
- `vx.yourdomain.tld/instance.tld/m/magazine/t/id` (Mbin/Kbin thread)
- `vx.yourdomain.tld/instance.tld/w/videoid` (PeerTube video)
- `vx.yourdomain.tld/instance.tld/videos/watch/uuid` (PeerTube video)

#### Profiles / Communities / Channels
- `vx.yourdomain.tld/instance.tld/@username` (Mastodon/GoToSocial/Pixelfed)
- `vx.yourdomain.tld/instance.tld/users/username` (ActivityPub)
- `vx.yourdomain.tld/instance.tld/c/community` (Lemmy/PieFed community)
- `vx.yourdomain.tld/instance.tld/u/username` (Lemmy/PieFed/Mbin user)
- `vx.yourdomain.tld/instance.tld/m/magazine` (Mbin/Kbin magazine)
- `vx.yourdomain.tld/instance.tld/a/username` (PeerTube account)
- `vx.yourdomain.tld/instance.tld/video-channels/name` (PeerTube channel)

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

# Lemmy post / community / user
https://vx.yourdomain.tld/lemmy.world/post/1234567
https://vx.yourdomain.tld/lemmy.world/c/technology
https://vx.yourdomain.tld/lemmy.world/u/ruud

# Mbin/Kbin thread / magazine
https://vx.yourdomain.tld/kbin.earth/m/random/t/1462498
https://vx.yourdomain.tld/kbin.earth/m/random

# PeerTube video / account
https://vx.yourdomain.tld/framatube.org/w/kkGMgK9ZtnKfYAgnEtQxbv
https://vx.yourdomain.tld/framatube.org/a/framasoft
```

## 💬 Engagement Indicators

Post embeds lead with a one-line engagement summary so the numbers show up
directly inside the preview card on Discord, Telegram, Slack, and friends:

```
💬 12   🔁 340   ❤️ 5.6K

Just shipped a new feature!
```

- 💬 **Comments / replies**
- 🔁 **Boosts / reposts** — only shown on platforms that have the mechanism
- ❤️ **Likes / favourites / upvotes / reactions**

Counts are normalized across platforms and formatted compactly (`1.5K`, `3.4M`).
Because each network exposes engagement differently, the **boost indicator is
omitted entirely** for platforms that have no boost/repost concept — rather than
showing a misleading `🔁 0`.

| Platform | 💬 Comments | 🔁 Boosts | ❤️ Likes |
|----------|:----------:|:--------:|:--------:|
| Mastodon / GoToSocial / Pleroma / Akkoma | ✅ replies | ✅ reblogs | ✅ favourites |
| Misskey / Firefish / Sharkey | ✅ replies | ✅ renotes | ✅ reactions |
| Lemmy / PieFed | ✅ comments | ➖ none | ✅ upvotes (score) |
| Mbin / Kbin | ✅ comments | ➖ none | ✅ upvotes |
| PeerTube | ✅ comments | ➖ none | ✅ likes |

## 🔧 Configuration

Edit `.env` file or set environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `41530` | Server port |
| `NODE_ENV` | `production` | Environment (development/production) |
| `BASE_URL` | `http://localhost:41530` | Your vxfedi instance URL |
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

1. **URL Parsing** - Extracts the instance, resource type, and id from the vxfedi URL (with a platform hint for Lemmy/Mbin/PeerTube)
2. **Content Fetching** - Queries the source instance's native API with automatic fallbacks:
   - Mastodon API (`/api/v1/...`) for Mastodon, GoToSocial, Pleroma/Akkoma, Pixelfed, Friendica
   - Misskey API (`/api/notes/show`, `/api/users/show`) for Misskey/Firefish/Sharkey/Iceshrimp
   - Lemmy API (`/api/v3/...`, with PieFed's `/api/alpha/...` fallback) for posts, comments, communities, and users
   - PeerTube API (`/api/v1/videos`, `/accounts`, `/video-channels`) for videos, accounts, and channels
   - Mbin/Kbin API (`/api/entry`, `/api/magazine`, `/api/users`) for threads, magazines, and users
   - Raw ActivityPub (`application/activity+json`) as a universal last resort
3. **Bot Detection** - Checks User-Agent to identify crawlers (Discord, Twitter, etc.)
4. **For Bots:** Renders HTML with rich Open Graph, Twitter Card, and oEmbed metadata (including `og:video` player tags for PeerTube)
5. **For Users:** Redirects to the original Fediverse content

## 🌟 Platform Support

### Source platforms (where content comes from)

- ✅ **Mastodon** & forks (Hometown, Glitch) - posts & profiles
- ✅ **GoToSocial** - posts & profiles
- ✅ **Pleroma / Akkoma** - posts & profiles
- ✅ **Misskey / Firefish / Sharkey / Iceshrimp** - notes & profiles
- ✅ **Pixelfed** - photo posts & profiles
- ✅ **Lemmy / PieFed** - posts, comments, communities & users
- ✅ **Mbin / Kbin** - threads, magazines & users
- ✅ **PeerTube** - videos (with player embeds), accounts & channels
- ✅ **Any ActivityPub server** - generic Note/Article/Person fallback

### Embed targets (where links render)

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

# Run the test suite (Node's built-in test runner)
npm test
```

The project ships with unit tests covering URL parsing and the per-platform
API normalizers (Mastodon, Misskey, Lemmy, Mbin/Kbin, PeerTube). Please keep
them green and add coverage when introducing new platforms or fields.

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
- **Fediverse:** Find creator on his instance! `https://index.sarl/@m5rcel`

---

Made with 💜 for the Fediverse
