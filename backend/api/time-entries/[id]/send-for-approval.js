const fs = require('fs').promises;
const path = require('path');

function getDataFilePath(uuid) {
  return path.join(process.cwd(), 'data', `time-entries_${uuid}.json`);
}

function getUuidFromRequest(req) {
  const uuid = req.query.uuid;
  if (!uuid) {
    throw new Error('missing uuid');
  }
  return uuid;
}

async function readDataFile(dataFile, uuid) {
  try {
    await fs.access(dataFile);
    const data = await fs.readFile(dataFile, 'utf8');
    return { exists: true, data: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { exists: false, data: null };
    }
    console.error('Error reading data file:', error);
    return { exists: true, data: { timeEntries: [] } };
  }
}

async function writeDataFile(dataFile, data) {
  try {
    const dir = path.dirname(dataFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

function validateEntryForApproval(entry) {
  const requiredFields = ['date', 'startTime'];
  const missingFields = requiredFields.filter(field => !entry[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Entry is missing required fields: ${missingFields.join(', ')}`
    };
  }

  if (entry.status !== 'draft') {
    return {
      isValid: false,
      error: `Only draft entries can be sent for approval. Current status: ${entry.status}`
    };
  }

  if (entry.endTime && entry.startTime >= entry.endTime) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  if (entry.break && entry.break.trim() !== '') {
    const breakTime = entry.break.trim();
    const fullFormatRegex = /^(\d+)h\s+(\d+)m$/;
    const hoursOnlyRegex = /^(\d+)h$/;
    const minutesOnlyRegex = /^(\d+)m$/;

    if (!fullFormatRegex.test(breakTime) && !hoursOnlyRegex.test(breakTime) && !minutesOnlyRegex.test(breakTime)) {
      return {
        isValid: false,
        error: 'Break format must be like "1h 30m", "2h", or "45m"'
      };
    }
  }

  return { isValid: true };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-uuid, uuid');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uuid = getUuidFromRequest(req);
    const { id } = req.query;
    const dataFile = getDataFilePath(uuid);

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'ID must be a valid number'
      });
    }

    const result = await readDataFile(dataFile, uuid);

    if (!result.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: `No time entries found for user with UUID: ${uuid}. Cannot send entry for approval.`,
        uuid: uuid
      });
    }

    const data = result.data;
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = data.timeEntries[entryIndex];

    const validation = validateEntryForApproval(entry);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Cannot send entry for approval',
        message: validation.error,
        currentStatus: entry.status
      });
    }

    const updatedEntry = {
      ...entry,
      status: 'draft',
      submittedForApprovalAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(dataFile, data);
    if (success) {
      return res.status(200).json(updatedEntry);
    } else {
      return res.status(500).json({ error: 'Failed to send entry for approval' });
    }

  } catch (error) {
    console.error('API Error:', error);

    if (error.message === 'missing uuid') {
      return res.status(400).json({ error: 'missing uuid' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
