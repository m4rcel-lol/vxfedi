# Contributing to vxfedi

Thank you for your interest in contributing to vxfedi! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
- Check the [existing issues](https://github.com/m4rcel-lol/vxfedi/issues) to avoid duplicates
- Collect relevant information (logs, environment, steps to reproduce)

When creating a bug report, include:
- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (Node.js version, OS, Docker version if applicable)
- **Logs or error messages**
- **Screenshots** if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
- Check if the enhancement has already been suggested
- Provide a clear use case for the enhancement
- Explain why this enhancement would be useful to most users

### Pull Requests

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Local Development

1. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vxfedi.git
   cd vxfedi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Test your changes**
   - Manual testing: Visit `http://localhost:3000`
   - Test with different Fediverse URLs
   - Test with different user agents (bot vs browser)

## Code Style Guidelines

### JavaScript

- **Use modern ES6+ syntax** (const/let, arrow functions, async/await)
- **Use meaningful variable names** (avoid single letters except in loops)
- **Add comments** for complex logic
- **Keep functions small** and focused on a single task
- **Use consistent indentation** (2 spaces)

### File Organization

```
src/
├── index.js              # Main server file
└── utils/
    ├── urlParser.js      # URL parsing logic
    ├── fediverseApi.js   # Fediverse API integration
    ├── metaGenerator.js  # Meta tag generation
    ├── pageRenderer.js   # HTML rendering
    └── userAgent.js      # User agent detection
```

### Example Code Style

```javascript
// Good
async function fetchPost(instance, username, postId) {
  const baseUrl = `https://${instance}`;

  try {
    const response = await axios.get(`${baseUrl}/api/v1/statuses/${postId}`);
    return parsePostData(response.data);
  } catch (error) {
    console.error('Error fetching post:', error.message);
    return null;
  }
}

// Bad
async function fp(i,u,p){const b=`https://${i}`;return await axios.get(`${b}/api/v1/statuses/${p}`).then(r=>r.data).catch(e=>null)}
```

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test the following:

- [ ] Homepage loads correctly
- [ ] Health endpoint returns 200
- [ ] Valid Mastodon post URL renders correctly
- [ ] Valid profile URL renders correctly
- [ ] Invalid URLs show appropriate error messages
- [ ] Bot user agents get HTML with meta tags
- [ ] Browser user agents get redirected
- [ ] Media attachments display correctly
- [ ] Alt text is included for images
- [ ] oEmbed endpoint returns valid JSON

### Testing with Different User Agents

```bash
# Test as Discord bot
curl -A "Mozilla/5.0 (compatible; Discordbot/2.0)" \
  http://localhost:3000/mastodon.social/@user/123

# Test as regular browser
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \
  http://localhost:3000/mastodon.social/@user/123
```

### Testing with Real Fediverse Content

Use these public instances for testing:
- `mastodon.social/@Gargron` (Mastodon founder)
- `mas.to/@dansup` (Pixelfed founder)
- `fosstodon.org/@kev` (Privacy advocate)

## Documentation

### Updating README

If your changes affect:
- Installation steps
- Usage instructions
- Configuration options
- Features

Please update the relevant sections in README.md

### Code Documentation

Add JSDoc comments for functions:

```javascript
/**
 * Parse vxfedi URL to extract instance and resource information
 *
 * @param {string} path - URL path to parse
 * @returns {Object|null} Parsed URL data or null if invalid
 */
function parseVxUrl(path) {
  // Implementation
}
```

## Commit Message Guidelines

Write clear, descriptive commit messages:

```
Add support for Pleroma instance format

- Implement /notice/{id} URL pattern
- Update URL parser to handle Pleroma format
- Add tests for Pleroma URLs
```

Format:
- **First line:** Brief summary (50 chars or less)
- **Blank line**
- **Body:** Detailed explanation of what and why (optional)

## Adding New Features

When adding a new feature:

1. **Discuss first** by opening an issue
2. **Keep it simple** - avoid over-engineering
3. **Maintain backward compatibility**
4. **Document the feature** in README.md
5. **Add examples** of the feature in use

### Example: Adding a New Fediverse Platform

If you want to add support for a new Fediverse platform:

1. Research the platform's API structure
2. Update `urlParser.js` to handle the URL format
3. Update `fediverseApi.js` to fetch from the platform
4. Test with real content from the platform
5. Document the platform in README.md
6. Submit PR with examples

## Performance Considerations

- **Minimize API calls** to Fediverse instances
- **Use async/await** properly (avoid blocking)
- **Handle errors gracefully** (don't crash on bad input)
- **Consider rate limiting** for popular instances
- **Keep dependencies minimal**

## Security Considerations

When contributing, ensure:

- [ ] No API keys or secrets in code
- [ ] Input is validated and sanitized
- [ ] No XSS vulnerabilities in rendered HTML
- [ ] No command injection in shell commands
- [ ] External URLs are properly escaped
- [ ] Dependencies are kept up to date

## Review Process

1. **Automated checks** must pass (if configured)
2. **Manual review** by maintainer(s)
3. **Changes requested** - address feedback
4. **Approval and merge**

Response time: Usually within 1-7 days

## Getting Help

- **Documentation:** See [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** Ask questions in [GitHub Issues](https://github.com/m4rcel-lol/vxfedi/issues)
- **Discussions:** Join [GitHub Discussions](https://github.com/m4rcel-lol/vxfedi/discussions)

## Recognition

Contributors will be:
- Listed in release notes
- Mentioned in the README (for significant contributions)
- Part of the vxfedi community!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to vxfedi! 💜
