import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

autoUpdater.logger = log

export function initUpdater(win: BrowserWindow) {
  // TODO: GitHub Releases 또는 S3 버킷 URL로 교체
  // autoUpdater.setFeedURL({ provider: 'github', owner: 'dzn0515', repo: 'washon-business' })

  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    win.webContents.send('update-available')
  })

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update-downloaded')
  })

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 60 * 60 * 1000)
}
