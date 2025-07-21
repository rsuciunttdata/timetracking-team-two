import { handleCors } from '../lib/cors.js';

export default function handler(req, res) {
  if (handleCors(req, res)) return;

  res.status(200).json({
    status: 'OK',
    message: 'Vercel API service is running',
    timestamp: new Date().toISOString()
  });
}
