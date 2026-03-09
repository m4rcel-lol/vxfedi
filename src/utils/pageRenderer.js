const { formatMetaTags, escapeHtml } = require('./metaGenerator');

/**
 * Render a landing page with content and meta tags
 */
function renderLandingPage(content, metaTags, baseUrl) {
  const metaTagsHtml = formatMetaTags(metaTags);

  if (content.type === 'post') {
    return renderPostPage(content, metaTagsHtml, baseUrl);
  } else if (content.type === 'profile') {
    return renderProfilePage(content, metaTagsHtml, baseUrl);
  }

  return renderErrorPage('Unknown content type', baseUrl);
}

/**
 * Render a post page
 */
function renderPostPage(content, metaTagsHtml, baseUrl) {
  const mediaHtml = renderMediaAttachments(content.mediaAttachments);
  const stats = `${content.repliesCount || 0} replies · ${content.reblogsCount || 0} boosts · ${content.favouritesCount || 0} favorites`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(content.title)}</title>
    ${metaTagsHtml}
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #2a2a2a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            padding: 20px;
            border-bottom: 1px solid #3a3a3a;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #6364FF;
        }
        .author-info {
            flex: 1;
        }
        .author-name {
            font-weight: 600;
            font-size: 16px;
            color: #fff;
        }
        .author-handle {
            font-size: 14px;
            color: #888;
        }
        .content {
            padding: 20px;
        }
        .post-text {
            font-size: 16px;
            margin-bottom: 16px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .media-container {
            margin: 16px 0;
            border-radius: 8px;
            overflow: hidden;
        }
        .media-container img,
        .media-container video {
            width: 100%;
            display: block;
        }
        .media-description {
            font-size: 13px;
            color: #888;
            font-style: italic;
            margin-top: 8px;
            padding: 8px;
            background: #1a1a1a;
            border-radius: 4px;
        }
        .stats {
            padding: 16px 20px;
            border-top: 1px solid #3a3a3a;
            font-size: 14px;
            color: #888;
        }
        .footer {
            padding: 20px;
            text-align: center;
            border-top: 1px solid #3a3a3a;
            background: #222;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #6364FF;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #5254dd;
        }
        .branding {
            margin-top: 12px;
            font-size: 12px;
            color: #666;
        }
        .sensitive-warning {
            background: #ff6b6b;
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${content.authorAvatar ? `<img src="${escapeHtml(content.authorAvatar)}" alt="${escapeHtml(content.author)}" class="avatar">` : '<div class="avatar"></div>'}
            <div class="author-info">
                <div class="author-name">${escapeHtml(content.author || 'Unknown')}</div>
                <div class="author-handle">@${escapeHtml(content.authorUsername || 'unknown')} · ${escapeHtml(content.instance)}</div>
            </div>
        </div>
        <div class="content">
            ${content.sensitive && content.spoilerText ? `<div class="sensitive-warning">⚠️ ${escapeHtml(content.spoilerText)}</div>` : ''}
            ${content.content ? `<div class="post-text">${escapeHtml(content.content)}</div>` : ''}
            ${mediaHtml}
        </div>
        <div class="stats">${stats}</div>
        <div class="footer">
            <a href="${escapeHtml(content.url)}" class="btn">View Original Post</a>
            <div class="branding">Enhanced by vxfedi 💜</div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Render a profile page
 */
function renderProfilePage(content, metaTagsHtml, baseUrl) {
  const stats = `${content.statusesCount || 0} posts · ${content.followersCount || 0} followers · ${content.followingCount || 0} following`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(content.title)}</title>
    ${metaTagsHtml}
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #2a2a2a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #6364FF 0%, #5254dd 100%);
            object-fit: cover;
        }
        .profile-info {
            padding: 20px;
            position: relative;
        }
        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #2a2a2a;
            margin-top: -50px;
            background: #6364FF;
        }
        .display-name {
            font-size: 24px;
            font-weight: 700;
            margin-top: 12px;
            color: #fff;
        }
        .username {
            font-size: 16px;
            color: #888;
            margin-bottom: 16px;
        }
        .bio {
            font-size: 15px;
            margin-bottom: 16px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .stats {
            padding: 16px 0;
            font-size: 14px;
            color: #888;
            border-top: 1px solid #3a3a3a;
            border-bottom: 1px solid #3a3a3a;
            margin: 16px 0;
        }
        .badges {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
        }
        .badge {
            background: #3a3a3a;
            color: #ccc;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .footer {
            padding: 20px;
            text-align: center;
            background: #222;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #6364FF;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #5254dd;
        }
        .branding {
            margin-top: 12px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content.header ? `<img src="${escapeHtml(content.header)}" alt="Header" class="header-image">` : '<div class="header-image"></div>'}
        <div class="profile-info">
            ${content.avatar ? `<img src="${escapeHtml(content.avatar)}" alt="${escapeHtml(content.displayName)}" class="avatar">` : '<div class="avatar"></div>'}
            <div class="display-name">${escapeHtml(content.displayName || content.username)}</div>
            <div class="username">@${escapeHtml(content.acct || content.username)}@${escapeHtml(content.instance)}</div>
            ${content.note ? `<div class="bio">${escapeHtml(content.note)}</div>` : ''}
            <div class="stats">${stats}</div>
            <div class="badges">
                ${content.bot ? '<span class="badge">🤖 Bot</span>' : ''}
                ${content.locked ? '<span class="badge">🔒 Private</span>' : ''}
            </div>
        </div>
        <div class="footer">
            <a href="${escapeHtml(content.url)}" class="btn">View Profile</a>
            <div class="branding">Enhanced by vxfedi 💜</div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Render media attachments
 */
function renderMediaAttachments(mediaAttachments) {
  if (!mediaAttachments || mediaAttachments.length === 0) {
    return '';
  }

  return mediaAttachments.map(media => {
    let mediaTag = '';

    if (media.type === 'image') {
      mediaTag = `<img src="${escapeHtml(media.url)}" alt="${escapeHtml(media.description || 'Image')}">`;
    } else if (media.type === 'video' || media.type === 'gifv') {
      mediaTag = `<video src="${escapeHtml(media.url)}" controls${media.type === 'gifv' ? ' loop autoplay muted' : ''}>Your browser does not support video.</video>`;
    }

    const descriptionTag = media.description
      ? `<div class="media-description">Alt: ${escapeHtml(media.description)}</div>`
      : '';

    return `<div class="media-container">${mediaTag}${descriptionTag}</div>`;
  }).join('');
}

/**
 * Render an error page
 */
function renderErrorPage(message, baseUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - vxfedi</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        h1 { color: #ff6b6b; font-size: 48px; }
        p { font-size: 18px; margin: 20px 0; }
        a {
            color: #6364FF;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️</h1>
        <p>${escapeHtml(message)}</p>
        <p><a href="${baseUrl}">Go to homepage</a></p>
    </div>
</body>
</html>`;
}

module.exports = {
  renderLandingPage,
  renderPostPage,
  renderProfilePage,
  renderErrorPage
};
