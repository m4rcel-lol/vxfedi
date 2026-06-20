const assert = require('node:assert');
const { describe, it } = require('node:test');
const { parseVxUrl } = require('../src/utils/urlParser');

describe('parseVxUrl', () => {
  describe('Mastodon format', () => {
    it('should parse /@username/postid', () => {
      const result = parseVxUrl('/mastodon.social/@user/123456789');
      assert.deepStrictEqual(result, {
        instance: 'mastodon.social',
        username: 'user',
        postId: '123456789',
        resourceType: 'post',
        originalUrl: 'https://mastodon.social/@user/123456789'
      });
    });

    it('should parse profile /@username', () => {
      const result = parseVxUrl('/mastodon.social/@user');
      assert.deepStrictEqual(result, {
        instance: 'mastodon.social',
        username: 'user',
        postId: null,
        resourceType: 'profile',
        originalUrl: 'https://mastodon.social/@user'
      });
    });
  });

  describe('GoToSocial format', () => {
    it('should parse /@username/statuses/postid', () => {
      const result = parseVxUrl('/social.governmental.eu/@m5rcel/statuses/01KK9CG9D9WAHQG5R5FXNR90YD');
      assert.deepStrictEqual(result, {
        instance: 'social.governmental.eu',
        username: 'm5rcel',
        postId: '01KK9CG9D9WAHQG5R5FXNR90YD',
        resourceType: 'post',
        originalUrl: 'https://social.governmental.eu/@m5rcel/statuses/01KK9CG9D9WAHQG5R5FXNR90YD'
      });
    });

    it('should parse GoToSocial with different ULID', () => {
      const result = parseVxUrl('/gts.example.org/@alice/statuses/01HXYZ123ABC');
      assert.strictEqual(result.resourceType, 'post');
      assert.strictEqual(result.instance, 'gts.example.org');
      assert.strictEqual(result.username, 'alice');
      assert.strictEqual(result.postId, '01HXYZ123ABC');
    });
  });

  describe('ActivityPub format', () => {
    it('should parse /users/username/statuses/postid', () => {
      const result = parseVxUrl('/instance.tld/users/john/statuses/123');
      assert.deepStrictEqual(result, {
        instance: 'instance.tld',
        username: 'john',
        postId: '123',
        resourceType: 'post',
        originalUrl: 'https://instance.tld/users/john/statuses/123'
      });
    });

    it('should parse profile /users/username', () => {
      const result = parseVxUrl('/instance.tld/users/john');
      assert.deepStrictEqual(result, {
        instance: 'instance.tld',
        username: 'john',
        postId: null,
        resourceType: 'profile',
        originalUrl: 'https://instance.tld/users/john'
      });
    });
  });

  describe('Pleroma/Akkoma format', () => {
    it('should parse /notice/postid', () => {
      const result = parseVxUrl('/pleroma.example.com/notice/12345');
      assert.deepStrictEqual(result, {
        instance: 'pleroma.example.com',
        username: null,
        postId: '12345',
        resourceType: 'post',
        originalUrl: 'https://pleroma.example.com/notice/12345'
      });
    });

    it('should parse /objects/uuid', () => {
      const result = parseVxUrl('/akkoma.example.org/objects/abc-def-123');
      assert.deepStrictEqual(result, {
        instance: 'akkoma.example.org',
        username: null,
        postId: 'abc-def-123',
        resourceType: 'post',
        originalUrl: 'https://akkoma.example.org/objects/abc-def-123'
      });
    });
  });

  describe('Misskey/Firefish/Sharkey format', () => {
    it('should parse /notes/noteid', () => {
      const result = parseVxUrl('/misskey.io/notes/abc123xyz');
      assert.deepStrictEqual(result, {
        instance: 'misskey.io',
        username: null,
        postId: 'abc123xyz',
        resourceType: 'post',
        originalUrl: 'https://misskey.io/notes/abc123xyz'
      });
    });
  });

  describe('Pixelfed format', () => {
    it('should parse /p/username/postid', () => {
      const result = parseVxUrl('/pixelfed.social/p/alice/123456');
      assert.deepStrictEqual(result, {
        instance: 'pixelfed.social',
        username: 'alice',
        postId: '123456',
        resourceType: 'post',
        originalUrl: 'https://pixelfed.social/p/alice/123456'
      });
    });
  });

  describe('Lemmy/PieFed format', () => {
    it('should parse /post/id', () => {
      const result = parseVxUrl('/lemmy.world/post/123456');
      assert.deepStrictEqual(result, {
        instance: 'lemmy.world',
        username: null,
        postId: '123456',
        resourceType: 'post',
        originalUrl: 'https://lemmy.world/post/123456',
        platform: 'lemmy',
        subtype: 'post'
      });
    });

    it('should parse /comment/id', () => {
      const result = parseVxUrl('/lemmy.world/comment/789');
      assert.strictEqual(result.resourceType, 'post');
      assert.strictEqual(result.subtype, 'comment');
      assert.strictEqual(result.postId, '789');
    });

    it('should parse /c/community as a profile', () => {
      const result = parseVxUrl('/lemmy.world/c/technology');
      assert.strictEqual(result.resourceType, 'profile');
      assert.strictEqual(result.platform, 'lemmy');
      assert.strictEqual(result.subtype, 'community');
      assert.strictEqual(result.username, 'technology');
    });

    it('should parse a remote /c/community@instance', () => {
      const result = parseVxUrl('/lemmy.world/c/news@beehaw.org');
      assert.strictEqual(result.resourceType, 'profile');
      assert.strictEqual(result.username, 'news@beehaw.org');
    });

    it('should parse /u/username as a profile', () => {
      const result = parseVxUrl('/lemmy.world/u/ruud');
      assert.strictEqual(result.resourceType, 'profile');
      assert.strictEqual(result.subtype, 'user');
      assert.strictEqual(result.username, 'ruud');
    });
  });

  describe('Mbin/Kbin format', () => {
    it('should parse /m/magazine as a profile', () => {
      const result = parseVxUrl('/kbin.earth/m/random');
      assert.deepStrictEqual(result, {
        instance: 'kbin.earth',
        username: 'random',
        postId: null,
        resourceType: 'profile',
        originalUrl: 'https://kbin.earth/m/random',
        platform: 'mbin',
        subtype: 'magazine'
      });
    });

    it('should parse /m/magazine/t/id as a thread post', () => {
      const result = parseVxUrl('/kbin.earth/m/random/t/1462498');
      assert.strictEqual(result.resourceType, 'post');
      assert.strictEqual(result.platform, 'mbin');
      assert.strictEqual(result.subtype, 'thread');
      assert.strictEqual(result.username, 'random');
      assert.strictEqual(result.postId, '1462498');
    });
  });

  describe('PeerTube format', () => {
    it('should parse /w/shortid as a video post', () => {
      const result = parseVxUrl('/framatube.org/w/kkGMgK9ZtnKfYAgnEtQxbv');
      assert.deepStrictEqual(result, {
        instance: 'framatube.org',
        username: null,
        postId: 'kkGMgK9ZtnKfYAgnEtQxbv',
        resourceType: 'post',
        originalUrl: 'https://framatube.org/w/kkGMgK9ZtnKfYAgnEtQxbv',
        platform: 'peertube',
        subtype: 'video'
      });
    });

    it('should parse /videos/watch/uuid', () => {
      const result = parseVxUrl('/framatube.org/videos/watch/9c9de5e8-0a1e-484a-b099-e80766180a6d');
      assert.strictEqual(result.resourceType, 'post');
      assert.strictEqual(result.subtype, 'video');
      assert.strictEqual(result.postId, '9c9de5e8-0a1e-484a-b099-e80766180a6d');
    });

    it('should parse /a/account as a profile', () => {
      const result = parseVxUrl('/framatube.org/a/framasoft');
      assert.strictEqual(result.resourceType, 'profile');
      assert.strictEqual(result.subtype, 'account');
      assert.strictEqual(result.username, 'framasoft');
    });

    it('should parse /video-channels/name as a profile', () => {
      const result = parseVxUrl('/framatube.org/video-channels/joinpeertube');
      assert.strictEqual(result.resourceType, 'profile');
      assert.strictEqual(result.subtype, 'channel');
      assert.strictEqual(result.username, 'joinpeertube');
    });
  });

  describe('Classic formats keep their original shape', () => {
    it('should not attach platform/subtype to Mastodon URLs', () => {
      const result = parseVxUrl('/mastodon.social/@user/123');
      assert.strictEqual('platform' in result, false);
      assert.strictEqual('subtype' in result, false);
    });
  });

  describe('Invalid URLs', () => {
    it('should return null for empty path', () => {
      assert.strictEqual(parseVxUrl('/'), null);
    });

    it('should return null for path without domain', () => {
      assert.strictEqual(parseVxUrl('/nodomain'), null);
    });

    it('should return null for domain-only path', () => {
      assert.strictEqual(parseVxUrl('/instance.tld'), null);
    });

    it('should return null for path starting with @ as first segment', () => {
      assert.strictEqual(parseVxUrl('/@user.tld/something'), null);
    });

    it('should return null for unsupported path format', () => {
      assert.strictEqual(parseVxUrl('/instance.tld/unknown/path/here'), null);
    });

    it('should return null for /@username with too many path segments', () => {
      assert.strictEqual(parseVxUrl('/instance.tld/@user/extra/segments/here'), null);
    });
  });

  describe('Edge cases', () => {
    it('should handle leading/trailing slashes', () => {
      const result = parseVxUrl('///mastodon.social/@user/123///');
      assert.strictEqual(result.instance, 'mastodon.social');
      assert.strictEqual(result.postId, '123');
    });

    it('should handle subdomain instances', () => {
      const result = parseVxUrl('/social.example.co.uk/@user/123');
      assert.strictEqual(result.instance, 'social.example.co.uk');
      assert.strictEqual(result.resourceType, 'post');
    });
  });
});
