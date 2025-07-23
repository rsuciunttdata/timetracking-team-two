import { fileDb } from '../../../lib/fileDb.js';
import { handleCors } from '../../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const entry = await fileDb.getEntryById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft entries can be sent for approval',
        currentStatus: entry.status
      });
    }

    const updatedEntry = await fileDb.updateEntry(id, {
      status: 'pending',
      submittedForApprovalAt: new Date().toISOString()
    });

    console.log('[API] Entry sent for approval:', updatedEntry);
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
