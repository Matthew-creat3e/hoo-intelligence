const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hoo', {
  readFile:    (relPath)   => ipcRenderer.invoke('read-file', relPath),
  readJSON:    (relPath)   => ipcRenderer.invoke('read-json', relPath),
  readLeads:   ()          => ipcRenderer.invoke('read-leads'),
  listFiles:   (relPath)   => ipcRenderer.invoke('list-files', relPath),
  readQueue:   ()          => ipcRenderer.invoke('read-queue'),
  approvePost: (filename)  => ipcRenderer.invoke('approve-post', filename),
  writeMemory: (content)   => ipcRenderer.invoke('write-memory', content),
  pathExists:  (relPath)   => ipcRenderer.invoke('path-exists', relPath)
});
