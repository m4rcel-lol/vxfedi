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
