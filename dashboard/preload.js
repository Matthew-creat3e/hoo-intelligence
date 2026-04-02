const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hoo', {
  // Core file ops
  readFile:       (relPath) => ipcRenderer.invoke('read-file', relPath),
  readJSON:       (relPath) => ipcRenderer.invoke('read-json', relPath),
  pathExists:     (relPath) => ipcRenderer.invoke('path-exists', relPath),
  listFiles:      (relPath) => ipcRenderer.invoke('list-files', relPath),
  openExternal:   (url) => ipcRenderer.invoke('open-external', url),
  openDemo:       (path) => ipcRenderer.invoke('open-demo', path),

  // Data reads
  readApprovals:  () => ipcRenderer.invoke('read-approvals'),
  readLeads:      () => ipcRenderer.invoke('read-leads'),
  readStats:      () => ipcRenderer.invoke('read-stats'),

  // Call queue actions
  logCall:        (file, data) => ipcRenderer.invoke('log-call', file, data),
  sendDemoEmail:  (file, email) => ipcRenderer.invoke('send-demo-email', file, email),
  logFollowup:    (file, outcome, notes) => ipcRenderer.invoke('log-followup', file, outcome, notes),
  rejectLeadById: (leadId) => ipcRenderer.invoke('reject-lead-by-id', leadId),
  writeApproval:  (file, data) => ipcRenderer.invoke('write-approval', file, data),

  // Hunt
  runHunt:        (count, industry, city) => ipcRenderer.invoke('run-hunt', count, industry, city),
  onHuntLog:      (callback) => ipcRenderer.on('hunt-log', (_, data) => callback(data)),

  // Legacy (keep for compatibility)
  readQueue:      () => ipcRenderer.invoke('read-queue' ),
  approvePost:    (filename) => ipcRenderer.invoke('approve-post', filename),
  writeMemory:    (content) => ipcRenderer.invoke('write-memory', content),
});
