"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const updater_1 = require("./updater");
const electron_log_1 = __importDefault(require("electron-log"));
electron_log_1.default.transports.file.level = 'info';
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = process.env.ELECTRON_DEV_URL || 'http://127.0.0.1:3010';
const PROD_URL = 'https://business.autoon.kr/dashboard';
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        title: 'AUTOON',
        icon: (0, path_1.join)(__dirname, '../resources/icon.ico'),
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
        show: false,
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    if (isDev) {
        mainWindow.loadURL(DEV_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadURL(PROD_URL);
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function registerBookingAlertIpc() {
    electron_1.ipcMain.handle('booking-alert-show', () => {
        if (!mainWindow)
            return;
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.flashFrame(true);
        setTimeout(() => mainWindow?.flashFrame(false), 3000);
    });
}
electron_1.app.whenReady().then(() => {
    registerBookingAlertIpc();
    createWindow();
    if (!isDev && mainWindow) {
        (0, updater_1.initUpdater)(mainWindow);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
process.on('uncaughtException', (error) => {
    electron_log_1.default.error('[Electron] Uncaught Exception:', error);
});
