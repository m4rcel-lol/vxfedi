/**
 * Parse vxfedi URL to extract instance and resource information
 *
 * Supported formats:
 * - /instance.tld/@username/postid (post)
 * - /instance.tld/@username (profile)
 * - /instance.tld/users/username/statuses/postid (alternative post format)
 * - /instance.tld/users/username (alternative profile format)
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

  // Format 1: /@username or /@username/postid
  if (parts[1].startsWith('@')) {
    username = parts[1].substring(1); // Remove @ prefix

    if (parts.length === 2) {
      // Profile: /instance.tld/@username
      resourceType = 'profile';
      originalUrl = `https://${instance}/@${username}`;
    } else if (parts.length === 3) {
      // Post: /instance.tld/@username/postid
      resourceType = 'post';
      postId = parts[2];
      originalUrl = `https://${instance}/@${username}/${postId}`;
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
  // Format 3: Direct status ID (some instances use /instance.tld/@username/statusid or /instance.tld/notice/id)
  else if (parts[1] === 'notice' && parts.length === 3) {
    resourceType = 'post';
    postId = parts[2];
    originalUrl = `https://${instance}/notice/${postId}`;
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
