// ============================================================
// Dynamic Proxy API Server for Vercel
// Supports:
//   - Default routes -> proxied through ScrapingAnt
//   - Versioned routes (/v1/..., /v2/...) -> direct axios call
// ============================================================

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// --------------- MIDDLEWARE ---------------
app.use(cors());                       // Enable CORS for all origins
app.use(morgan('dev'));                // Request logging
app.use(express.raw({ type: '*/*', limit: '50mb' })); // Accept any body type as raw buffer
app.disable('x-powered-by');          // Hide Express fingerprint

// --------------- HELPERS ---------------

// Headers that should NOT be forwarded to the upstream server
const HEADERS_TO_STRIP = [
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'upgrade',
];

/**
 * Build a clean set of headers to forward.
 * Keeps the original User-Agent (or sets a fallback).
 * Removes headers that may break proxy behaviour.
 */
function filterHeaders(headers) {
  const clean = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!HEADERS_TO_STRIP.includes(key.toLowerCase())) {
      clean[key] = value;
    }
  }
  // Ensure a User-Agent is present
  if (!clean['user-agent']) {
    clean['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
  return clean;
}

/**
 * Send an axios response back to the client,
 * preserving status code, headers and body (text / binary).
 */
function forwardResponse(res, axiosResponse) {
  res.status(axiosResponse.status);

  // Forward all headers except problematic ones
  const skipHeaders = new Set(['transfer-encoding', 'connection', 'content-encoding']);
  for (const [key, value] of Object.entries(axiosResponse.headers)) {
    if (!skipHeaders.has(key.toLowerCase())) {
      res.set(key, value);
    }
  }

  // Send buffer (works for text, JSON, HTML, images, etc.)
  res.send(Buffer.from(axiosResponse.data));
}

/**
 * Send a JSON error response.
 */
function sendError(res, statusCode, message, details = null) {
  const payload = { success: false, message };
  if (details) payload.error = details;
  res.status(statusCode).json(payload);
}

// --------------- HEALTH ROUTE ---------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --------------- DYNAMIC PROXY ROUTE ---------------
app.all('*', async (req, res) => {
  try {
    // --- Extract version prefix, e.g., /v1/... -> version = 1 ---
    const versionMatch = req.path.match(/^\/v(\d+)(\/.*)/);
    if (versionMatch) {
      // ========== VERSIONED ROUTE – DIRECT PROXY ==========
      const version = versionMatch[1];               // e.g., "1"
      const remainingPath = versionMatch[2];         // e.g., "/api/batches"
      const envKey = `BASE_URL${version}`;
      const baseUrl = process.env[envKey];

      if (!baseUrl) {
        return sendError(res, 404, `Base URL not found for version v${version}`);
      }

      // Build target URL: BASE_URL{version} + remaining path + query string
      const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      const targetUrl = `${baseUrl}${remainingPath}${queryString}`;

      console.log(`[v${version}] Direct proxy -> ${req.method} ${targetUrl}`);

      // Forward the request to the versioned backend
      const upstreamRes = await axios({
        method: req.method,
        url: targetUrl,
        headers: filterHeaders(req.headers),
        data: req.body.length ? req.body : undefined,   // keep raw body
        responseType: 'arraybuffer',                    // works for any content type
        timeout: 30000,
        validateStatus: () => true,                     // accept all status codes
      });

      return forwardResponse(res, upstreamRes);
    }

    // ========== DEFAULT ROUTE – PROXY THROUGH SCRAPINGANT ==========
    const scrapingAntKey = process.env.SCRAPINGANT_API_KEY;
    const baseUrl = process.env.BASE_URL;

    if (!scrapingAntKey || !baseUrl) {
      return sendError(res, 500, 'Missing BASE_URL or SCRAPINGANT_API_KEY in environment');
    }

    // Build the target URL (BASE_URL + the full original path + query)
    const targetUrl = `${baseUrl}${req.originalUrl}`;

    // Construct the ScrapingAnt API request
    const scrapingAntParams = {
      url: targetUrl,
      'x-api-key': scrapingAntKey,
      proxy_country: 'IN',
      browser: 'false',
    };

    const scrapingAntUrl = 'https://api.scrapingant.com/v2/general';

    console.log(`[default] ScrapingAnt proxy -> ${req.method} ${targetUrl}`);

    const upstreamRes = await axios({
      method: req.method,                     // preserve the original HTTP method
      url: scrapingAntUrl,
      params: scrapingAntParams,
      headers: filterHeaders(req.headers),
      data: req.body.length ? req.body : undefined,
      responseType: 'arraybuffer',
      timeout: 60000,                         // scraping may take longer
      validateStatus: () => true,
    });

    return forwardResponse(res, upstreamRes);
  } catch (error) {
    // ---- ERROR HANDLING ----
    console.error('Proxy error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return sendError(res, 504, 'Upstream request timed out', error.message);
    }
    if (error.code === 'ERR_BAD_REQUEST' || error.code === 'ERR_INVALID_URL') {
      return sendError(res, 400, 'Invalid URL or request', error.message);
    }
    if (error.response) {
      // Upstream sent an error response – forward it
      return forwardResponse(res, error.response);
    }

    sendError(res, 502, 'Bad Gateway', error.message);
  }
});

// --------------- START SERVER (local development) ---------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

// Export for Vercel serverless function
module.exports = app;
