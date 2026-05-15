const express = require('express');
const cloudscraper = require('cloudscraper');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://nt.rarestudy.in';

// CORS middleware – allow requests from any origin (or your specific domain)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain for security
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Generic proxy for all /api/* routes
app.use('/api', async (req, res) => {
    const targetUrl = API_BASE_URL + req.originalUrl;
    try {
        const response = await cloudscraper({
            method: req.method,
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            json: true,
        });
        res.json(response);
    } catch (error) {
        console.error(`Proxy error: ${error.message}`);
        res.status(502).json({ error: 'Failed to fetch data from the target API.' });
    }
});

// Optional: serve your site’s static files (if you want to host everything here)
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
