import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { initUpdater } from './updater'
import log from 'electron-log'

log.transports.file.level = 'info'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'
const DEV_URL = process.env.ELECTRON_DEV_URL || 'http://127.0.0.1:3010/login'
const PROD_URL = 'https://business.autoon.kr/login'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'AUTOON',
    icon: join(__dirname, '../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL(DEV_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(PROD_URL)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerBookingAlertIpc() {
  ipcMain.handle('booking-alert-show', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.flashFrame(true)
    setTimeout(() => mainWindow?.flashFrame(false), 3000)
  })
}

app.whenReady().then(() => {
  registerBookingAlertIpc()
  createWindow()

  if (!isDev && mainWindow) {
    initUpdater(mainWindow)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

process.on('uncaughtException', (error) => {
  log.error('[Electron] Uncaught Exception:', error)
})
