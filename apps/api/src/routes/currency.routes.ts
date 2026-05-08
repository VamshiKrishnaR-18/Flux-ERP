import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();

// Cache rates in memory for 1 hour to avoid API limits
let cachedRates: any = null;
let lastFetched: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

router.get('/rates', asyncHandler(async (req, res) => {
  const base = (req.query.base as string) || 'USD';
  const now = Date.now();

  if (cachedRates && (now - lastFetched < CACHE_DURATION) && cachedRates.base === base) {
    return res.json({ success: true, data: cachedRates.rates });
  }

  try {
    // Using a free API (you might want to put your key in .env)
    const response = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
    
    if (response.data && response.data.result === 'success') {
      cachedRates = {
        base,
        rates: response.data.rates
      };
      lastFetched = now;
      res.json({ success: true, data: response.data.rates });
    } else {
      throw new Error("Failed to fetch rates from external API");
    }
  } catch (error) {
    logger.error("Exchange Rate Fetch Error:", error);
    // Fallback rates if API is down
    const fallbacks: any = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.30,
      AUD: 1.52,
      CAD: 1.35
    };
    res.json({ success: true, data: fallbacks });
  }
}));

export default router;
