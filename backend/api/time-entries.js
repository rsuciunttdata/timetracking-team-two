import { fileDb } from '../lib/fileDb.js';
import { handleCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      const entries = await fileDb.getAllEntries();
      console.log(`[API] Retrieved ${entries.length} entries`);
      res.status(200).json(entries);
    }
    else if (req.method === 'POST') {
      const newEntry = await fileDb.createEntry(req.body);
      console.log('[API] Created new entry:', newEntry);
      res.status(201).json(newEntry);
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
