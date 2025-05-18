require('dotenv').config();
const OpenAI = require('openai');

// i have tried using deepseek ai but i have no balance to use the API, sorry i have to ask you for using openrouter API Key
// const openai = new OpenAI({
//   apiKey: process.env.DEEPSEEK_API_KEY,
//   baseURL: 'https://api.deepseek.com/v1', // Or their current endpoint
// });


// integrating with AI using openai lib and using openrouter API for free deepseek model as an alternative
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Ebay Scraper"
  }
});

async function extractWithDeepseek(productUrl) {
  const prompt = `
  You are an expert web scraper. Visit this eBay product page: ${productUrl}
  
  Extract and return STRICTLY as RAW JSON:
  {
    "product_name": "(from main product title)",
    "product_price": "(current price, include currency)",
    "product_description": "(from Seller Notes section)"
  }
  
  RULES:
  1. For prices:
     - Always show numbers and currency symbol ($100)
     - Convert "US $100" → "$100"
     - For auctions use current bid
  2. Return "-" ONLY if field is completely missing
  3. Never include HTML/markdown
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        { 
          role: 'system', 
          content: 'You can browse live websites. Return only raw JSON. Never use markdown or any formatting.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0
    });

    // Handle markdown responses
    let content = response.choices[0]?.message?.content || '';
    
    // Remove markdown formatting if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    // to check content after filtering the response and also the response itself
    // console.log('AI RAW content:', content); 
    // console.log('response:', response);

    return JSON.parse(content);

  } catch (error) {
    console.error('AI error:', error.message);
    return { product_name: '-', product_price: '-', product_description: '-' };
  }
}

module.exports = { extractWithDeepseek };
