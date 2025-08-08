const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'time-entries.json');

const STATUS_MAP = {
  1: 'draft',
  2: 'pending',
  3: 'acceptat',
  4: 'respins'
};

const VALID_STATUSES = [1, 2, 3, 4];

app.use(cors());
app.use(express.json());

function isValidStatus(status) {
  return VALID_STATUSES.includes(status);
}

function normalizeStatus(status) {
  const numStatus = typeof status === 'string' ? parseInt(status, 10) : status;
  return isValidStatus(numStatus) ? numStatus : 1;
}

async function readDataFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);

    if (!parsedData || typeof parsedData !== 'object') {
      console.warn('Invalid data structure, creating default structure');
      return { timeEntries: [] };
    }

    if (!parsedData.timeEntries || !Array.isArray(parsedData.timeEntries)) {
      console.warn('timeEntries array not found, creating empty array');
      parsedData.timeEntries = [];
    }

    parsedData.timeEntries = parsedData.timeEntries.map(entry => ({
      ...entry,
      status: normalizeStatus(entry.status)
    }));

    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const defaultData = { timeEntries: [] };
      await writeDataFile(defaultData);
      return defaultData;
    } else if (error instanceof SyntaxError) {
      console.error('Invalid JSON in data file, creating backup and starting fresh');
      try {
        const backupFile = DATA_FILE + '.backup.' + Date.now();
        const corruptedData = await fs.readFile(DATA_FILE, 'utf8');
        await fs.writeFile(backupFile, corruptedData, 'utf8');
      } catch (backupError) {
        console.error('Could not create backup:', backupError);
      }

      const defaultData = { timeEntries: [] };
      await writeDataFile(defaultData);
      return defaultData;
    } else {
      console.error('Error reading data file:', error);
      return { timeEntries: [] };
    }
  }
}

async function writeDataFile(data) {
  try {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data structure provided to writeDataFile');
      return false;
    }

    if (!data.timeEntries || !Array.isArray(data.timeEntries)) {
      data.timeEntries = [];
    }

    data.timeEntries = data.timeEntries.map(entry => ({
      ...entry,
      status: normalizeStatus(entry.status)
    }));

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

app.get('/api/time-entries', async (req, res) => {
  try {
    const data = await readDataFile();
    res.json(data.timeEntries);
  } catch (error) {
    console.error('Error getting entries:', error);
    res.status(500).json({ error: 'Failed to read entries' });
  }
});

app.get('/api/time-entries/:id', async (req, res) => {
  try {
    const data = await readDataFile();
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

app.post('/api/time-entries', async (req, res) => {
  try {
    const data = await readDataFile();

    const maxId = data.timeEntries.length > 0
      ? Math.max(...data.timeEntries.map(e => e.id))
      : 0;

    const { total, ...rest } = req.body;

    const newEntry = {
      id: maxId + 1,
      ...rest,
      status: normalizeStatus(req.body.status || 1)
    };

    if (!newEntry.date || !newEntry.startTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: ['Date and start time are required']
      });
    }

    data.timeEntries.push(newEntry);

    const success = await writeDataFile(data);
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

app.put('/api/time-entries/:id', async (req, res) => {
  try {
    const data = await readDataFile();
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const { total, ...rest } = req.body;

    const updatedEntry = {
      ...data.timeEntries[entryIndex],
      ...rest,
      id: parseInt(req.params.id),
      status: normalizeStatus(rest.status || data.timeEntries[entryIndex].status)
    };

    const currentEntry = data.timeEntries[entryIndex];
    if (currentEntry.status === 2 || currentEntry.status === 3) {
      if (updatedEntry.status !== currentEntry.status) {
        return res.status(400).json({
          error: 'Cannot change status of pending or accepted entries',
          currentStatus: currentEntry.status
        });
      }
    }

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(data);
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

app.patch('/api/time-entries/:id/send-for-approval', async (req, res) => {
  try {
    const data = await readDataFile();
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = data.timeEntries[entryIndex];

    if (entry.status !== 1) {
      return res.status(400).json({
        error: 'Only draft entries can be sent for approval',
        currentStatus: entry.status,
        statusText: STATUS_MAP[entry.status]
      });
    }

    const updatedEntry = {
      ...entry,
      status: 2,
      submittedForApprovalAt: new Date().toISOString()
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(data);
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

app.delete('/api/time-entries/:id', async (req, res) => {
  try {
    const data = await readDataFile();
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(req.params.id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = data.timeEntries[entryIndex];

    if (entry.status !== 1 && entry.status !== 4) {
      return res.status(400).json({
        error: 'Can only delete draft or rejected entries',
        currentStatus: entry.status,
        statusText: STATUS_MAP[entry.status]
      });
    }

    const deletedEntry = data.timeEntries.splice(entryIndex, 1)[0];

    const success = await writeDataFile(data);
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

app.get('/api/status-info', (req, res) => {
  res.json({
    statusMap: STATUS_MAP,
    validStatuses: VALID_STATUSES
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'File service is running',
    statusMapping: STATUS_MAP
  });
});

app.listen(PORT, () => {
  console.log(`[Server] File service running on http://localhost:${PORT}`);
});

module.exports = app;
