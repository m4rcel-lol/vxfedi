/**
 * Parse vxfedi URL to extract instance and resource information
 *
 * Supported formats:
 * - /instance.tld/@username/postid (post - Mastodon)
 * - /instance.tld/@username/statuses/postid (post - GoToSocial)
 * - /instance.tld/@username (profile - Mastodon/GoToSocial)
 * - /instance.tld/users/username/statuses/postid (post - ActivityPub)
 * - /instance.tld/users/username (profile - ActivityPub)
 * - /instance.tld/notice/postid (post - Pleroma/Akkoma)
 * - /instance.tld/objects/uuid (post - Pleroma/Akkoma ActivityPub)
 * - /instance.tld/notes/noteid (post - Misskey/Firefish/Sharkey)
 * - /instance.tld/p/username/postid (post - Pixelfed)
 * - /instance.tld/post/id (post - Lemmy/PieFed)
 * - /instance.tld/comment/id (post - Lemmy/PieFed comment)
 * - /instance.tld/c/community (community - Lemmy/PieFed, or channel - PeerTube)
 * - /instance.tld/u/username (profile - Lemmy/PieFed/Mbin)
 * - /instance.tld/m/magazine (magazine - Mbin/Kbin)
 * - /instance.tld/m/magazine/t/id (thread - Mbin/Kbin)
 * - /instance.tld/w/shortid (video - PeerTube)
 * - /instance.tld/videos/watch/uuid (video - PeerTube)
 * - /instance.tld/a/username (account - PeerTube)
 * - /instance.tld/video-channels/name (channel - PeerTube)
 *
 * The optional `platform` and `subtype` fields are a routing hint for the
 * API layer. They are only present for platforms whose URL scheme is not
 * already covered by the generic ActivityPub/Mastodon handling above, so
 * that the classic formats keep their original (untyped) return shape.
 */
function parseVxUrl(path) {
  // Remove leading/trailing slashes
  const cleanPath = path.replace(/^\/+|\/+$/g, '');

  if (!cleanPath) {
    return null;
  }

  const parts = cleanPath.split('/');

  if (parts.length < 2) {
    return null;
  }

  const instance = parts[0];

  // Validate instance format (should be a domain)
  if (!instance.includes('.') || instance.includes('@')) {
    return null;
  }

  // Parse different URL formats
  let resourceType = null;
  let username = null;
  let postId = null;
  let originalUrl = null;
  // Routing hints for non-ActivityPub platforms (Lemmy, PeerTube, Mbin...)
  let platform = null;
  let subtype = null;

  // Format 1: /@username or /@username/postid or /@username/statuses/postid
  if (parts[1].startsWith('@')) {
    username = parts[1].substring(1); // Remove @ prefix

    if (parts.length === 2) {
      // Profile: /instance.tld/@username
      resourceType = 'profile';
      originalUrl = `https://${instance}/@${username}`;
    } else if (parts.length === 3) {
      // Post: /instance.tld/@username/postid (Mastodon)
      resourceType = 'post';
      postId = parts[2];
      originalUrl = `https://${instance}/@${username}/${postId}`;
    } else if (parts.length === 4 && parts[2] === 'statuses') {
      // Post (GoToSocial): /instance.tld/@username/statuses/postid
      resourceType = 'post';
      postId = parts[3];
      originalUrl = `https://${instance}/@${username}/statuses/${postId}`;
    } else {
      return null;
    }
  }
  // Format 2: /users/username or /users/username/statuses/postid
  else if (parts[1] === 'users' && parts.length >= 3) {
    username = parts[2];

    if (parts.length === 3) {
      // Profile: /instance.tld/users/username
      resourceType = 'profile';
      originalUrl = `https://${instance}/users/${username}`;
    } else if (parts.length === 5 && parts[3] === 'statuses') {
      // Post: /instance.tld/users/username/statuses/postid
      resourceType = 'post';
      postId = parts[4];
      originalUrl = `https://${instance}/users/${username}/statuses/${postId}`;
    } else {
      return null;
    }
  }
  // Format 3: /notice/postid (Pleroma/Akkoma)
  else if (parts[1] === 'notice' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    originalUrl = `https://${instance}/notice/${postId}`;
  }
  // Format 4: /objects/uuid (Pleroma/Akkoma ActivityPub)
  else if (parts[1] === 'objects' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    originalUrl = `https://${instance}/objects/${postId}`;
  }
  // Format 5: /notes/noteid (Misskey/Firefish/Sharkey)
  else if (parts[1] === 'notes' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    originalUrl = `https://${instance}/notes/${postId}`;
  }
  // Format 6: /p/username/postid (Pixelfed)
  else if (parts[1] === 'p' && parts.length === 4) {
    resourceType = 'post';
    username = parts[2];
    postId = parts[3];
    originalUrl = `https://${instance}/p/${username}/${postId}`;
  }
  // Format 7: /post/id (Lemmy/PieFed link-aggregator post)
  else if (parts[1] === 'post' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    platform = 'lemmy';
    subtype = 'post';
    originalUrl = `https://${instance}/post/${postId}`;
  }
  // Format 8: /comment/id (Lemmy/PieFed comment)
  else if (parts[1] === 'comment' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    platform = 'lemmy';
    subtype = 'comment';
    originalUrl = `https://${instance}/comment/${postId}`;
  }
  // Format 9: /c/community (Lemmy/PieFed community, or PeerTube channel)
  else if (parts[1] === 'c' && parts.length === 3) {
    resourceType = 'profile';
    username = parts[2];
    platform = 'lemmy';
    subtype = 'community';
    originalUrl = `https://${instance}/c/${username}`;
  }
  // Format 10: /u/username (Lemmy/PieFed/Mbin user)
  else if (parts[1] === 'u' && parts.length === 3) {
    resourceType = 'profile';
    username = parts[2];
    platform = 'lemmy';
    subtype = 'user';
    originalUrl = `https://${instance}/u/${username}`;
  }
  // Format 11: /m/magazine or /m/magazine/t/id (Mbin/Kbin)
  else if (parts[1] === 'm' && (parts.length === 3 || (parts.length === 5 && parts[3] === 't'))) {
    platform = 'mbin';
    username = parts[2];
    if (parts.length === 3) {
      resourceType = 'profile';
      subtype = 'magazine';
      originalUrl = `https://${instance}/m/${username}`;
    } else {
      resourceType = 'post';
      subtype = 'thread';
      postId = parts[4];
      originalUrl = `https://${instance}/m/${username}/t/${postId}`;
    }
  }
  // Format 12: /w/shortid (PeerTube video, short form)
  else if (parts[1] === 'w' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    platform = 'peertube';
    subtype = 'video';
    originalUrl = `https://${instance}/w/${postId}`;
  }
  // Format 13: /videos/watch/uuid (PeerTube video, canonical form)
  else if (parts[1] === 'videos' && parts.length === 4 && parts[2] === 'watch') {
    resourceType = 'post';
    postId = parts[3];
    platform = 'peertube';
    subtype = 'video';
    originalUrl = `https://${instance}/videos/watch/${postId}`;
  }
  // Format 14: /a/username (PeerTube account)
  else if (parts[1] === 'a' && parts.length === 3) {
    resourceType = 'profile';
    username = parts[2];
    platform = 'peertube';
    subtype = 'account';
    originalUrl = `https://${instance}/a/${username}`;
  }
  // Format 15: /video-channels/name (PeerTube channel)
  else if (parts[1] === 'video-channels' && parts.length === 3) {
    resourceType = 'profile';
    username = parts[2];
    platform = 'peertube';
    subtype = 'channel';
    originalUrl = `https://${instance}/video-channels/${username}`;
  }
  else {
    return null;
  }

  const result = {
    instance,
    username,
    postId,
    resourceType,
    originalUrl
  };

  // Only attach routing hints for the newer platforms so the classic
  // ActivityPub formats keep their original return shape.
  if (platform) {
    result.platform = platform;
    result.subtype = subtype;
  }

  return result;
}

module.exports = { parseVxUrl };
