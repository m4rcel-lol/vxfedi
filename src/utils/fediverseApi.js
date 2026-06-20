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
    // Link-aggregator / video platforms (Lemmy, PieFed, Mbin/Kbin, PeerTube)
    // use bespoke APIs and are routed via the `platform`/`subtype` hints.
    if (parsed.platform) {
      return await fetchPlatformContent(parsed);
    }

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

/* ------------------------------------------------------------------ *
 *  Link-aggregator & video platforms                                 *
 *  Lemmy / PieFed (Threadiverse), Mbin / Kbin, PeerTube              *
 * ------------------------------------------------------------------ */

/**
 * Simple JSON GET helper used by the platform-specific fetchers.
 * Returns the parsed body, or null on any error / non-2xx response.
 */
async function getJson(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      timeout: REQUEST_TIMEOUT,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300
    });
    return response.data || null;
  } catch (error) {
    return null;
  }
}

/**
 * Dispatch a `platform`-tagged URL to the right API(s).
 *
 * Some URL shapes are shared between platforms (e.g. `/c/x` is a Lemmy
 * community AND a PeerTube channel, `/u/x` is a Lemmy/Mbin user), so each
 * resource maps to an ordered list of candidate fetchers and the first one
 * that returns data wins.
 */
async function fetchPlatformContent(parsed) {
  const { instance, username, postId, resourceType, subtype } = parsed;
  const attempts = [];

  if (resourceType === 'post') {
    if (subtype === 'comment') {
      attempts.push(() => fetchLemmyComment(instance, postId));
    } else if (subtype === 'thread') {
      attempts.push(() => fetchMbinEntry(instance, postId));
    } else if (subtype === 'video') {
      attempts.push(() => fetchPeertubeVideo(instance, postId));
    } else {
      attempts.push(() => fetchLemmyPost(instance, postId));
    }
  } else if (resourceType === 'profile') {
    if (subtype === 'community') {
      attempts.push(() => fetchLemmyCommunity(instance, username));
      attempts.push(() => fetchPeertubeActor(instance, username, 'channel'));
    } else if (subtype === 'user') {
      attempts.push(() => fetchLemmyUser(instance, username));
      attempts.push(() => fetchMbinUser(instance, username));
      attempts.push(() => fetchPeertubeActor(instance, username, 'account'));
    } else if (subtype === 'magazine') {
      attempts.push(() => fetchMbinMagazine(instance, username));
      attempts.push(() => fetchLemmyCommunity(instance, username));
    } else if (subtype === 'channel') {
      attempts.push(() => fetchPeertubeActor(instance, username, 'channel'));
    } else if (subtype === 'account') {
      attempts.push(() => fetchPeertubeActor(instance, username, 'account'));
      attempts.push(() => fetchMbinUser(instance, username));
      attempts.push(() => fetchLemmyUser(instance, username));
    }
  }

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) return result;
    } catch (error) {
      continue;
    }
  }

  return null;
}

/* ----------------------------- Lemmy / PieFed ----------------------------- */

async function fetchLemmyPost(instance, id) {
  let data = await getJson(`https://${instance}/api/v3/post?id=${id}`);
  let view = data && data.post_view;
  if (!view) {
    // PieFed exposes a Lemmy-compatible API under /api/alpha
    data = await getJson(`https://${instance}/api/alpha/post?id=${id}`);
    view = data && data.post_view;
  }
  return view ? parseLemmyPost(view, instance) : null;
}

async function fetchLemmyComment(instance, id) {
  let data = await getJson(`https://${instance}/api/v3/comment?id=${id}`);
  let view = data && data.comment_view;
  if (!view) {
    data = await getJson(`https://${instance}/api/alpha/comment?id=${id}`);
    view = data && data.comment_view;
  }
  return view ? parseLemmyComment(view, instance) : null;
}

async function fetchLemmyCommunity(instance, name) {
  const q = encodeURIComponent(name);
  let data = await getJson(`https://${instance}/api/v3/community?name=${q}`);
  let view = data && data.community_view;
  if (!view) {
    data = await getJson(`https://${instance}/api/alpha/community?name=${q}`);
    view = data && data.community_view;
  }
  return view ? parseLemmyCommunity(view, instance) : null;
}

async function fetchLemmyUser(instance, name) {
  const q = encodeURIComponent(name);
  let data = await getJson(`https://${instance}/api/v3/user?username=${q}`);
  let view = data && data.person_view;
  if (!view) {
    data = await getJson(`https://${instance}/api/alpha/user?username=${q}`);
    view = data && data.person_view;
  }
  return view ? parseLemmyUser(view, instance) : null;
}

function parseLemmyPost(view, instance) {
  const post = view.post || {};
  const creator = view.creator || {};
  const community = view.community || {};
  const counts = view.counts || {};
  const body = stripMarkdown(post.body || '');
  const thumb = post.thumbnail_url || null;
  const author = creator.display_name || creator.name || 'Unknown';
  const communityName = community.title || community.name || instance;

  const mediaAttachments = thumb
    ? [{ type: 'image', url: thumb, previewUrl: thumb, description: post.name || '' }]
    : [];

  return {
    type: 'post',
    id: post.id,
    url: post.ap_id || `https://${instance}/post/${post.id}`,
    content: body,
    contentHtml: body,
    author,
    authorUsername: creator.name,
    authorUrl: creator.actor_id,
    authorAvatar: creator.avatar,
    createdAt: post.published,
    repliesCount: counts.comments || 0,
    reblogsCount: 0,
    favouritesCount: counts.score || counts.upvotes || 0,
    mediaAttachments,
    sensitive: post.nsfw || false,
    spoilerText: '',
    instance,
    title: post.name || `Post by ${author} in ${communityName}`,
    description: truncateText(
      body || post.embed_description || post.url || `Posted in ${communityName} on ${instance}`,
      200
    ),
    thumbnail: thumb || creator.avatar
  };
}

function parseLemmyComment(view, instance) {
  const comment = view.comment || {};
  const creator = view.creator || {};
  const post = view.post || {};
  const counts = view.counts || {};
  const text = stripMarkdown(comment.content || '');
  const author = creator.display_name || creator.name || 'Unknown';

  return {
    type: 'post',
    id: comment.id,
    url: comment.ap_id || `https://${instance}/comment/${comment.id}`,
    content: text,
    contentHtml: text,
    author,
    authorUsername: creator.name,
    authorUrl: creator.actor_id,
    authorAvatar: creator.avatar,
    createdAt: comment.published,
    repliesCount: counts.child_count || 0,
    reblogsCount: 0,
    favouritesCount: counts.score || counts.upvotes || 0,
    mediaAttachments: [],
    sensitive: false,
    spoilerText: '',
    instance,
    title: `${author} commented on "${truncateText(post.name || 'a post', 60)}"`,
    description: truncateText(text, 200) || `A comment on ${instance}`,
    thumbnail: creator.avatar
  };
}

function parseLemmyCommunity(view, instance) {
  const community = view.community || {};
  const counts = view.counts || {};
  const note = stripMarkdown(community.description || '');

  return {
    type: 'profile',
    id: community.id,
    username: community.name,
    displayName: community.title || community.name,
    acct: community.name,
    url: community.actor_id || `https://${instance}/c/${community.name}`,
    avatar: community.icon,
    header: community.banner,
    note,
    noteHtml: community.description,
    followersCount: counts.subscribers || 0,
    followingCount: 0,
    statusesCount: counts.posts || 0,
    bot: false,
    locked: community.posting_restricted_to_mods || false,
    createdAt: community.published,
    instance,
    title: `${community.title || community.name} — Community on ${instance}`,
    description: truncateText(note, 200) || `A community on ${instance} (Lemmy)`,
    thumbnail: community.icon || community.banner
  };
}

function parseLemmyUser(view, instance) {
  const person = view.person || {};
  const counts = view.counts || {};
  const note = stripMarkdown(person.bio || '');
  const displayName = person.display_name || person.name;

  return {
    type: 'profile',
    id: person.id,
    username: person.name,
    displayName,
    acct: person.name,
    url: person.actor_id || `https://${instance}/u/${person.name}`,
    avatar: person.avatar,
    header: person.banner,
    note,
    noteHtml: person.bio,
    followersCount: 0,
    followingCount: 0,
    statusesCount: (counts.post_count || 0) + (counts.comment_count || 0),
    bot: person.bot_account || false,
    locked: false,
    createdAt: person.published,
    instance,
    title: `${displayName} (@${person.name}@${instance}) — Fediverse Profile`,
    description: truncateText(note, 200) || `Follow ${displayName} on ${instance} (Lemmy)`,
    thumbnail: person.avatar || person.banner
  };
}

/* -------------------------------- PeerTube -------------------------------- */

async function fetchPeertubeVideo(instance, id) {
  const data = await getJson(`https://${instance}/api/v1/videos/${encodeURIComponent(id)}`);
  if (data && data.name && (data.account || data.channel)) {
    return parsePeertubeVideo(data, instance);
  }
  return null;
}

async function fetchPeertubeActor(instance, handle, kind) {
  const primary = kind === 'channel' ? 'video-channels' : 'accounts';
  const secondary = kind === 'channel' ? 'accounts' : 'video-channels';
  const q = encodeURIComponent(handle);

  let data = await getJson(`https://${instance}/api/v1/${primary}/${q}`);
  if (!(data && (data.name || data.displayName))) {
    data = await getJson(`https://${instance}/api/v1/${secondary}/${q}`);
  }
  return (data && (data.name || data.displayName)) ? parsePeertubeActor(data, instance, kind) : null;
}

/**
 * Resolve a usable avatar/banner URL from a PeerTube actor image array.
 * Each entry has either an absolute `fileUrl` or an instance-relative `path`.
 */
function peertubeImage(images, base) {
  const list = Array.isArray(images) ? images : (images ? [images] : []);
  if (!list.length) return null;
  // Prefer a small-to-medium size for previews, otherwise take the first.
  const pick = list.find((img) => img.width && img.width <= 150) || list[list.length - 1];
  return pick.fileUrl || (pick.path ? `${base}${pick.path}` : null);
}

function parsePeertubeVideo(data, instance) {
  const base = `https://${instance}`;
  const account = data.account || {};
  const channel = data.channel || {};
  const thumb = data.previewPath
    ? `${base}${data.previewPath}`
    : (data.thumbnailPath ? `${base}${data.thumbnailPath}` : null);
  const embed = data.embedPath ? `${base}${data.embedPath}` : null;
  const avatar = peertubeImage(account.avatars || account.avatar, base);
  const channelName = channel.displayName || account.displayName || account.name || 'PeerTube';

  const mediaAttachments = [];
  if (embed) {
    mediaAttachments.push({
      type: 'video',
      url: embed,
      previewUrl: thumb || avatar,
      description: data.name || '',
      isEmbed: true,
      width: 1280,
      height: 720
    });
  } else if (thumb) {
    mediaAttachments.push({ type: 'image', url: thumb, previewUrl: thumb, description: data.name || '' });
  }

  return {
    type: 'post',
    id: data.uuid || data.shortUUID,
    url: data.url || `${base}/w/${data.shortUUID || data.uuid}`,
    content: stripMarkdown(data.description || ''),
    contentHtml: data.description,
    author: account.displayName || account.name || channelName,
    authorUsername: account.name,
    authorUrl: account.url,
    authorAvatar: avatar,
    createdAt: data.publishedAt || data.createdAt,
    repliesCount: data.comments || 0,
    reblogsCount: data.views || 0,
    favouritesCount: data.likes || 0,
    mediaAttachments,
    sensitive: data.nsfw || false,
    spoilerText: '',
    instance,
    title: `${data.name} — ${channelName} on ${instance}`,
    description: truncateText(stripMarkdown(data.description || '') || `Video on ${instance} (PeerTube)`, 200),
    thumbnail: thumb || avatar,
    duration: data.duration
  };
}

function parsePeertubeActor(data, instance, kind) {
  const base = `https://${instance}`;
  const avatar = peertubeImage(data.avatars || data.avatar, base);
  const banner = peertubeImage(data.banners || data.banner, base);
  const name = data.name;
  const displayName = data.displayName || name;
  const note = stripMarkdown(data.description || '');
  const label = kind === 'channel' ? 'Channel' : 'Account';

  return {
    type: 'profile',
    id: data.id,
    username: name,
    displayName,
    acct: name,
    url: data.url || `${base}/a/${name}`,
    avatar,
    header: banner,
    note,
    noteHtml: data.description,
    followersCount: data.followersCount || 0,
    followingCount: data.followingCount || 0,
    statusesCount: 0,
    bot: false,
    locked: false,
    createdAt: data.createdAt,
    instance,
    title: `${displayName} — PeerTube ${label} on ${instance}`,
    description: truncateText(note, 200) || `${displayName} on ${instance} (PeerTube)`,
    thumbnail: avatar || banner
  };
}

/* ------------------------------- Mbin / Kbin ------------------------------ */

async function fetchMbinEntry(instance, id) {
  const data = await getJson(`https://${instance}/api/entry/${encodeURIComponent(id)}`);
  return (data && data.entryId) ? parseMbinEntry(data, instance) : null;
}

async function fetchMbinMagazine(instance, name) {
  let data = await getJson(`https://${instance}/api/magazine/name/${encodeURIComponent(name)}`);
  if (!(data && data.name)) {
    // Numeric-id form: /api/magazine/{id}
    data = await getJson(`https://${instance}/api/magazine/${encodeURIComponent(name)}`);
  }
  return (data && data.name) ? parseMbinMagazine(data, instance) : null;
}

async function fetchMbinUser(instance, name) {
  const data = await getJson(`https://${instance}/api/users/name/${encodeURIComponent(name)}`);
  return (data && data.username) ? parseMbinUser(data, instance) : null;
}

/** Resolve a usable URL from an Mbin image object (or string). */
function mbinImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.storageUrl || image.sourceUrl || null;
}

function parseMbinEntry(data, instance) {
  const base = `https://${instance}`;
  const user = data.user || {};
  const magazine = data.magazine || {};
  const image = mbinImage(data.image);
  const avatar = mbinImage(user.avatar);
  const body = stripMarkdown(data.body || '');
  const apId = typeof data.apId === 'string' && data.apId.startsWith('http') ? data.apId : null;

  const mediaAttachments = image
    ? [{ type: 'image', url: image, previewUrl: image, description: data.title || '' }]
    : [];

  return {
    type: 'post',
    id: data.entryId,
    url: apId || `${base}/m/${magazine.name}/t/${data.entryId}`,
    content: body,
    contentHtml: body,
    author: user.username,
    authorUsername: user.username,
    authorUrl: user.apProfileId || (user.username ? `${base}/u/${user.username}` : null),
    authorAvatar: avatar,
    createdAt: data.createdAt,
    repliesCount: data.numComments || 0,
    reblogsCount: 0,
    favouritesCount: data.favourites || data.uv || 0,
    mediaAttachments,
    sensitive: data.isAdult || false,
    spoilerText: '',
    instance,
    title: data.title || `Thread by ${user.username} on ${instance}`,
    description: truncateText(
      body || data.url || `Posted in ${magazine.name || instance} (Mbin)`,
      200
    ),
    thumbnail: image || avatar
  };
}

function parseMbinMagazine(data, instance) {
  const base = `https://${instance}`;
  const icon = mbinImage(data.icon);
  const banner = mbinImage(data.banner);
  const note = stripMarkdown(data.description || '');

  return {
    type: 'profile',
    id: data.magazineId,
    username: data.name,
    displayName: data.title || data.name,
    acct: data.name,
    url: `${base}/m/${data.name}`,
    avatar: icon,
    header: banner,
    note,
    noteHtml: data.description,
    followersCount: data.subscriptionsCount || 0,
    followingCount: 0,
    statusesCount: data.entryCount || 0,
    bot: false,
    locked: false,
    instance,
    title: `${data.title || data.name} — Magazine on ${instance}`,
    description: truncateText(note, 200) || `A magazine on ${instance} (Mbin)`,
    thumbnail: icon || banner
  };
}

function parseMbinUser(data, instance) {
  const base = `https://${instance}`;
  const avatar = mbinImage(data.avatar);
  const cover = mbinImage(data.cover);
  const note = stripMarkdown(data.about || '');

  return {
    type: 'profile',
    id: data.userId,
    username: data.username,
    displayName: data.username,
    acct: data.username,
    url: data.apProfileId || `${base}/u/${data.username}`,
    avatar,
    header: cover,
    note,
    noteHtml: data.about,
    followersCount: data.followersCount || 0,
    followingCount: 0,
    statusesCount: 0,
    bot: data.isBot || false,
    locked: false,
    createdAt: data.createdAt,
    instance,
    title: `${data.username} (@${data.username}@${instance}) — Fediverse Profile`,
    description: truncateText(note, 200) || `Follow ${data.username} on ${instance} (Mbin)`,
    thumbnail: avatar || cover
  };
}

/**
 * Strip a useful plain-text excerpt out of Markdown (Lemmy / Mbin bodies).
 */
function stripMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')   // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')     // links -> link text
    .replace(/^\s{0,3}>+\s?/gm, '')              // blockquotes
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')          // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2')          // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')             // italics
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')       // inline / fenced code
    .replace(/^\s{0,3}[-*+]\s+/gm, '• ')         // list bullets
    .replace(/\r\n/g, '\n')
    .trim();
}

module.exports = {
  fetchFediverseContent,
  fetchPost,
  fetchProfile,
  // Internal functions exported for testing
  parsePostData,
  parseProfileData,
  stripHtml,
  stripMarkdown,
  truncateText,
  parseMediaAttachments,
  parseActivityPubMedia,
  parseMisskeyMedia,
  // Link-aggregator / video platform parsers
  parseLemmyPost,
  parseLemmyComment,
  parseLemmyCommunity,
  parseLemmyUser,
  parsePeertubeVideo,
  parsePeertubeActor,
  parseMbinEntry,
  parseMbinMagazine,
  parseMbinUser
};
