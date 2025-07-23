import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'time-entries.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readDataFile() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Creating new data file...');
    const initialData = { timeEntries: [] };
    await writeDataFile(initialData);
    return initialData;
  }
}

async function writeDataFile(data) {
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('[FileDB] Data written successfully');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

export const fileDb = {
  async getAllEntries() {
    const data = await readDataFile();
    return data.timeEntries;
  },

  async getEntryById(id) {
    const data = await readDataFile();
    return data.timeEntries.find(e => e.id === parseInt(id));
  },

  async createEntry(entryData) {
    const data = await readDataFile();

    const maxId = data.timeEntries.length > 0
      ? Math.max(...data.timeEntries.map(e => e.id))
      : 0;

    const newEntry = {
      id: maxId + 1,
      ...entryData,
      status: entryData.status || 'draft'
    };

    data.timeEntries.push(newEntry);

    const success = await writeDataFile(data);
    if (!success) throw new Error('Failed to save entry');

    return newEntry;
  },

  async updateEntry(id, entryData) {
    const data = await readDataFile();
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(id));

    if (entryIndex === -1) return null;

    const updatedEntry = {
      ...data.timeEntries[entryIndex],
      ...entryData,
      id: parseInt(id)
    };

    data.timeEntries[entryIndex] = updatedEntry;

    const success = await writeDataFile(data);
    if (!success) throw new Error('Failed to update entry');

    return updatedEntry;
  },

  async deleteEntry(id) {
    const data = await readDataFile();
    const entryIndex = data.timeEntries.findIndex(e => e.id === parseInt(id));

    if (entryIndex === -1) return null;

    const deletedEntry = data.timeEntries.splice(entryIndex, 1)[0];

    const success = await writeDataFile(data);
    if (!success) throw new Error('Failed to delete entry');

    return deletedEntry;
  }
};
