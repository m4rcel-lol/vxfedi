const axios = require('axios');

const USER_AGENT = process.env.USER_AGENT || 'vxfedi/1.0 (https://github.com/m4rcel-lol/vxfedi)';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 10000;

// Cache instance types to avoid repeated NodeInfo lookups
const instanceCache = new Map();
const CACHE_TTL = parseInt(process.env.INSTANCE_CACHE_TTL) || 3600000; // 1 hour

// Software family mappings
const SOFTWARE_FAMILIES = {
  mastodon: ['mastodon', 'hometown', 'glitch-soc', 'ecko'],
  gotosocial: ['gotosocial'],
  pleroma: ['pleroma', 'akkoma'],
  misskey: ['misskey', 'firefish', 'sharkey', 'calckey', 'foundkey', 'iceshrimp', 'catodon', 'cherrypick'],
  pixelfed: ['pixelfed']
};

/**
 * Detect the software type of a Fediverse instance using NodeInfo
 * Returns: 'mastodon', 'gotosocial', 'pleroma', 'misskey', 'pixelfed', or 'unknown'
 */
async function detectInstanceType(instance) {
  // Check cache first
  const cached = instanceCache.get(instance);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.type;
  }

  try {
    // Fetch NodeInfo well-known endpoint
    const wellKnown = await axios.get(`https://${instance}/.well-known/nodeinfo`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT,
      validateStatus: (status) => status >= 200 && status < 300
    });

    if (!wellKnown.data?.links?.length) {
      return cacheAndReturn(instance, 'unknown');
    }

    // Find a NodeInfo link (prefer 2.1 over 2.0)
    const nodeInfoLink = wellKnown.data.links
      .filter(link => link.rel && link.href)
      .sort((a, b) => (b.rel || '').localeCompare(a.rel || ''))
      [0];

    if (!nodeInfoLink?.href) {
      return cacheAndReturn(instance, 'unknown');
    }

    // Fetch the NodeInfo document
    const nodeInfo = await axios.get(nodeInfoLink.href, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT,
      validateStatus: (status) => status >= 200 && status < 300
    });

    const softwareName = nodeInfo.data?.software?.name?.toLowerCase();

    if (!softwareName) {
      return cacheAndReturn(instance, 'unknown');
    }

    // Categorize based on software family
    for (const [family, names] of Object.entries(SOFTWARE_FAMILIES)) {
      if (names.includes(softwareName)) {
        return cacheAndReturn(instance, family);
      }
    }

    return cacheAndReturn(instance, 'unknown');
  } catch (error) {
    // NodeInfo not available or failed - fall back to unknown
    return cacheAndReturn(instance, 'unknown');
  }
}

function cacheAndReturn(instance, type) {
  instanceCache.set(instance, { type, timestamp: Date.now() });
  return type;
}

function clearCache() {
  instanceCache.clear();
}

module.exports = { detectInstanceType, clearCache, SOFTWARE_FAMILIES };
