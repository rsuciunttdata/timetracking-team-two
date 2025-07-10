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
    console.log('Data written to file successfully');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

app.get('/api/time-entries', async (req, res) => {
  try {
    const data = await readDataFile();
    console.log(`Retrieved ${data.timeEntries.length} entries`);
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

    const newEntry = {
      id: maxId + 1,
      ...req.body,
      status: req.body.status || 'draft'
    };

    data.timeEntries.push(newEntry);

    const success = await writeDataFile(data);
    if (success) {
      console.log('Created new entry:', newEntry);
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

    const updatedEntry = {
      ...data.timeEntries[entryIndex],
      ...req.body,
      id: parseInt(req.params.id)
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(data);
    if (success) {
      console.log('Updated entry:', updatedEntry);
      res.json(updatedEntry);
    } else {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
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
      console.log('Deleted entry:', deletedEntry);
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
  console.log(`File service running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});

module.exports = app;
