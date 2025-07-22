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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-uuid, uuid');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const uuid = getUuidFromRequest(req);
    const { id } = req.query;
    const dataFile = getDataFilePath(uuid);

    if (req.method === 'GET') {
      const result = await readDataFile(dataFile, uuid);

      if (!result.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No time entries found for user with UUID: ${uuid}. Please check if the UUID is correct.`,
          uuid: uuid
        });
      }

      const entry = result.data.timeEntries.find(e => e.id === parseInt(id));

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      return res.status(200).json(entry);
    }

    if (req.method === 'PUT') {
      const result = await readDataFile(dataFile, uuid);

      if (!result.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No time entries found for user with UUID: ${uuid}. Cannot update entry.`,
          uuid: uuid
        });
      }

      const data = result.data;
      const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(id));

      if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      const updatedEntry = {
        ...data.timeEntries[entryIndex],
        ...req.body,
        id: parseInt(id)
      };

      data.timeEntries[entryIndex] = updatedEntry;

      const success = await writeDataFile(dataFile, data);
      if (success) {
        return res.status(200).json(updatedEntry);
      } else {
        return res.status(500).json({ error: 'Failed to update entry' });
      }
    }

    if (req.method === 'DELETE') {
      const result = await readDataFile(dataFile, uuid);

      if (!result.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No time entries found for user with UUID: ${uuid}. Cannot delete entry.`,
          uuid: uuid
        });
      }

      const data = result.data;
      const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(id));

      if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      data.timeEntries.splice(entryIndex, 1);

      const success = await writeDataFile(dataFile, data);
      if (success) {
        return res.status(204).end();
      } else {
        return res.status(500).json({ error: 'Failed to delete entry' });
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
