const assert = require('node:assert');
const { describe, it } = require('node:test');
const {
  parsePostData,
  parseProfileData,
  stripHtml,
  stripMarkdown,
  truncateText,
  parseMediaAttachments,
  parseActivityPubMedia,
  parseMisskeyMedia,
  parseLemmyPost,
  parseLemmyComment,
  parseLemmyCommunity,
  parseLemmyUser,
  parsePeertubeVideo,
  parsePeertubeActor,
  parseMbinEntry,
  parseMbinMagazine,
  parseMbinUser
} = require('../src/utils/fediverseApi');

describe('parsePostData', () => {
  describe('Mastodon/GoToSocial API format', () => {
    it('should parse standard Mastodon post', () => {
      const data = {
        id: '123456',
        url: 'https://mastodon.social/@user/123456',
        content: '<p>Hello World!</p>',
        account: {
          display_name: 'Test User',
          username: 'user',
          acct: 'user',
          url: 'https://mastodon.social/@user',
          avatar: 'https://mastodon.social/avatar.png'
        },
        created_at: '2024-01-01T00:00:00.000Z',
        replies_count: 5,
        reblogs_count: 10,
        favourites_count: 20,
        media_attachments: [],
        sensitive: false,
        spoiler_text: ''
      };

      const result = parsePostData(data, 'mastodon.social', '123456');
      assert.strictEqual(result.type, 'post');
      assert.strictEqual(result.id, '123456');
      assert.strictEqual(result.content, 'Hello World!');
      assert.strictEqual(result.author, 'Test User');
      assert.strictEqual(result.authorUsername, 'user');
      assert.strictEqual(result.repliesCount, 5);
      assert.strictEqual(result.reblogsCount, 10);
      assert.strictEqual(result.favouritesCount, 20);
      assert.strictEqual(result.sensitive, false);
    });

    it('should parse GoToSocial post with ULID', () => {
      const data = {
        id: '01KK9CG9D9WAHQG5R5FXNR90YD',
        url: 'https://social.example.com/@alice/statuses/01KK9CG9D9WAHQG5R5FXNR90YD',
        content: '<p>GoToSocial post</p>',
        account: {
          display_name: 'Alice',
          username: 'alice',
          acct: 'alice',
          url: 'https://social.example.com/@alice',
          avatar: 'https://social.example.com/avatar.png'
        },
        created_at: '2024-06-01T12:00:00.000Z',
        replies_count: 0,
        reblogs_count: 0,
        favourites_count: 0,
        media_attachments: [],
        sensitive: false,
        spoiler_text: ''
      };

      const result = parsePostData(data, 'social.example.com', '01KK9CG9D9WAHQG5R5FXNR90YD');
      assert.strictEqual(result.type, 'post');
      assert.strictEqual(result.id, '01KK9CG9D9WAHQG5R5FXNR90YD');
      assert.strictEqual(result.author, 'Alice');
      assert.strictEqual(result.instance, 'social.example.com');
    });

    it('should handle sensitive post with spoiler text', () => {
      const data = {
        id: '789',
        url: 'https://mastodon.social/@user/789',
        content: '<p>Sensitive content</p>',
        account: { display_name: 'User', username: 'user', acct: 'user' },
        created_at: '2024-01-01T00:00:00.000Z',
        replies_count: 0,
        reblogs_count: 0,
        favourites_count: 0,
        media_attachments: [],
        sensitive: true,
        spoiler_text: 'CW: Spoiler'
      };

      const result = parsePostData(data, 'mastodon.social', '789');
      assert.strictEqual(result.sensitive, true);
      assert.strictEqual(result.spoilerText, 'CW: Spoiler');
    });
  });

  describe('Misskey/Firefish API format', () => {
    it('should parse Misskey note', () => {
      const data = {
        id: 'abc123xyz',
        text: 'Hello from Misskey!',
        user: {
          name: 'Misskey User',
          username: 'mkuser',
          avatarUrl: 'https://misskey.io/avatar.png'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        repliesCount: 2,
        renoteCount: 5,
        reactions: { '👍': 3, '❤️': 2 },
        files: [],
        cw: null
      };

      const result = parsePostData(data, 'misskey.io', 'abc123xyz');
      assert.strictEqual(result.type, 'post');
      assert.strictEqual(result.id, 'abc123xyz');
      assert.strictEqual(result.content, 'Hello from Misskey!');
      assert.strictEqual(result.author, 'Misskey User');
      assert.strictEqual(result.authorUsername, 'mkuser');
      assert.strictEqual(result.url, 'https://misskey.io/notes/abc123xyz');
      assert.strictEqual(result.repliesCount, 2);
      assert.strictEqual(result.reblogsCount, 5);
      assert.strictEqual(result.favouritesCount, 5); // 3 + 2
      assert.strictEqual(result.sensitive, false);
    });

    it('should handle Misskey note with content warning', () => {
      const data = {
        id: 'cw123',
        text: 'Hidden content',
        user: { username: 'mkuser' },
        createdAt: '2024-01-01T00:00:00.000Z',
        repliesCount: 0,
        renoteCount: 0,
        reactions: {},
        files: [],
        cw: 'CW: Sensitive topic'
      };

      const result = parsePostData(data, 'misskey.io', 'cw123');
      assert.strictEqual(result.sensitive, true);
      assert.strictEqual(result.spoilerText, 'CW: Sensitive topic');
    });

    it('should handle Misskey note with media files', () => {
      const data = {
        id: 'media123',
        text: 'Check this image!',
        user: { name: 'User', username: 'user' },
        createdAt: '2024-01-01T00:00:00.000Z',
        repliesCount: 0,
        renoteCount: 0,
        reactions: {},
        files: [
          {
            type: 'image/png',
            url: 'https://misskey.io/image.png',
            thumbnailUrl: 'https://misskey.io/thumb.png',
            comment: 'A nice image',
            name: 'image.png'
          }
        ],
        cw: null
      };

      const result = parsePostData(data, 'misskey.io', 'media123');
      assert.strictEqual(result.mediaAttachments.length, 1);
      assert.strictEqual(result.mediaAttachments[0].type, 'image');
      assert.strictEqual(result.mediaAttachments[0].description, 'A nice image');
    });
  });

  describe('ActivityPub format', () => {
    it('should parse ActivityPub Note', () => {
      const data = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Note',
        id: 'https://example.com/users/test/statuses/456',
        content: '<p>ActivityPub note</p>',
        attributedTo: {
          id: 'https://example.com/users/test',
          name: 'Test Author'
        },
        published: '2024-01-01T00:00:00.000Z',
        attachment: [],
        sensitive: false
      };

      const result = parsePostData(data, 'example.com', '456');
      assert.strictEqual(result.type, 'post');
      assert.strictEqual(result.content, 'ActivityPub note');
      assert.strictEqual(result.author, 'Test Author');
    });

    it('should parse ActivityPub Article', () => {
      const data = {
        type: 'Article',
        id: 'https://example.com/article/789',
        content: '<p>Article content</p>',
        published: '2024-01-01T00:00:00.000Z',
        attachment: []
      };

      const result = parsePostData(data, 'example.com', '789');
      assert.strictEqual(result.type, 'post');
      assert.strictEqual(result.content, 'Article content');
    });
  });

  it('should return null for unrecognized data format', () => {
    const result = parsePostData({ foo: 'bar' }, 'example.com', '123');
    assert.strictEqual(result, null);
  });
});

describe('parseProfileData', () => {
  describe('Mastodon/GoToSocial API format', () => {
    it('should parse Mastodon profile', () => {
      const data = {
        id: '12345',
        username: 'user',
        display_name: 'Test User',
        acct: 'user',
        url: 'https://mastodon.social/@user',
        avatar: 'https://mastodon.social/avatar.png',
        header: 'https://mastodon.social/header.png',
        note: '<p>My bio</p>',
        followers_count: 100,
        following_count: 50,
        statuses_count: 200,
        bot: false,
        locked: false,
        created_at: '2023-01-01T00:00:00.000Z'
      };

      const result = parseProfileData(data, 'mastodon.social', 'user');
      assert.strictEqual(result.type, 'profile');
      assert.strictEqual(result.username, 'user');
      assert.strictEqual(result.displayName, 'Test User');
      assert.strictEqual(result.note, 'My bio');
      assert.strictEqual(result.followersCount, 100);
      assert.strictEqual(result.followingCount, 50);
      assert.strictEqual(result.statusesCount, 200);
    });
  });

  describe('Misskey/Firefish API format', () => {
    it('should parse Misskey profile', () => {
      const data = {
        id: 'mk12345',
        username: 'mkuser',
        name: 'Misskey User',
        avatarUrl: 'https://misskey.io/avatar.png',
        bannerUrl: 'https://misskey.io/banner.png',
        description: 'My Misskey bio',
        followersCount: 50,
        followingCount: 30,
        notesCount: 100,
        isBot: false,
        isLocked: false,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const result = parseProfileData(data, 'misskey.io', 'mkuser');
      assert.strictEqual(result.type, 'profile');
      assert.strictEqual(result.username, 'mkuser');
      assert.strictEqual(result.displayName, 'Misskey User');
      assert.strictEqual(result.url, 'https://misskey.io/@mkuser');
      assert.strictEqual(result.avatar, 'https://misskey.io/avatar.png');
      assert.strictEqual(result.header, 'https://misskey.io/banner.png');
      assert.strictEqual(result.note, 'My Misskey bio');
      assert.strictEqual(result.followersCount, 50);
      assert.strictEqual(result.followingCount, 30);
      assert.strictEqual(result.statusesCount, 100);
      assert.strictEqual(result.instance, 'misskey.io');
      assert.ok(result.title.includes('Misskey User'));
      assert.ok(result.title.includes('misskey.io'));
    });

    it('should handle Misskey bot profile', () => {
      const data = {
        id: 'bot123',
        username: 'bot',
        name: 'Bot Account',
        avatarUrl: 'https://misskey.io/avatar.png',
        description: 'I am a bot',
        isBot: true,
        isLocked: true,
        followersCount: 10,
        followingCount: 0,
        notesCount: 500,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const result = parseProfileData(data, 'misskey.io', 'bot');
      assert.strictEqual(result.bot, true);
      assert.strictEqual(result.locked, true);
    });

    it('should handle Misskey profile without display name', () => {
      const data = {
        id: 'noname123',
        username: 'noname',
        name: null,
        avatarUrl: 'https://misskey.io/avatar.png',
        description: null,
        followersCount: 0,
        followingCount: 0,
        notesCount: 0,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const result = parseProfileData(data, 'misskey.io', 'noname');
      assert.strictEqual(result.displayName, 'noname');
      assert.strictEqual(result.note, '');
    });
  });

  describe('ActivityPub format', () => {
    it('should parse ActivityPub Person', () => {
      const data = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Person',
        id: 'https://example.com/users/alice',
        name: 'Alice',
        preferredUsername: 'alice',
        summary: '<p>Hello, I am Alice</p>',
        icon: { url: 'https://example.com/avatar.png' },
        image: { url: 'https://example.com/header.png' }
      };

      const result = parseProfileData(data, 'example.com', 'alice');
      assert.strictEqual(result.type, 'profile');
      assert.strictEqual(result.username, 'alice');
      assert.strictEqual(result.displayName, 'Alice');
      assert.strictEqual(result.avatar, 'https://example.com/avatar.png');
    });

    it('should parse ActivityPub Service (bot)', () => {
      const data = {
        type: 'Service',
        id: 'https://example.com/users/bot',
        preferredUsername: 'bot',
        summary: '<p>I am a bot</p>'
      };

      const result = parseProfileData(data, 'example.com', 'bot');
      assert.strictEqual(result.type, 'profile');
      assert.strictEqual(result.displayName, 'bot');
    });
  });

  it('should return null for unrecognized data format', () => {
    const result = parseProfileData({ foo: 'bar' }, 'example.com', 'user');
    assert.strictEqual(result, null);
  });
});

describe('stripHtml', () => {
  it('should strip HTML tags', () => {
    assert.strictEqual(stripHtml('<p>Hello <strong>World</strong></p>'), 'Hello World');
  });

  it('should convert <br> to newlines', () => {
    assert.strictEqual(stripHtml('Line 1<br>Line 2'), 'Line 1\nLine 2');
  });

  it('should convert </p> to double newlines', () => {
    assert.strictEqual(stripHtml('<p>Para 1</p><p>Para 2</p>'), 'Para 1\n\nPara 2');
  });

  it('should decode HTML entities', () => {
    assert.strictEqual(stripHtml('&amp; &lt; &gt; &quot; &#39;'), "& < > \" '");
  });

  it('should handle empty/null input', () => {
    assert.strictEqual(stripHtml(''), '');
    assert.strictEqual(stripHtml(null), '');
    assert.strictEqual(stripHtml(undefined), '');
  });
});

describe('truncateText', () => {
  it('should truncate text longer than maxLength', () => {
    const result = truncateText('This is a very long text that needs truncation', 20);
    assert.strictEqual(result, 'This is a very long...');
  });

  it('should not truncate text shorter than maxLength', () => {
    assert.strictEqual(truncateText('Short', 100), 'Short');
  });

  it('should handle empty/null input', () => {
    assert.strictEqual(truncateText('', 100), '');
    assert.strictEqual(truncateText(null, 100), null);
  });
});

describe('parseMediaAttachments', () => {
  it('should parse Mastodon media attachments', () => {
    const media = [
      { type: 'image', url: 'https://example.com/image.png', preview_url: 'https://example.com/preview.png', description: 'A nice image', meta: {} }
    ];
    const result = parseMediaAttachments(media);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'image');
    assert.strictEqual(result[0].url, 'https://example.com/image.png');
    assert.strictEqual(result[0].description, 'A nice image');
  });

  it('should handle null/empty input', () => {
    assert.deepStrictEqual(parseMediaAttachments(null), []);
    assert.deepStrictEqual(parseMediaAttachments([]), []);
  });
});

describe('parseActivityPubMedia', () => {
  it('should parse ActivityPub attachments', () => {
    const media = [
      { mediaType: 'image/png', url: 'https://example.com/image.png', name: 'My image' }
    ];
    const result = parseActivityPubMedia(media);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'image');
    assert.strictEqual(result[0].description, 'My image');
  });

  it('should handle video attachments', () => {
    const media = [
      { mediaType: 'video/mp4', url: 'https://example.com/video.mp4', name: 'A video' }
    ];
    const result = parseActivityPubMedia(media);
    assert.strictEqual(result[0].type, 'video');
  });

  it('should handle null/empty input', () => {
    assert.deepStrictEqual(parseActivityPubMedia(null), []);
    assert.deepStrictEqual(parseActivityPubMedia([]), []);
  });
});

describe('parseMisskeyMedia', () => {
  it('should parse Misskey file attachments', () => {
    const files = [
      { type: 'image/png', url: 'https://misskey.io/image.png', thumbnailUrl: 'https://misskey.io/thumb.png', comment: 'Image alt', name: 'image.png' }
    ];
    const result = parseMisskeyMedia(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'image');
    assert.strictEqual(result[0].url, 'https://misskey.io/image.png');
    assert.strictEqual(result[0].previewUrl, 'https://misskey.io/thumb.png');
    assert.strictEqual(result[0].description, 'Image alt');
  });

  it('should use file name when comment is missing', () => {
    const files = [
      { type: 'image/jpeg', url: 'https://misskey.io/photo.jpg', name: 'photo.jpg' }
    ];
    const result = parseMisskeyMedia(files);
    assert.strictEqual(result[0].description, 'photo.jpg');
  });

  it('should handle null/empty input', () => {
    assert.deepStrictEqual(parseMisskeyMedia(null), []);
    assert.deepStrictEqual(parseMisskeyMedia([]), []);
  });
});

describe('stripMarkdown', () => {
  it('should reduce links to their text', () => {
    assert.strictEqual(stripMarkdown('See [the docs](https://example.com)'), 'See the docs');
  });

  it('should reduce images to their alt text', () => {
    assert.strictEqual(stripMarkdown('![a cat](https://example.com/cat.png)'), 'a cat');
  });

  it('should strip emphasis, headings and code markers', () => {
    assert.strictEqual(stripMarkdown('# Title\n**bold** and `code`'), 'Title\nbold and code');
  });

  it('should handle null/empty input', () => {
    assert.strictEqual(stripMarkdown(null), '');
    assert.strictEqual(stripMarkdown(''), '');
  });
});

describe('parseLemmyPost', () => {
  const view = {
    post: {
      id: 1,
      name: 'Lemmy.world',
      body: 'Trying out [Lemmy](https://join-lemmy.org).',
      url: 'https://lemmy.world/',
      thumbnail_url: 'https://lemmy.world/pictrs/image/thumb.png',
      ap_id: 'https://lemmy.world/post/1',
      published: '2023-06-01T08:28:56.724232Z',
      nsfw: false
    },
    creator: {
      name: 'ruud',
      display_name: 'Ruud',
      avatar: 'https://lemmy.world/pictrs/image/avatar.png',
      actor_id: 'https://lemmy.world/u/ruud'
    },
    community: { name: 'fediverse', title: 'Fediverse' },
    counts: { comments: 42, score: 100, upvotes: 110 }
  };

  it('should parse a Lemmy post into the common post shape', () => {
    const result = parseLemmyPost(view, 'lemmy.world');
    assert.strictEqual(result.type, 'post');
    assert.strictEqual(result.title, 'Lemmy.world');
    assert.strictEqual(result.author, 'Ruud');
    assert.strictEqual(result.authorUsername, 'ruud');
    assert.strictEqual(result.url, 'https://lemmy.world/post/1');
    assert.strictEqual(result.repliesCount, 42);
    assert.strictEqual(result.favouritesCount, 100);
    // body markdown link is reduced to its text
    assert.strictEqual(result.content, 'Trying out Lemmy.');
  });

  it('should expose the thumbnail as an image attachment', () => {
    const result = parseLemmyPost(view, 'lemmy.world');
    assert.strictEqual(result.mediaAttachments.length, 1);
    assert.strictEqual(result.mediaAttachments[0].type, 'image');
    assert.strictEqual(result.mediaAttachments[0].url, 'https://lemmy.world/pictrs/image/thumb.png');
  });
});

describe('parseLemmyComment', () => {
  it('should parse a Lemmy comment', () => {
    const view = {
      comment: {
        id: 1,
        content: 'You can create an account, if you like.',
        ap_id: 'https://lemmy.world/comment/1',
        published: '2023-06-01T08:59:19.068084Z'
      },
      creator: { name: 'ruud', display_name: 'Ruud', actor_id: 'https://lemmy.world/u/ruud' },
      post: { name: 'Lemmy.world' },
      counts: { score: 5, child_count: 2 }
    };
    const result = parseLemmyComment(view, 'lemmy.world');
    assert.strictEqual(result.type, 'post');
    assert.strictEqual(result.content, 'You can create an account, if you like.');
    assert.match(result.title, /commented on/);
    assert.strictEqual(result.url, 'https://lemmy.world/comment/1');
    assert.strictEqual(result.favouritesCount, 5);
  });
});

describe('parseLemmyCommunity', () => {
  it('should parse a Lemmy community into a profile', () => {
    const view = {
      community: {
        id: 2478,
        name: 'technology',
        title: 'Technology',
        description: 'Tech news and articles.',
        icon: 'https://lemmy.world/pictrs/icon.png',
        banner: 'https://lemmy.world/pictrs/banner.png',
        actor_id: 'https://lemmy.world/c/technology'
      },
      counts: { subscribers: 1000, posts: 500 }
    };
    const result = parseLemmyCommunity(view, 'lemmy.world');
    assert.strictEqual(result.type, 'profile');
    assert.strictEqual(result.displayName, 'Technology');
    assert.strictEqual(result.username, 'technology');
    assert.strictEqual(result.followersCount, 1000);
    assert.strictEqual(result.statusesCount, 500);
    assert.strictEqual(result.url, 'https://lemmy.world/c/technology');
  });
});

describe('parseLemmyUser', () => {
  it('should parse a Lemmy person into a profile', () => {
    const view = {
      person: {
        id: 2,
        name: 'ruud',
        display_name: 'Ruud',
        avatar: 'https://lemmy.world/pictrs/avatar.png',
        banner: 'https://lemmy.world/pictrs/banner.png',
        bio: 'Admin of a lot of fediverse servers.',
        actor_id: 'https://lemmy.world/u/ruud'
      },
      counts: { post_count: 128, comment_count: 992 }
    };
    const result = parseLemmyUser(view, 'lemmy.world');
    assert.strictEqual(result.type, 'profile');
    assert.strictEqual(result.displayName, 'Ruud');
    assert.strictEqual(result.statusesCount, 1120);
    assert.match(result.title, /@ruud@lemmy\.world/);
  });
});

describe('parsePeertubeVideo', () => {
  const data = {
    uuid: '9c9de5e8-0a1e-484a-b099-e80766180a6d',
    shortUUID: 'kkGMgK9ZtnKfYAgnEtQxbv',
    url: 'https://framatube.org/videos/watch/9c9de5e8-0a1e-484a-b099-e80766180a6d',
    name: 'What is PeerTube?',
    description: 'A decentralized video hosting network.',
    thumbnailPath: '/lazy-static/thumbnails/thumb.jpg',
    previewPath: '/lazy-static/thumbnails/preview.jpg',
    embedPath: '/videos/embed/kkGMgK9ZtnKfYAgnEtQxbv',
    views: 12345,
    likes: 678,
    duration: 113,
    account: {
      name: 'framasoft',
      displayName: 'Framasoft',
      url: 'https://framatube.org/accounts/framasoft',
      avatars: [{ width: 48, path: '/lazy-static/avatars/small.png' }]
    },
    channel: { name: 'framasoft_channel', displayName: 'Framasoft Channel' }
  };

  it('should parse a PeerTube video into a video post', () => {
    const result = parsePeertubeVideo(data, 'framatube.org');
    assert.strictEqual(result.type, 'post');
    assert.match(result.title, /What is PeerTube\?/);
    assert.strictEqual(result.author, 'Framasoft');
    assert.strictEqual(result.mediaAttachments.length, 1);
    assert.strictEqual(result.mediaAttachments[0].type, 'video');
    assert.strictEqual(result.mediaAttachments[0].isEmbed, true);
    assert.strictEqual(result.mediaAttachments[0].url, 'https://framatube.org/videos/embed/kkGMgK9ZtnKfYAgnEtQxbv');
    // preview thumbnail resolved to an absolute URL
    assert.strictEqual(result.thumbnail, 'https://framatube.org/lazy-static/thumbnails/preview.jpg');
  });

  it('should resolve the account avatar to an absolute URL', () => {
    const result = parsePeertubeVideo(data, 'framatube.org');
    assert.strictEqual(result.authorAvatar, 'https://framatube.org/lazy-static/avatars/small.png');
  });
});

describe('parsePeertubeActor', () => {
  it('should parse a PeerTube account into a profile', () => {
    const data = {
      name: 'framasoft',
      displayName: 'Framasoft',
      description: 'Popular education association.',
      followersCount: 1016,
      url: 'https://framatube.org/accounts/framasoft',
      avatars: [{ width: 120, fileUrl: 'https://framatube.org/avatar.png' }]
    };
    const result = parsePeertubeActor(data, 'framatube.org', 'account');
    assert.strictEqual(result.type, 'profile');
    assert.strictEqual(result.displayName, 'Framasoft');
    assert.strictEqual(result.followersCount, 1016);
    assert.strictEqual(result.avatar, 'https://framatube.org/avatar.png');
    assert.match(result.title, /PeerTube Account/);
  });
});

describe('parseMbinEntry', () => {
  it('should parse an Mbin entry into a post', () => {
    const data = {
      entryId: 1462498,
      title: "We've moved!",
      url: null,
      body: 'Come say **hi**!',
      type: 'article',
      image: { sourceUrl: 'https://example.com/img.png', storageUrl: 'https://media.kbin.earth/img.png' },
      user: { username: '@LadyButterfly@lazysoci.al', apProfileId: 'https://lazysoci.al/u/LadyButterfly', avatar: { storageUrl: 'https://media.kbin.earth/avatar.png' } },
      magazine: { name: 'random' },
      numComments: 3,
      favourites: 7,
      createdAt: '2025-05-16T16:40:30+00:00'
    };
    const result = parseMbinEntry(data, 'kbin.earth');
    assert.strictEqual(result.type, 'post');
    assert.strictEqual(result.title, "We've moved!");
    assert.strictEqual(result.content, 'Come say hi!');
    assert.strictEqual(result.repliesCount, 3);
    assert.strictEqual(result.favouritesCount, 7);
    // storageUrl is preferred for images
    assert.strictEqual(result.mediaAttachments[0].url, 'https://media.kbin.earth/img.png');
    assert.strictEqual(result.url, 'https://kbin.earth/m/random/t/1462498');
  });
});

describe('parseMbinMagazine', () => {
  it('should parse an Mbin magazine into a profile', () => {
    const data = {
      magazineId: 1,
      name: 'random',
      title: 'Random',
      description: 'A catch-all magazine.',
      subscriptionsCount: 250,
      entryCount: 6790
    };
    const result = parseMbinMagazine(data, 'kbin.earth');
    assert.strictEqual(result.type, 'profile');
    assert.strictEqual(result.displayName, 'Random');
    assert.strictEqual(result.followersCount, 250);
    assert.strictEqual(result.statusesCount, 6790);
    assert.strictEqual(result.url, 'https://kbin.earth/m/random');
  });
});

describe('parseMbinUser', () => {
  it('should parse an Mbin user into a profile', () => {
    const data = {
      userId: 912501,
      username: 'LadyButterfly',
      about: 'Hello there.',
      avatar: { storageUrl: 'https://media.kbin.earth/avatar.png' },
      apProfileId: 'https://lazysoci.al/u/LadyButterfly'
    };
    const result = parseMbinUser(data, 'kbin.earth');
    assert.strictEqual(result.type, 'profile');
    assert.strictEqual(result.username, 'LadyButterfly');
    assert.strictEqual(result.avatar, 'https://media.kbin.earth/avatar.png');
    assert.strictEqual(result.url, 'https://lazysoci.al/u/LadyButterfly');
  });
});
