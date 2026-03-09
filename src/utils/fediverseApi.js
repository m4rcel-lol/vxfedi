const axios = require('axios');

const USER_AGENT = process.env.USER_AGENT || 'vxfedi/1.0 (https://github.com/m4rcel-lol/vxfedi)';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 10000;

/**
 * Fetch content from Fediverse instance
 * Tries multiple API endpoints and formats
 */
async function fetchFediverseContent(parsed) {
  const { instance, username, postId, resourceType, originalUrl } = parsed;

  try {
    if (resourceType === 'post') {
      return await fetchPost(instance, username, postId);
    } else if (resourceType === 'profile') {
      return await fetchProfile(instance, username);
    }
  } catch (error) {
    console.error('Error fetching Fediverse content:', error.message);
    return null;
  }

  return null;
}

/**
 * Fetch a post/status from a Fediverse instance
 */
async function fetchPost(instance, username, postId) {
  const baseUrl = `https://${instance}`;

  // Try different API endpoints in order of preference
  const endpoints = [
    // Mastodon API v1 (most common, works on Mastodon, GoToSocial, Pleroma/Akkoma)
    `/api/v1/statuses/${postId}`,
    // Misskey/Firefish/Sharkey API
    `/api/notes/show`,
    // ActivityPub endpoints (with Accept header)
    username ? `/@${username}/statuses/${postId}` : null, // GoToSocial format
    username ? `/@${username}/${postId}` : null, // Mastodon format
    username ? `/users/${username}/statuses/${postId}` : null, // ActivityPub format
    `/notice/${postId}`, // Pleroma/Akkoma format
    `/objects/${postId}`, // Pleroma/Akkoma ActivityPub objects
    `/notes/${postId}`, // Misskey/Firefish/Sharkey
  ].filter(Boolean);

  for (const endpoint of endpoints) {
    try {
      const headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/activity+json, application/ld+json, application/json'
      };

      let response;

      // Misskey/Firefish/Sharkey uses POST for API
      if (endpoint === '/api/notes/show') {
        response = await axios.post(`${baseUrl}${endpoint}`, {
          noteId: postId
        }, {
          headers: { ...headers, 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT,
          validateStatus: (status) => status >= 200 && status < 300
        });
      } else {
        response = await axios.get(`${baseUrl}${endpoint}`, {
          headers,
          timeout: REQUEST_TIMEOUT,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300
        });
      }

      if (response.data) {
        return parsePostData(response.data, instance, postId);
      }
    } catch (error) {
      // Try next endpoint
      continue;
    }
  }

  return null;
}

/**
 * Fetch a profile from a Fediverse instance
 */
async function fetchProfile(instance, username) {
  const baseUrl = `https://${instance}`;

  // Try different API endpoints
  const endpoints = [
    // Mastodon API (works on Mastodon, GoToSocial, Pleroma/Akkoma)
    { url: `/api/v1/accounts/lookup?acct=${username}`, method: 'GET' },
    // Misskey/Firefish/Sharkey API
    { url: `/api/users/show`, method: 'POST', body: { username } },
    // ActivityPub endpoint
    { url: `/@${username}`, method: 'GET' },
    { url: `/users/${username}`, method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    try {
      const headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/activity+json, application/ld+json, application/json'
      };

      let response;

      if (endpoint.method === 'POST') {
        response = await axios.post(`${baseUrl}${endpoint.url}`, endpoint.body, {
          headers: { ...headers, 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300
        });
      } else {
        response = await axios.get(`${baseUrl}${endpoint.url}`, {
          headers,
          timeout: REQUEST_TIMEOUT,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300
        });
      }

      if (response.data) {
        return parseProfileData(response.data, instance, username);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Parse post data from various formats (Mastodon API, ActivityPub, Misskey)
 */
function parsePostData(data, instance, postId) {
  // Mastodon/GoToSocial/Pleroma API format (has content and account fields)
  if (data.content !== undefined && data.account !== undefined) {
    return {
      type: 'post',
      id: data.id || postId,
      url: data.url || data.uri,
      content: stripHtml(data.content),
      contentHtml: data.content,
      author: data.account?.display_name || data.account?.username || 'Unknown',
      authorUsername: data.account?.acct || data.account?.username,
      authorUrl: data.account?.url,
      authorAvatar: data.account?.avatar || data.account?.avatar_static,
      createdAt: data.created_at,
      repliesCount: data.replies_count || 0,
      reblogsCount: data.reblogs_count || 0,
      favouritesCount: data.favourites_count || 0,
      mediaAttachments: parseMediaAttachments(data.media_attachments),
      sensitive: data.sensitive || false,
      spoilerText: data.spoiler_text || '',
      instance: instance,
      title: generatePostTitle(data),
      description: truncateText(stripHtml(data.content), 200)
    };
  }

  // Misskey/Firefish/Sharkey API format (has text and user fields)
  if (data.text !== undefined && data.user !== undefined) {
    const content = data.text || '';
    const author = data.user?.name || data.user?.username || 'Unknown';
    return {
      type: 'post',
      id: data.id || postId,
      url: `https://${instance}/notes/${data.id || postId}`,
      content: content,
      contentHtml: content,
      author: author,
      authorUsername: data.user?.username,
      authorUrl: `https://${instance}/@${data.user?.username}`,
      authorAvatar: data.user?.avatarUrl,
      createdAt: data.createdAt,
      repliesCount: data.repliesCount || 0,
      reblogsCount: data.renoteCount || 0,
      favouritesCount: data.reactions ? Object.values(data.reactions).reduce((a, b) => a + b, 0) : 0,
      mediaAttachments: parseMisskeyMedia(data.files),
      sensitive: data.cw != null,
      spoilerText: data.cw || '',
      instance: instance,
      title: `${author} on ${instance}: "${truncateText(content, 60) || 'Post'}"`,
      description: truncateText(content, 200)
    };
  }

  // ActivityPub format
  if (data['@context'] || data.type === 'Note' || data.type === 'Article') {
    const content = data.content || data.summary || '';
    return {
      type: 'post',
      id: postId,
      url: data.id || data.url,
      content: stripHtml(content),
      contentHtml: content,
      author: data.attributedTo?.name || data.actor?.name || 'Unknown',
      authorUrl: data.attributedTo?.id || data.attributedTo || data.actor?.id || data.actor,
      createdAt: data.published,
      mediaAttachments: parseActivityPubMedia(data.attachment),
      sensitive: data.sensitive || false,
      instance: instance,
      title: generatePostTitle({ content: stripHtml(content), account: { display_name: data.attributedTo?.name } }),
      description: truncateText(stripHtml(content), 200)
    };
  }

  return null;
}

/**
 * Parse profile data from various formats
 */
function parseProfileData(data, instance, username) {
  // Mastodon/GoToSocial/Pleroma API format (has username and acct)
  if (data.username !== undefined && data.acct !== undefined) {
    return {
      type: 'profile',
      id: data.id,
      username: data.username,
      displayName: data.display_name || data.username,
      acct: data.acct,
      url: data.url,
      avatar: data.avatar || data.avatar_static,
      header: data.header || data.header_static,
      note: stripHtml(data.note || ''),
      noteHtml: data.note,
      followersCount: data.followers_count || 0,
      followingCount: data.following_count || 0,
      statusesCount: data.statuses_count || 0,
      bot: data.bot || false,
      locked: data.locked || false,
      createdAt: data.created_at,
      instance: instance,
      title: `${data.display_name || data.username} (@${data.acct}) - Fediverse Profile`,
      description: truncateText(stripHtml(data.note || ''), 200) || `Follow ${data.display_name || data.username} on the Fediverse`,
      thumbnail: data.avatar || data.header
    };
  }

  // Misskey/Firefish/Sharkey API format (has username and avatarUrl)
  if (data.username !== undefined && data.avatarUrl !== undefined) {
    const displayName = data.name || data.username;
    return {
      type: 'profile',
      id: data.id,
      username: data.username,
      displayName: displayName,
      acct: data.username,
      url: `https://${instance}/@${data.username}`,
      avatar: data.avatarUrl,
      header: data.bannerUrl,
      note: data.description ? stripHtml(data.description) : '',
      noteHtml: data.description,
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
      statusesCount: data.notesCount || 0,
      bot: data.isBot || false,
      locked: data.isLocked || false,
      createdAt: data.createdAt,
      instance: instance,
      title: `${displayName} (@${data.username}@${instance}) - Fediverse Profile`,
      description: truncateText(data.description ? stripHtml(data.description) : '', 200) || `Follow ${displayName} on the Fediverse`,
      thumbnail: data.avatarUrl || data.bannerUrl
    };
  }

  // ActivityPub format (Person, Service, etc.)
  if (data['@context'] || data.type === 'Person' || data.type === 'Service') {
    const displayName = data.name || data.preferredUsername || username;
    return {
      type: 'profile',
      username: data.preferredUsername || username,
      displayName: displayName,
      url: data.id || data.url,
      avatar: data.icon?.url || data.image?.url,
      header: data.image?.url,
      note: stripHtml(data.summary || ''),
      noteHtml: data.summary,
      instance: instance,
      title: `${displayName} - Fediverse Profile`,
      description: truncateText(stripHtml(data.summary || ''), 200) || `Follow ${displayName} on the Fediverse`,
      thumbnail: data.icon?.url || data.image?.url
    };
  }

  return null;
}

/**
 * Parse media attachments from Mastodon API format
 */
function parseMediaAttachments(attachments) {
  if (!attachments || !Array.isArray(attachments)) {
    return [];
  }

  return attachments.map(media => ({
    type: media.type,
    url: media.url,
    previewUrl: media.preview_url,
    description: media.description || '',
    meta: media.meta
  }));
}

/**
 * Parse media attachments from ActivityPub format
 */
function parseActivityPubMedia(attachments) {
  if (!attachments || !Array.isArray(attachments)) {
    return [];
  }

  return attachments.map(media => ({
    type: media.mediaType?.startsWith('image') ? 'image' : media.mediaType?.startsWith('video') ? 'video' : 'unknown',
    url: media.url,
    previewUrl: media.url,
    description: media.name || '',
  }));
}

/**
 * Parse media attachments from Misskey/Firefish/Sharkey format
 */
function parseMisskeyMedia(files) {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map(file => ({
    type: file.type?.startsWith('image') ? 'image' : file.type?.startsWith('video') ? 'video' : 'unknown',
    url: file.url,
    previewUrl: file.thumbnailUrl || file.url,
    description: file.comment || file.name || '',
  }));
}

/**
 * Generate a title for a post
 */
function generatePostTitle(data) {
  const author = data.account?.display_name || data.account?.username || 'Someone';
  const instance = data.account?.acct?.split('@')[1] || '';
  const content = stripHtml(data.content || '');
  const preview = truncateText(content, 60);

  if (preview) {
    return `${author} on ${instance || 'Fediverse'}: "${preview}"`;
  }

  return `Post by ${author} on ${instance || 'Fediverse'}`;
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

module.exports = {
  fetchFediverseContent,
  fetchPost,
  fetchProfile,
  // Internal functions exported for testing
  parsePostData,
  parseProfileData,
  stripHtml,
  truncateText,
  parseMediaAttachments,
  parseActivityPubMedia,
  parseMisskeyMedia
};
