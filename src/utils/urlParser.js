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
  else {
    return null;
  }

  return {
    instance,
    username,
    postId,
    resourceType,
    originalUrl
  };
}

module.exports = { parseVxUrl };
