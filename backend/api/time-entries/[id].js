import { fileDb } from '../../lib/fileDb.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const entry = await fileDb.getEntryById(id);
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.status(200).json(entry);
    }
    else if (req.method === 'PUT') {
      const updatedEntry = await fileDb.updateEntry(id, req.body);
      if (!updatedEntry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      console.log('[API] Updated entry:', updatedEntry);
      res.status(200).json(updatedEntry);
    }
    else if (req.method === 'DELETE') {
      const deletedEntry = await fileDb.deleteEntry(id);
      if (!deletedEntry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      console.log('[API] Deleted entry:', deletedEntry);
      res.status(204).end();
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
