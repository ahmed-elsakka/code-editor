// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('node:path')
const fs = require("fs")

autoUpdater.autoDownload  = false;


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  Menu.setApplicationMenu(null)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


ipcMain.on("file-open", (event) => {
  const paths = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [{name: "Code Files", extensions: ['js', 'css', 'html']}]
  });


  if(paths && paths.length > 0) {
    const path = paths[0];
    const fileContent =  fs.readFileSync(path, "utf-8");
    event.returnValue = {content: fileContent, filePath: path};
  } else {
    event.returnValue = null;
  }
});

ipcMain.on("file-save", (event, content) => {
  const path = dialog.showSaveDialogSync({
    filters: [{name: "Code Files", extensions: ['js', 'css', 'html']}]
  });

  if(path) {
    try {
      fs.writeFileSync(path, content, "utf-8");
      event.returnValue = path;
    } catch {
      event.returnValue = null;
    }
  }
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available. Do you want to download it now?`,
    buttons: ['Yes', 'Later']
  }).then((result) => {
    if (result.response === 0) { // User clicked "Yes"
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'The update has been downloaded. Restart the app to apply it now?',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

