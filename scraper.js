const puppeteer = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');
const { extractWithDeepseek } = require('./deepseek');

// 1. Scrape product URLs from product list so that i can give it to the AI
async function scrapeProductURLs(keyword, pageNumber) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.ebay.com/sch/i.html?_nkw=${keyword}&_pgn=${pageNumber}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  const urls = await page.evaluate(() => 
    Array.from(document.querySelectorAll('.s-item__wrapper .s-item__link'))
      .map(link => link.href)
      .filter(url => url && !url.includes('ebay.com/p/')) // Skip ads
  );

  await browser.close();
  return urls;
}

// 2. Main function scrap all across pagination i set the default maxPages to 2 to avoid limit and parallelize the puppeteer using puppeteer-cluster 
async function scrapeAllPages(keyword, maxPages = 2) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: 2,  
    puppeteerOptions: { headless: true },
  });

  let allProducts = [];

  // Loop through pagination
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const urls = await scrapeProductURLs(keyword, pageNum);
    if (urls.length === 0) break;

    // Process each product page in parallel
    await Promise.all(urls.map(async (url) => {
      await cluster.queue(async ({ page }) => {
        try {
          
          // first attempt i tried to load the html code and ask AI to get the data but that is not effective
          // so i decided to ask AI to browse the link for product detail from the product list so that it's align with the core requirement

          // (( unused ))
          // await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          // const html = await page.content();

          const product = await extractWithDeepseek(url);  // Use Deepseek here, but i use openrouter API for free model of deepseek
          allProducts.push(product);
        } catch (error) {
          allProducts.push({ name: '-', price: '-', description: '-' });  // Fallback
        }
      });
    }));
  }

  await cluster.idle();
  await cluster.close();
  return allProducts;
}

module.exports = { scrapeAllPages }; 