const { validateTimeEntry, sanitizeEntryData } = require('./api/time-entries/validation');

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-uuid', 'uuid'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

function getDataFilePath(uuid) {
  return path.join(__dirname, 'data', `time-entries_${uuid}.json`);
}

function requireUuid(req, res, next) {
  const uuid = req.query.uuid;

  if (!uuid) {
    return res.status(400).json({ error: 'missing uuid' });
  }

  req.userUuid = uuid;
  next();
}

async function readDataFile(dataFile) {

  try {
    await fs.access(dataFile);

    const data = await fs.readFile(dataFile, 'utf8');

    const parsed = JSON.parse(data);

    return parsed;
  } catch (error) {

    if (error.code === 'ENOENT') {
      return { timeEntries: [] };
    }
    console.error('Error reading data file:', error);
    return { timeEntries: [] };
  }
}

async function writeDataFile(dataFile, data) {
  try {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

app.get('/api/time-entries', requireUuid, async (req, res) => {
  try {
    const dataFile = getDataFilePath(req.userUuid);

    const data = await readDataFile(dataFile);
    res.json(data.timeEntries);
  } catch (error) {
    console.error('Error getting entries:', error);
    res.status(500).json({ error: 'Failed to read entries' });
  }
});

app.get('/api/time-entries/:id', requireUuid, async (req, res) => {
  try {
    const dataFile = getDataFilePath(req.userUuid);
    const data = await readDataFile(dataFile);
    const entry = data.timeEntries.find(e => e.id === parseInt(req.params.id));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error getting entry:', error);
    res.status(500).json({ error: 'Failed to read entry' });
  }
});

app.post('/api/time-entries', requireUuid, async (req, res) => {
  try {
    const validation = validateTimeEntry(req.body, false);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The provided data is invalid',
        details: validation.errors
      });
    }

    const sanitizedData = sanitizeEntryData(req.body);

    const dataFile = getDataFilePath(req.userUuid);
    const data = await readDataFile(dataFile);

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
      res.status(201).json(newEntry);
    } else {
      res.status(500).json({ error: 'Failed to save entry' });
    }
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});
app.put('/api/time-entries/:id', requireUuid, async (req, res) => {
  try {
    const validation = validateTimeEntry(req.body, true);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The provided data is invalid',
        details: validation.errors
      });
    }

    const sanitizedData = sanitizeEntryData(req.body);

    const dataFile = getDataFilePath(req.userUuid);
    const data = await readDataFile(dataFile);
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const updatedEntry = {
      ...data.timeEntries[entryIndex],
      ...sanitizedData,
      id: parseInt(req.params.id),
      updatedAt: new Date().toISOString()
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(dataFile, data);
    if (success) {
      res.json(updatedEntry);
    } else {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.patch('/api/time-entries/:id/send-for-approval', requireUuid, async (req, res) => {
  try {
    const dataFile = getDataFilePath(req.userUuid);
    const data = await readDataFile(dataFile);
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = data.timeEntries[entryIndex];

    if (entry.status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft entries can be sent for approval',
        currentStatus: entry.status
      });
    }

    const updatedEntry = {
      ...entry,
      status: 'draft',
      submittedForApprovalAt: new Date().toISOString()
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(dataFile, data);
    if (success) {
      res.json(updatedEntry);
    } else {
      res.status(500).json({ error: 'Failed to send entry for approval' });
    }
  } catch (error) {
    console.error('Error sending entry for approval:', error);
    res.status(500).json({ error: 'Failed to send entry for approval' });
  }
});

app.delete('/api/time-entries/:id', requireUuid, async (req, res) => {
  try {
    const dataFile = getDataFilePath(req.userUuid);
    const data = await readDataFile(dataFile);
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const deletedEntry = data.timeEntries.splice(entryIndex, 1)[0];

    const success = await writeDataFile(dataFile, data);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'File service is running' });
});

app.get('/debug', async (req, res) => {
  const uuid = req.query.uuid || '001';

  try {

    const currentDir = __dirname;

    const currentFiles = await fs.readdir(currentDir);

    const dataDir = path.join(currentDir, 'data');

    let dataFiles = [];
    try {
      dataFiles = await fs.readdir(dataDir);
    } catch (err) {
    }

    const targetFile = getDataFilePath(uuid);

    let fileExists = false;
    let fileContent = null;
    try {
      await fs.access(targetFile);
      fileExists = true;
      fileContent = await fs.readFile(targetFile, 'utf8');
    } catch (err) {
    }

    res.json({
      debug: {
        currentDir,
        currentFiles,
        dataDir,
        dataFiles,
        targetFile,
        fileExists,
        fileContentLength: fileContent ? fileContent.length : 0,
        fileContentPreview: fileContent ? fileContent.substring(0, 200) : null
      }
    });

  } catch (error) {
    console.error('[DEBUG] Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] File service running on http://localhost:${PORT}`);
});

module.exports = app;
