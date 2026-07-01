"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUpdater = initUpdater;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
electron_updater_1.autoUpdater.logger = electron_log_1.default;
function initUpdater(win) {
    // TODO: GitHub Releases 또는 S3 버킷 URL로 교체
    // autoUpdater.setFeedURL({ provider: 'github', owner: 'dzn0515', repo: 'washon-business' })
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    electron_updater_1.autoUpdater.on('update-available', () => {
        win.webContents.send('update-available');
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        win.webContents.send('update-downloaded');
    });
    electron_1.ipcMain.on('install-update', () => {
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    electron_1.ipcMain.handle('get-app-version', () => {
        return electron_1.app.getVersion();
    });
    setInterval(() => {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
}
