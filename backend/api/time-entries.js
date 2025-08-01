const fs = require('fs').promises;
const path = require('path');
const { validateTimeEntry, sanitizeEntryData } = require('./validation');

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

    const parsed = JSON.parse(data);

    return { exists: true, data: parsed };
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-uuid, uuid');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const uuid = getUuidFromRequest(req);
    const dataFile = getDataFilePath(uuid);

    if (req.method === 'GET') {

      const result = await readDataFile(dataFile, uuid);

      if (!result.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No time entries found for user with UUID: ${uuid}. Please check if the UUID is correct or contact your administrator.`,
          uuid: uuid
        });
      }

      return res.status(200).json(result.data.timeEntries);
    }

    if (req.method === 'POST') {
      const validation = validateTimeEntry(req.body, false);

      if (!validation.isValid) {
        console.log('[Server] Validation failed for POST request:', validation.errors);
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The provided data is invalid',
          details: validation.errors
        });
      }

      const sanitizedData = sanitizeEntryData(req.body);

      const result = await readDataFile(dataFile, uuid);
      const data = result.exists ? result.data : { timeEntries: [] };

      const maxId = data.timeEntries.length > 0
        ? Math.max(...data.timeEntries.map(e => e.id))
        : 0;

      const newEntry = {
        id: maxId + 1,
        ...sanitizedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.timeEntries.push(newEntry);

      const success = await writeDataFile(dataFile, data);
      if (success) {
        return res.status(201).json(newEntry, "Successfully created new time entry");
      } else {
        return res.status(500).json({ error: 'Failed to save entry' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);

    if (error.message === 'missing uuid') {
      return res.status(400).json({ error: 'missing uuid' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
