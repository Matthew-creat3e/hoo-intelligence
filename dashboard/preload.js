const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('hoo', {
  readFile:     (relPath)   => ipcRenderer.invoke('read-file', relPath),
  readJSON:     (relPath)   => ipcRenderer.invoke('read-json', relPath),
  readLeads:    ()          => ipcRenderer.invoke('read-leads'),
  listFiles:    (relPath)   => ipcRenderer.invoke('list-files', relPath),
  readQueue:    ()          => ipcRenderer.invoke('read-queue'),
  approvePost:  (filename)  => ipcRenderer.invoke('approve-post', filename),
  writeMemory:  (content)   => ipcRenderer.invoke('write-memory', content),
  pathExists:   (relPath)   => ipcRenderer.invoke('path-exists', relPath),
  openExternal: (url)       => shell.openExternal(url),
  readApprovals:()          => ipcRenderer.invoke('read-approvals'),
  approveLead:  (filename)  => ipcRenderer.invoke('approve-lead', filename),
  rejectLead:       (filename)       => ipcRenderer.invoke('reject-lead', filename),
  openDemo:         (demoPath)       => ipcRenderer.invoke('open-demo', demoPath),
  addEmailAndSend:  (leadId, email)  => ipcRenderer.invoke('add-email-and-send', leadId, email),
  rejectLeadById:   (leadId)         => ipcRenderer.invoke('reject-lead-by-id', leadId),
  moveToCallQueue:  (filename)       => ipcRenderer.invoke('move-to-call-queue', filename)
});
