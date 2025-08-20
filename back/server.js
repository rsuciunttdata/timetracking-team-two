const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'time-entries.json');

app.use(cors());
app.use(express.json());

async function readDataFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { timeEntries: [] };
  }
}

async function writeDataFile(data) {
  try {
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
      status: req.body.status || 'draft'
    };

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
      id: parseInt(req.params.id)
    };

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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'File service is running' });
});

app.listen(PORT, () => {
  console.log(`[Server] File service running on http://localhost:${PORT}`);
});

module.exports = app;
