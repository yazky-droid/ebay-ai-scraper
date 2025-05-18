require('dotenv').config();
const express = require('express');
const { scrapeAllPages } = require('./scraper');

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY in .env file');
}

const app = express();
const PORT = 3000;

// API endpoint
app.get('/scrape', async (req, res) => {
  try {
    const keyword = req.query.keyword || 'nike';
    const maxPages = parseInt(req.query.maxPages) || 2;
    const products = await scrapeAllPages(keyword, maxPages);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`example API running in: http://localhost:${PORT}/scrape?keyword=nike&maxPages=2`);
});