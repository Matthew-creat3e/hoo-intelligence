const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#050505',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'HOO Command Center'
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

// Read a single file as text
ipcMain.handle('read-file', (_, relPath) => {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  } catch { return null; }
});

// Read a JSON file
ipcMain.handle('read-json', (_, relPath) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch { return null; }
});

// Read all lead JSONs from engine/leads/
ipcMain.handle('read-leads', () => {
  try {
    const dir = path.join(ROOT, 'engine', 'leads');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// List files in a directory
ipcMain.handle('list-files', (_, relPath) => {
  try {
    const dir = path.join(ROOT, relPath);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch { return []; }
});

// Read all social queue posts
ipcMain.handle('read-queue', () => {
  try {
    const dir = path.join(ROOT, 'social-engine', 'queue');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          return { ...data, filename: f };
        } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// Approve a social post — move from queue/ to posted/
ipcMain.handle('approve-post', (_, filename) => {
  try {
    const from = path.join(ROOT, 'social-engine', 'queue', filename);
    const to = path.join(ROOT, 'social-engine', 'posted', filename);
    fs.mkdirSync(path.join(ROOT, 'social-engine', 'posted'), { recursive: true });
    fs.renameSync(from, to);
    return true;
  } catch { return false; }
});

// Write updated MEMORY.md
ipcMain.handle('write-memory', (_, content) => {
  try {
    fs.writeFileSync(path.join(ROOT, 'memory', 'MEMORY.md'), content, 'utf8');
    return true;
  } catch { return false; }
});

// Check if a path exists
ipcMain.handle('path-exists', (_, relPath) => {
  return fs.existsSync(path.join(ROOT, relPath));
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
