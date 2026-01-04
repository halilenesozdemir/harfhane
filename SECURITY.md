# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.0.x   | ✅ Active          |
| 1.0.x   | ✅ Security fixes  |
| < 1.0   | ❌ Not supported   |

## Security Model

Nurdle is a **client-side only** application with no backend server.

### Data Storage

| Data Type | Storage | Sensitive |
|-----------|---------|-----------|
| Game state | localStorage | ❌ No |
| Statistics | localStorage | ❌ No |
| Theme preference | localStorage | ❌ No |
| Word list | Static JSON (bundled) | ❌ No |

- ✅ No user accounts or authentication
- ✅ No server-side data collection
- ✅ No cookies (only localStorage)
- ✅ No third-party tracking
- ✅ GDPR compliant by design

### Known Limitations

1. **Word List Visibility**: The word list is bundled in the client-side JavaScript and can be viewed by users. This is intentional and matches the original Wordle design.

2. **localStorage Limitations**: Data stored in localStorage is accessible to any JavaScript running on the same origin. This is acceptable since no sensitive data is stored.

3. **XSS Considerations**: While React provides built-in XSS protection, we follow additional best practices:
   - No `dangerouslySetInnerHTML` usage
   - No `eval()` or `new Function()` usage
   - User input is never rendered as HTML

## Security Best Practices

### Code Standards

```javascript
// ✅ Good - Safe rendering
<div>{userInput}</div>

// ❌ Bad - Never do this
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

### Dependencies

- Run `npm audit` regularly
- Update dependencies monthly
- Critical security patches within 48 hours
- Use exact versions in production

### Content Security Policy (Recommended)

When deploying, add these headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Vercel/Netlify Configuration

**vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email: [security contact - add your email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Severity | Initial Response | Fix Target |
|----------|------------------|------------|
| Critical | 24 hours | 48 hours |
| High | 48 hours | 1 week |
| Medium | 1 week | 2 weeks |
| Low | 2 weeks | Next release |

## Security Checklist

### Before Each Release

- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] No hardcoded secrets or API keys
- [ ] All dependencies are up to date
- [ ] Code review completed
- [ ] No console.log statements in production

### Deployment

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Source maps disabled in production (optional)

---

**Last Updated:** January 2026  
**Version:** 2.0.0

