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
  console.log(`[DEBUG] Trying to read file: ${dataFile}`);

  try {
    await fs.access(dataFile);
    console.log(`[DEBUG] File exists: ${dataFile}`);

    const data = await fs.readFile(dataFile, 'utf8');
    console.log(`[DEBUG] File content length: ${data.length}`);

    const parsed = JSON.parse(data);
    console.log(`[DEBUG] Parsed entries count: ${parsed.timeEntries ? parsed.timeEntries.length : 'NO timeEntries property'}`);

    return { exists: true, data: parsed };
  } catch (error) {
    console.log(`[DEBUG] Error reading file: ${error.message}`);
    console.log(`[DEBUG] Error code: ${error.code}`);

    if (error.code === 'ENOENT') {
      console.log(`[DEBUG] File does not exist for UUID: ${uuid}`);
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
    console.log('[Server] Data written to file successfully');
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
      console.log(`[DEBUG] GET request for UUID: ${uuid}`);
      console.log(`[DEBUG] Looking for file: ${dataFile}`);

      const result = await readDataFile(dataFile, uuid);

      if (!result.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No time entries found for user with UUID: ${uuid}. Please check if the UUID is correct or contact your administrator.`,
          uuid: uuid
        });
      }

      console.log(`[Server] Retrieved ${result.data.timeEntries.length} entries for UUID: ${uuid}`);
      return res.status(200).json(result.data.timeEntries);
    }

    if (req.method === 'POST') {
      const result = await readDataFile(dataFile, uuid);

      const data = result.exists ? result.data : { timeEntries: [] };

      const maxId = data.timeEntries.length > 0
        ? Math.max(...data.timeEntries.map(e => e.id))
        : 0;

      const newEntry = {
        id: maxId + 1,
        ...req.body,
        status: req.body.status || 'draft'
      };

      data.timeEntries.push(newEntry);

      const success = await writeDataFile(dataFile, data);
      if (success) {
        console.log(`[Server] Created new entry for UUID ${uuid}:`, newEntry);
        return res.status(201).json(newEntry);
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
