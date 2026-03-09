/**
 * Detect if the user agent is a bot/crawler or a regular user
 * Bots get the HTML page with meta tags, users get redirected
 */
function detectBot(userAgent) {
  if (!userAgent) {
    return false;
  }

  const ua = userAgent.toLowerCase();

  // List of known bot user agents
  const botPatterns = [
    // Social media crawlers
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'telegrambot',
    'slackbot',
    'discordbot',
    'whatsapp',
    'skypeuripreview',
    'slack-imgproxy',
    'linkedinbot',
    'pinterestbot',
    'redditbot',
    'mastodonbot',

    // Search engine bots
    'googlebot',
    'bingbot',
    'yahoo',
    'duckduckbot',
    'baiduspider',
    'yandexbot',

    // Other bots
    'embedly',
    'quora link preview',
    'outbrain',
    'pinterest',
    'developers.google.com/+/web/snippet',
    'slackbot-linkexpanding',
    'vkshare',
    'w3c_validator',
    'bot',
    'crawler',
    'spider',
    'scraper',

    // Chat/messaging apps that fetch previews
    'whatsapp',
    'signal',
    'imessage',
    'telegram',
    'wechat',
    'line',
    'viber',
    'kakao',

    // oEmbed and Open Graph consumers
    'oembed',
    'preview',
    'unfurl',
    'linkexpander',
    'metainspector',
  ];

  // Check if any bot pattern matches
  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  // Additional heuristics: check for common bot indicators
  if (ua.includes('http') && !ua.includes('mozilla')) {
    // Many bots include 'http' in their UA but not 'mozilla'
    return true;
  }

  // If it looks like a regular browser, it's not a bot
  if (ua.includes('mozilla') && (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari'))) {
    return false;
  }

  // Default to not a bot for unknown user agents
  return false;
}

module.exports = {
  detectBot
};
