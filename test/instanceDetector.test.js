const assert = require('node:assert');
const { describe, it, afterEach } = require('node:test');
const { detectInstanceType, clearCache, SOFTWARE_FAMILIES } = require('../src/utils/instanceDetector');
const { buildPostEndpoints, buildProfileEndpoints } = require('../src/utils/fediverseApi');

describe('SOFTWARE_FAMILIES', () => {
  it('should include Mastodon-compatible software', () => {
    assert.ok(SOFTWARE_FAMILIES.mastodon.includes('mastodon'));
    assert.ok(SOFTWARE_FAMILIES.mastodon.includes('hometown'));
    assert.ok(SOFTWARE_FAMILIES.mastodon.includes('glitch-soc'));
    assert.ok(SOFTWARE_FAMILIES.mastodon.includes('ecko'));
  });

  it('should include GoToSocial', () => {
    assert.ok(SOFTWARE_FAMILIES.gotosocial.includes('gotosocial'));
  });

  it('should include Pleroma/Akkoma', () => {
    assert.ok(SOFTWARE_FAMILIES.pleroma.includes('pleroma'));
    assert.ok(SOFTWARE_FAMILIES.pleroma.includes('akkoma'));
  });

  it('should include Misskey-compatible software', () => {
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('misskey'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('firefish'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('sharkey'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('calckey'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('foundkey'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('iceshrimp'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('catodon'));
    assert.ok(SOFTWARE_FAMILIES.misskey.includes('cherrypick'));
  });

  it('should include Pixelfed', () => {
    assert.ok(SOFTWARE_FAMILIES.pixelfed.includes('pixelfed'));
  });
});

describe('detectInstanceType', () => {
  afterEach(() => {
    clearCache();
  });

  it('should return unknown for unreachable instances', async () => {
    const result = await detectInstanceType('nonexistent.invalid.tld');
    assert.strictEqual(result, 'unknown');
  });

  it('should cache results for the same instance', async () => {
    const result1 = await detectInstanceType('nonexistent.invalid.tld');
    const result2 = await detectInstanceType('nonexistent.invalid.tld');
    assert.strictEqual(result1, result2);
    assert.strictEqual(result1, 'unknown');
  });

  it('should clear cache when clearCache is called', async () => {
    await detectInstanceType('nonexistent.invalid.tld');
    clearCache();
    // After clear, it should try again (still unknown for invalid domain)
    const result = await detectInstanceType('nonexistent.invalid.tld');
    assert.strictEqual(result, 'unknown');
  });
});

describe('buildPostEndpoints', () => {
  describe('unknown instance type', () => {
    it('should return all endpoints in default order', () => {
      const endpoints = buildPostEndpoints('unknown', 'user', '123');
      assert.ok(endpoints.length > 0);
      assert.strictEqual(endpoints[0], '/api/v1/statuses/123');
      assert.strictEqual(endpoints[1], '/api/notes/show');
    });

    it('should filter null endpoints when username is null', () => {
      const endpoints = buildPostEndpoints('unknown', null, '123');
      endpoints.forEach(ep => assert.ok(ep !== null));
      // Should not include username-dependent endpoints
      assert.ok(!endpoints.includes(null));
    });
  });

  describe('mastodon instance type', () => {
    it('should prioritize Mastodon API endpoint', () => {
      const endpoints = buildPostEndpoints('mastodon', 'user', '123');
      assert.strictEqual(endpoints[0], '/api/v1/statuses/123');
      assert.strictEqual(endpoints[1], '/@user/123');
    });

    it('should still include all fallback endpoints', () => {
      const endpoints = buildPostEndpoints('mastodon', 'user', '123');
      assert.ok(endpoints.includes('/api/v1/statuses/123'));
      assert.ok(endpoints.includes('/api/notes/show'));
      assert.ok(endpoints.includes('/notice/123'));
    });
  });

  describe('gotosocial instance type', () => {
    it('should prioritize Mastodon-compatible API then GoToSocial format', () => {
      const endpoints = buildPostEndpoints('gotosocial', 'alice', '01HXYZ');
      assert.strictEqual(endpoints[0], '/api/v1/statuses/01HXYZ');
      assert.strictEqual(endpoints[1], '/@alice/statuses/01HXYZ');
    });
  });

  describe('pleroma instance type', () => {
    it('should prioritize Mastodon-compatible API then Pleroma formats', () => {
      const endpoints = buildPostEndpoints('pleroma', null, 'abc123');
      assert.strictEqual(endpoints[0], '/api/v1/statuses/abc123');
      assert.strictEqual(endpoints[1], '/notice/abc123');
      assert.strictEqual(endpoints[2], '/objects/abc123');
    });
  });

  describe('misskey instance type', () => {
    it('should prioritize Misskey API endpoint', () => {
      const endpoints = buildPostEndpoints('misskey', null, 'note123');
      assert.strictEqual(endpoints[0], '/api/notes/show');
      assert.strictEqual(endpoints[1], '/notes/note123');
    });

    it('should include Mastodon API as fallback', () => {
      const endpoints = buildPostEndpoints('misskey', null, 'note123');
      assert.ok(endpoints.includes('/api/v1/statuses/note123'));
    });
  });

  describe('pixelfed instance type', () => {
    it('should prioritize Mastodon-compatible API', () => {
      const endpoints = buildPostEndpoints('pixelfed', 'alice', '456');
      assert.strictEqual(endpoints[0], '/api/v1/statuses/456');
    });
  });
});

describe('buildProfileEndpoints', () => {
  describe('unknown instance type', () => {
    it('should return all endpoints in default order', () => {
      const endpoints = buildProfileEndpoints('unknown', 'user');
      assert.strictEqual(endpoints.length, 4);
      assert.strictEqual(endpoints[0].url, '/api/v1/accounts/lookup?acct=user');
      assert.strictEqual(endpoints[0].method, 'GET');
      assert.strictEqual(endpoints[1].url, '/api/users/show');
      assert.strictEqual(endpoints[1].method, 'POST');
    });
  });

  describe('mastodon instance type', () => {
    it('should prioritize Mastodon API', () => {
      const endpoints = buildProfileEndpoints('mastodon', 'user');
      assert.strictEqual(endpoints[0].url, '/api/v1/accounts/lookup?acct=user');
      assert.strictEqual(endpoints[0].method, 'GET');
    });

    it('should include Misskey API as fallback', () => {
      const endpoints = buildProfileEndpoints('mastodon', 'user');
      const misskeyEndpoint = endpoints.find(e => e.url === '/api/users/show');
      assert.ok(misskeyEndpoint);
      assert.strictEqual(misskeyEndpoint.method, 'POST');
    });
  });

  describe('misskey instance type', () => {
    it('should prioritize Misskey API', () => {
      const endpoints = buildProfileEndpoints('misskey', 'mkuser');
      assert.strictEqual(endpoints[0].url, '/api/users/show');
      assert.strictEqual(endpoints[0].method, 'POST');
      assert.deepStrictEqual(endpoints[0].body, { username: 'mkuser' });
    });

    it('should include Mastodon API as fallback', () => {
      const endpoints = buildProfileEndpoints('misskey', 'mkuser');
      const mastodonEndpoint = endpoints.find(e => e.url.includes('/api/v1/accounts/lookup'));
      assert.ok(mastodonEndpoint);
    });
  });

  describe('gotosocial instance type', () => {
    it('should prioritize Mastodon-compatible API', () => {
      const endpoints = buildProfileEndpoints('gotosocial', 'alice');
      assert.strictEqual(endpoints[0].url, '/api/v1/accounts/lookup?acct=alice');
    });
  });

  describe('pleroma instance type', () => {
    it('should prioritize Mastodon-compatible API', () => {
      const endpoints = buildProfileEndpoints('pleroma', 'bob');
      assert.strictEqual(endpoints[0].url, '/api/v1/accounts/lookup?acct=bob');
    });
  });

  describe('pixelfed instance type', () => {
    it('should prioritize Mastodon-compatible API', () => {
      const endpoints = buildProfileEndpoints('pixelfed', 'photographer');
      assert.strictEqual(endpoints[0].url, '/api/v1/accounts/lookup?acct=photographer');
    });
  });

  it('should always return all 4 endpoint types', () => {
    const types = ['mastodon', 'gotosocial', 'pleroma', 'misskey', 'pixelfed', 'unknown'];
    for (const type of types) {
      const endpoints = buildProfileEndpoints(type, 'testuser');
      assert.strictEqual(endpoints.length, 4, `Expected 4 endpoints for ${type}, got ${endpoints.length}`);
    }
  });
});
