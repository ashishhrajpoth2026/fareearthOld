# Fareearth API Security Documentation

## Overview

This document explains the security architecture implemented for the Fareearth e-commerce platform's Google Apps Script backend. The goal is to restrict API access to only requests originating from `https://fareearth.in` and prevent unauthorized usage.

---

## Security Layers Implemented

### Layer 1: Origin Header Validation

**What it does:** Checks the `Origin` or `Referer` HTTP header sent by the browser.

**How it works:**
```
Request → Check Origin header → Match https://fareearth.in? → Allow/Reject
```

**Code snippet from** `Code.gs` > `validateRequest()`:
```javascript
var origin = getHeader(e, 'Origin') || getHeader(e, 'Referer') || '';
if (origin) {
    origin = origin.replace(/\/+$/, '');
    if (origin !== CONFIG.ALLOWED_ORIGIN) {
        logBlockedRequest(e, 'Invalid origin: ' + origin);
        return { success: false, message: 'Unauthorized' };
    }
}
```

**Limitations of Origin Checking:**

| Limitation | Explanation |
|------------|-------------|
| **Easily spoofed** | Tools like cURL, Postman, and custom scripts can set any `Origin` header. |
| **Not always sent** | Some browsers omit `Origin` for same-origin requests. Server-to-server requests often lack it entirely. |
| **Referer can be disabled** | Users can disable `Referer` headers via browser settings or extensions. |
| **Not a security boundary** | The `Origin` header is a hint, not an authentication mechanism. |

**Conclusion:** Origin checking is a useful first line of defense against casual abuse, but **must not be relied upon as the sole security measure**.

---

### Layer 2: API Key Validation

**What it does:** Requires a shared secret (API key) to be sent with every request.

**How it works:**
```
Client stores API key → Sends in X-API-Key header → Backend validates match
```

**Frontend (config.js):**
```javascript
const CONFIG = {
    API_KEY: "fe_sk_live_YOUR_GENERATED_KEY"
};
```

**Backend (Code.gs):**
```javascript
var apiKey = getHeader(e, 'X-API-Key') || '';
if (apiKey !== CONFIG.API_KEY) {
    logBlockedRequest(e, 'Invalid API key');
    return { success: false, message: 'Unauthorized' };
}
```

**Best Practices:**
- Generate a unique, cryptographic random key
- Store the key outside of version control (use environment variables or Google Apps Script Properties Service)
- Rotate keys periodically (every 90 days recommended)
- Use different keys for development and production

---

### Layer 3: Request Timestamp Validation (Anti-Replay)

**What it does:** Prevents captured API requests from being replayed later.

**How it works:**
```
Client sends Date.now() in X-Request-Timestamp header
                ↓
Backend checks: Is timestamp within 5 minutes? AND Is this timestamp unique (nonce)?
```

**Timestamp window:** ±5 minutes (300,000 ms), with 30-second clock drift tolerance.

**Nonce (Number Used Once):**
- Each timestamp can only be used once
- Used timestamps are stored in `CacheService` until they expire
- Prevents replay attacks within the valid window

**Security benefit:** Even if an attacker intercepts a valid API request, they cannot replay it after 5 minutes or reuse the same timestamp.

---

### Layer 4: Rate Limiting

**What it does:** Limits how many requests a single IP address can make within a time window.

**Configuration:**
```javascript
RATE_LIMIT_MAX_REQUESTS: 30,   // Max requests per window
RATE_LIMIT_WINDOW_MS: 60000,   // 1-minute window
```

**How it works:**
1. Each IP address gets a counter stored in `CacheService`
2. Counter resets every 60 seconds
3. If a client exceeds 30 requests in 60 seconds, subsequent requests are blocked
4. Blocked requests are logged for audit

**Why this matters:** Prevents automated attacks, web scraping, and accidental runaway scripts from overwhelming your API.

---

### Layer 5: Request Logging

**What it does:** All blocked requests are logged with metadata for audit and monitoring.

**Logged information:**
- Timestamp of the blocked request
- IP address of the requester
- Origin and Referer headers
- User-Agent string
- HTTP method (GET/POST)
- Request action (e.g., `placeOrder`)
- Reason for blocking

**Storage options:**
1. **Logger** - Built-in Google Apps Script logging (viewable in Script Editor)
2. **Google Sheets** - Optional persistent storage (set `SECURITY_LOG_SPREADSHEET_ID` in Script Properties)

---

## Complete Request Flow

```
Browser (fareearth.in)
    │
    ├─► fetch() with headers:
    │   • Origin: https://fareearth.in           (set by browser)
    │   • X-API-Key: fe_sk_live_...             (from config.js)
    │   • X-Request-Timestamp: 1234567890       (current time)
    │
    ▼
Google Apps Script (doPost / doGet)
    │
    ├─► validateRequest(e)
    │   │
    │   ├─ Check 1: Origin header valid?
    │   │   ├─ Yes → Continue
    │   │   └─ No  → ❌ Reject (403) + Log
    │   │
    │   ├─ Check 2: API key matches?
    │   │   ├─ Yes → Continue
    │   │   └─ No  → ❌ Reject (403) + Log
    │   │
    │   ├─ Check 3: Timestamp valid & unique?
    │   │   ├─ Yes → Continue
    │   │   └─ No  → ❌ Reject (403) + Log
    │   │
    │   ├─ Check 4: Rate limit OK?
    │   │   ├─ Yes → Continue
    │   │   └─ No  → ❌ Reject (403) + Log
    │   │
    │   └─ ✅ All checks passed → Process request
    │
    └─► Return JSON response
        • Success: { success: true, ... }
        • Failure: { success: false, message: "Unauthorized" }
```

---

## Stronger Alternatives to Origin Checking

### 1. Cloudflare Workers (Recommended)

A Cloudflare Worker sits between your users and your backend, providing:
- **IP filtering** - Block all traffic except from Cloudflare's IP ranges
- **Geographic blocking** - Restrict to specific countries
- **Rate limiting at the edge** - Before traffic reaches your server
- **API key validation** - Strip and validate keys before forwarding
- **WAF rules** - Block SQL injection, XSS, etc.

**Example Worker script:**
```javascript
// Cloudflare Worker: API Gateway for Fareearth
const ALLOWED_ORIGIN = 'https://fareearth.in';
const API_KEY = 'fe_sk_live_YOUR_KEY';

async function handleRequest(request) {
    // 1. Validate Origin
    const origin = request.headers.get('Origin') || '';
    if (origin && origin !== ALLOWED_ORIGIN) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Validate API Key
    const apiKey = request.headers.get('X-API-Key') || '';
    if (apiKey !== API_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 3. Forward to Google Apps Script
    const url = 'YOUR_GAS_WEB_APP_URL';
    const modifiedRequest = new Request(url, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });

    return await fetch(modifiedRequest);
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
```

### 2. Backend Proxy Server

Deploy a small Node.js/Express server on a VPS or serverless platform (Vercel, Netlify, Railway) that:
- Validates all security headers
- Forwards validated requests to Google Apps Script
- Adds server-side IP allowlisting
- Provides better CORS control
- Enables WebSocket support if needed

**Example Express proxy:**
```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();

const ALLOWED_ORIGIN = 'https://fareearth.in';
const API_KEY = process.env.API_KEY;
const GAS_URL = process.env.GAS_URL;

// CORS configuration
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Request-Timestamp']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many requests' }
});
app.use('/api/', limiter);

// API key validation middleware
app.use('/api/', (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

// Proxy endpoint
app.post('/api/*', async (req, res) => {
    const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
});

app.listen(3000);
```

### 3. Google Cloud Endpoints

If you're already using Google Cloud, Cloud Endpoints provides:
- API key management
- Authentication (OAuth2, JWT)
- Rate limiting
- Logging and monitoring
- Integration with Google Cloud Armor for DDoS protection

---

## Security Comparison Table

| Method | Spoof-Resistant | Replay Protection | Rate Limiting | Setup Complexity |
|--------|-----------------|-------------------|---------------|------------------|
| **Origin Header** | ❌ Low | ❌ No | ❌ No | 🟢 Simple |
| **API Key** | 🟡 Medium | ❌ No* | ❌ No | 🟢 Simple |
| **Timestamp + Nonce** | ✅ High | ✅ Yes | ❌ No | 🟡 Medium |
| **All Combined (Current)** | ✅ High | ✅ Yes | ✅ Yes | 🟡 Medium |
| **Cloudflare Worker** | ✅ Very High | ✅ Yes | ✅ Yes (Edge) | 🔴 More complex |
| **Backend Proxy** | ✅ Very High | ✅ Yes | ✅ Yes | 🔴 Most complex |

\* API Key alone does not prevent replay attacks unless combined with HTTPS and timestamp validation.

---

## Deployment Checklist

### Google Apps Script Setup

- [ ] Deploy the script as a **Web App**
- [ ] Set **Execute as:** `Me` (not "User accessing the web app")
- [ ] Set **Who has access:** `Anyone` (since we control access via our security)
- [ ] Copy the deployment URL to `CONFIG.API_URL` in `config.js`
- [ ] Generate a unique API key using `generateApiKey()` in the Apps Script editor
- [ ] Update the API key in **both** `Code.gs` and `config.js`
- [ ] Run `testSecuritySetup()` to verify all security checks work

### Frontend Deployment

- [ ] Update `config.js` with the correct API URL and API key
- [ ] Ensure all API calls use `secureApiRequest()` (or include the required headers)
- [ ] Test checkout flow end-to-end
- [ ] Verify that requests from non-`fareearth.in` domains are blocked

### Optional Enhancements

- [ ] Set up spreadsheet logging (add `SECURITY_LOG_SPREADSHEET_ID` to Script Properties)
- [ ] Implement a Cloudflare Worker or backend proxy for additional security
- [ ] Set up monitoring alerts for excessive blocked requests
- [ ] Schedule periodic API key rotation (every 90 days)
- [ ] Add reCAPTCHA v3 to the checkout form for bot protection

---

## Best Practices Checklist

### Code Security
- [x] Validate all input on the server side (never trust client data)
- [x] Return generic error messages to clients (don't leak implementation details)
- [x] Use `ContentService.MimeType.JSON` for all responses
- [x] Log all security violations for audit
- [x] Implement rate limiting to prevent abuse
- [x] Use nonce/timestamp to prevent replay attacks
- [ ] Store sensitive config in PropertiesService rather than hardcoding
- [ ] Use separate API keys for development and production

### Deployment Security
- [x] Deploy web app with "Execute as: Me"
- [ ] Enable HTTPS-only (automatic with Google Apps Script)
- [ ] Review deployment permissions periodically
- [ ] Monitor Google Cloud dashboard for unusual activity
- [ ] Set up email alerts for critical security events

### Development Practices
- [x] Keep the API key out of version control (use `.env` or properties)
- [x] Document all security decisions and their rationale
- [x] Include test functions to verify security setup
- [ ] Conduct regular security reviews
- [ ] Keep dependencies updated
- [ ] Have an incident response plan

---

## Quick Reference: Frontend Example

### Using the `secureApiRequest` Helper

```javascript
// Already included in checkout.js - use for all API calls
import { CONFIG } from './config.js';

async function sendContactForm(name, email, message) {
    const payload = {
        action: 'contactForm',
        name: name,
        email: email,
        message: message
    };

    try {
        const result = await secureApiRequest(CONFIG.API_URL, payload);
        if (result.success) {
            showToast('Message sent successfully!');
        } else {
            showToast('Failed to send message.');
        }
    } catch (error) {
        showToast('Network error. Please try again.');
    }
}
```

### Manual Fetch with Security Headers

```javascript
const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY,
        'X-Request-Timestamp': String(Date.now())
    },
    body: JSON.stringify(payload)
});
```

### GET Request Example

```javascript
async function checkOrderStatus(orderId) {
    const url = `${CONFIG.API_URL}?action=getOrderStatus&orderId=${encodeURIComponent(orderId)}`;
    
    try {
        const result = await secureApiRequest(url, null, 'GET');
        return result;
    } catch (error) {
        console.error('Status check failed:', error);
        return null;
    }
}
```

---

## Testing Your Security Setup

After deploying, verify your security is working:

```bash
# 1. Valid request (should succeed)
curl -X POST "YOUR_GAS_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://fareearth.in" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Request-Timestamp: $(date +%s%3N)" \
  -d '{"action":"healthCheck"}'

# 2. Missing API key (should be rejected)
curl -X POST "YOUR_GAS_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://fareearth.in" \
  -d '{"action":"healthCheck"}'

# 3. Wrong origin (should be rejected)
curl -X POST "YOUR_GAS_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-site.com" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Request-Timestamp: $(date +%s%3N)" \
  -d '{"action":"healthCheck"}'

# 4. Expired timestamp (should be rejected)
curl -X POST "YOUR_GAS_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: https://fareearth.in" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Request-Timestamp: 1000000000000" \
  -d '{"action":"healthCheck"}'
```

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-29 | 2.0.0 | Complete security rewrite with multi-layer validation |
| 2025-XX-XX | 1.0.0 | Initial implementation |

---

*For questions or security concerns, please contact the Fareearth development team.*