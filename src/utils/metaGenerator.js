/**
 * Generate meta tags for Open Graph, Twitter Card, and oEmbed
 */
function generateMetaTags(content, baseUrl, path) {
  const vxfediUrl = `${baseUrl}${path}`;
  const oembedUrl = `${baseUrl}/oembed?url=${encodeURIComponent(vxfediUrl)}`;

  const metaTags = [];

  // Basic HTML meta tags
  metaTags.push({ name: 'description', content: content.description || 'Fediverse content' });

  if (content.type === 'post') {
    // Open Graph meta tags for posts
    metaTags.push({ property: 'og:type', content: 'article' });
    metaTags.push({ property: 'og:title', content: escapeHtml(content.title) });
    metaTags.push({ property: 'og:description', content: escapeHtml(content.description) });
    metaTags.push({ property: 'og:url', content: content.url });
    metaTags.push({ property: 'og:site_name', content: 'vxfedi' });

    // Author information
    if (content.author) {
      metaTags.push({ property: 'article:author', content: content.authorUrl || '' });
    }

    // Published time
    if (content.createdAt) {
      metaTags.push({ property: 'article:published_time', content: content.createdAt });
    }

    // Media attachments
    if (content.mediaAttachments && content.mediaAttachments.length > 0) {
      const firstMedia = content.mediaAttachments[0];

      if (firstMedia.type === 'image') {
        metaTags.push({ property: 'og:image', content: firstMedia.url });
        metaTags.push({ property: 'og:image:alt', content: escapeHtml(firstMedia.description || 'Image') });

        if (firstMedia.meta?.original) {
          metaTags.push({ property: 'og:image:width', content: firstMedia.meta.original.width || '1200' });
          metaTags.push({ property: 'og:image:height', content: firstMedia.meta.original.height || '630' });
        }
      } else if (firstMedia.type === 'video' || firstMedia.type === 'gifv') {
        metaTags.push({ property: 'og:video', content: firstMedia.url });
        metaTags.push({ property: 'og:image', content: firstMedia.previewUrl || firstMedia.url });
      }
    } else if (content.authorAvatar) {
      // Fallback to author avatar if no media
      metaTags.push({ property: 'og:image', content: content.authorAvatar });
      metaTags.push({ property: 'og:image:alt', content: `${content.author}'s avatar` });
    }

    // Twitter Card meta tags for posts
    if (content.mediaAttachments && content.mediaAttachments.length > 0) {
      const firstMedia = content.mediaAttachments[0];
      if (firstMedia.type === 'image') {
        metaTags.push({ name: 'twitter:card', content: 'summary_large_image' });
        metaTags.push({ name: 'twitter:image', content: firstMedia.url });
        metaTags.push({ name: 'twitter:image:alt', content: escapeHtml(firstMedia.description || 'Image') });
      } else {
        metaTags.push({ name: 'twitter:card', content: 'player' });
        metaTags.push({ name: 'twitter:player', content: firstMedia.url });
      }
    } else {
      metaTags.push({ name: 'twitter:card', content: 'summary' });
    }

    metaTags.push({ name: 'twitter:title', content: escapeHtml(content.title) });
    metaTags.push({ name: 'twitter:description', content: escapeHtml(content.description) });

    if (content.author && content.authorUsername) {
      metaTags.push({ name: 'twitter:creator', content: `@${content.authorUsername}` });
    }
  } else if (content.type === 'profile') {
    // Open Graph meta tags for profiles
    metaTags.push({ property: 'og:type', content: 'profile' });
    metaTags.push({ property: 'og:title', content: escapeHtml(content.title) });
    metaTags.push({ property: 'og:description', content: escapeHtml(content.description) });
    metaTags.push({ property: 'og:url', content: content.url });
    metaTags.push({ property: 'og:site_name', content: 'vxfedi' });

    // Profile information
    if (content.displayName) {
      metaTags.push({ property: 'profile:username', content: content.username });
    }

    // Avatar/Header image
    if (content.header) {
      metaTags.push({ property: 'og:image', content: content.header });
      metaTags.push({ property: 'og:image:alt', content: `${content.displayName}'s header image` });
    } else if (content.avatar) {
      metaTags.push({ property: 'og:image', content: content.avatar });
      metaTags.push({ property: 'og:image:alt', content: `${content.displayName}'s avatar` });
    }

    // Twitter Card meta tags for profiles
    metaTags.push({ name: 'twitter:card', content: 'summary' });
    metaTags.push({ name: 'twitter:title', content: escapeHtml(content.title) });
    metaTags.push({ name: 'twitter:description', content: escapeHtml(content.description) });

    if (content.avatar) {
      metaTags.push({ name: 'twitter:image', content: content.avatar });
      metaTags.push({ name: 'twitter:image:alt', content: `${content.displayName}'s avatar` });
    }
  }

  // Theme color
  metaTags.push({ name: 'theme-color', content: '#6364FF' });

  // oEmbed link
  metaTags.push({
    tag: 'link',
    rel: 'alternate',
    type: 'application/json+oembed',
    href: oembedUrl,
    title: content.title
  });

  return metaTags;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format meta tags as HTML
 */
function formatMetaTags(metaTags) {
  return metaTags.map(tag => {
    if (tag.tag === 'link') {
      const attrs = Object.entries(tag)
        .filter(([key]) => key !== 'tag')
        .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
        .join(' ');
      return `<link ${attrs}>`;
    } else if (tag.property) {
      return `<meta property="${tag.property}" content="${tag.content}">`;
    } else {
      return `<meta name="${tag.name}" content="${tag.content}">`;
    }
  }).join('\n    ');
}

module.exports = {
  generateMetaTags,
  formatMetaTags,
  escapeHtml
};
