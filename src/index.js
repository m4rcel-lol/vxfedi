require('dotenv').config();
const express = require('express');
const { parseVxUrl } = require('./utils/urlParser');
const { fetchFediverseContent } = require('./utils/fediverseApi');
const { generateMetaTags } = require('./utils/metaGenerator');
const { renderLandingPage } = require('./utils/pageRenderer');
const { detectBot } = require('./utils/userAgent');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.set('trust proxy', true);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vxfedi' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>vxfedi - Enhanced Fediverse Link Previews</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #6364FF; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .example { margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>🚀 vxfedi</h1>
      <p>Enhanced link previews for Fediverse posts and profiles.</p>

      <h2>How to Use</h2>
      <p>Replace the domain of any Fediverse post or profile URL with <code>vx.yourdomain.tld</code>:</p>

      <div class="example">
        <strong>Original:</strong><br>
        <code>https://mastodon.social/@user/123456789</code>

        <br><br><strong>Enhanced:</strong><br>
        <code>${BASE_URL}/mastodon.social/@user/123456789</code>
      </div>

      <h2>Supported Formats</h2>
      <ul>
        <li><strong>Mastodon:</strong> <code>${BASE_URL}/instance.tld/@username/postid</code></li>
        <li><strong>GoToSocial:</strong> <code>${BASE_URL}/instance.tld/@username/statuses/postid</code></li>
        <li><strong>Misskey/Firefish:</strong> <code>${BASE_URL}/instance.tld/notes/noteid</code></li>
        <li><strong>Pleroma/Akkoma:</strong> <code>${BASE_URL}/instance.tld/notice/postid</code></li>
        <li><strong>Pixelfed:</strong> <code>${BASE_URL}/instance.tld/p/username/postid</code></li>
        <li><strong>Profiles:</strong> <code>${BASE_URL}/instance.tld/@username</code></li>
        <li><strong>ActivityPub:</strong> <code>${BASE_URL}/instance.tld/users/username/statuses/postid</code></li>
      </ul>

      <h2>Features</h2>
      <ul>
        <li>✅ Rich Open Graph metadata</li>
        <li>✅ Twitter Card support</li>
        <li>✅ oEmbed integration</li>
        <li>✅ Media preview with alt-text</li>
        <li>✅ Works with Discord, Twitter/X, Slack, Telegram, and more</li>
      </ul>

      <p style="margin-top: 40px; color: #666; font-size: 14px;">
        vxfedi - Like vxTwitter, but for the Fediverse 💜
      </p>
    </body>
    </html>
  `);
});

// oEmbed endpoint
app.get('/oembed', async (req, res) => {
  try {
    const { url, maxwidth, maxheight, format = 'json' } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    if (format !== 'json') {
      return res.status(501).json({ error: 'Only JSON format is supported' });
    }

    // Parse the vxfedi URL to get the original Fediverse URL
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;

    const parsed = parseVxUrl(path);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid vxfedi URL format' });
    }

    // Fetch content from Fediverse
    const content = await fetchFediverseContent(parsed);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Generate oEmbed response
    const oembedData = {
      version: '1.0',
      type: 'rich',
      provider_name: 'vxfedi',
      provider_url: BASE_URL,
      title: content.title || content.displayName || 'Fediverse Post',
      author_name: content.author || content.displayName || 'Unknown',
      author_url: content.authorUrl || content.url,
      html: `<iframe src="${url}" width="${maxwidth || 550}" height="${maxheight || 400}" frameborder="0"></iframe>`,
      width: parseInt(maxwidth) || 550,
      height: parseInt(maxheight) || 400,
      cache_age: 3600
    };

    if (content.thumbnail) {
      oembedData.thumbnail_url = content.thumbnail;
      oembedData.thumbnail_width = 1200;
      oembedData.thumbnail_height = 630;
    }

    res.json(oembedData);
  } catch (error) {
    console.error('oEmbed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Main handler for Fediverse URLs
app.get('/*', async (req, res) => {
  try {
    const path = req.path;

    // Skip favicon requests
    if (path === '/favicon.ico') {
      return res.status(404).end();
    }

    // Parse the vxfedi URL
    const parsed = parseVxUrl(path);

    if (!parsed) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid URL - vxfedi</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center;">
          <h1>⚠️ Invalid URL Format</h1>
          <p>Supported formats:</p>
          <ul style="text-align: left; display: inline-block;">
            <li><strong>Mastodon:</strong> <code>${BASE_URL}/instance.tld/@username/postid</code></li>
            <li><strong>GoToSocial:</strong> <code>${BASE_URL}/instance.tld/@username/statuses/postid</code></li>
            <li><strong>Misskey/Firefish:</strong> <code>${BASE_URL}/instance.tld/notes/noteid</code></li>
            <li><strong>Pleroma/Akkoma:</strong> <code>${BASE_URL}/instance.tld/notice/postid</code></li>
            <li><strong>Pixelfed:</strong> <code>${BASE_URL}/instance.tld/p/username/postid</code></li>
          </ul>
          <p><a href="${BASE_URL}">Go to homepage</a></p>
        </body>
        </html>
      `);
    }

    // Fetch content from Fediverse
    const content = await fetchFediverseContent(parsed);

    if (!content) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Content Not Found - vxfedi</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center;">
          <h1>❌ Content Not Found</h1>
          <p>The requested Fediverse content could not be found or is not accessible.</p>
          <p>Original URL: <code>${parsed.originalUrl}</code></p>
          <p><a href="${BASE_URL}">Go to homepage</a></p>
        </body>
        </html>
      `);
    }

    // Check if this is a bot/crawler or a regular user
    const isBot = detectBot(req.headers['user-agent']);

    if (isBot) {
      // For bots: return HTML with rich meta tags
      const metaTags = generateMetaTags(content, BASE_URL, req.path);
      const html = renderLandingPage(content, metaTags, BASE_URL);
      res.set('Cache-Control', `public, max-age=${process.env.CACHE_MAX_AGE || 3600}`);
      return res.send(html);
    } else {
      // For regular users: redirect to the original Fediverse content
      const redirectUrl = content.url || parsed.originalUrl;
      return res.redirect(302, redirectUrl);
    }
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - vxfedi</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center;">
        <h1>⚠️ Error</h1>
        <p>An error occurred while processing your request.</p>
        <p><a href="${BASE_URL}">Go to homepage</a></p>
      </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 vxfedi server running on port ${PORT}`);
  console.log(`📍 Base URL: ${BASE_URL}`);
});

module.exports = app;
