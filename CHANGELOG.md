# Changelog

All notable changes to vxfedi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-09

### Added
- Initial release of vxfedi
- Express.js web server with URL routing
- URL parser supporting multiple Fediverse URL formats
  - `/@username/postid` format
  - `/users/username/statuses/postid` format
  - `/notice/postid` format
  - Profile URLs for `/@username` and `/users/username`
- Fediverse API integration
  - Mastodon API v1 support
  - ActivityPub protocol support
  - Automatic endpoint discovery and fallback
- Rich metadata generation
  - Open Graph meta tags for posts and profiles
  - Twitter Card meta tags (summary and large image)
  - oEmbed JSON endpoint
- HTML landing page renderer
  - Dark theme design
  - Post view with author info, content, and media
  - Profile view with avatar, header, bio, and stats
  - Responsive mobile-friendly layout
- Media attachment handling
  - Image display with alt-text
  - Video support
  - GIF/gifv support
  - Alt-text awareness and accessibility
- Smart user-agent detection
  - Detects bots/crawlers (Discord, Twitter, Telegram, Slack, etc.)
  - Serves HTML with meta tags to bots
  - Redirects regular browsers to original Fediverse content
- Security features
  - Input validation and sanitization
  - Request timeouts to prevent hanging
  - Non-root Docker container
  - HTML escaping to prevent XSS
- Docker support
  - Alpine Linux-based Dockerfile
  - Docker Compose configuration
  - Health checks
  - Automatic restarts
- Comprehensive documentation
  - README with usage examples
  - Deployment guide with multiple deployment methods
  - Contributing guidelines
  - MIT License
- Configuration via environment variables
  - Customizable base URL, port, timeouts
  - User agent configuration
  - Cache control settings

### Supported Platforms
- Mastodon (all versions)
- Pleroma
- Akkoma
- Misskey
- Any ActivityPub-compatible server

### Tested Integrations
- Discord (Open Graph, oEmbed, Twitter Card)
- Twitter/X (Twitter Card)
- Slack (Open Graph, oEmbed)
- Telegram (Open Graph)
- WhatsApp (Open Graph)
- Other platforms supporting Open Graph

[1.0.0]: https://github.com/m4rcel-lol/vxfedi/releases/tag/v1.0.0
