export {}

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>
      showBookingAlert: () => Promise<void>
      onUpdateAvailable: (cb: () => void) => void
      onUpdateDownloaded: (cb: () => void) => void
      installUpdate: () => void
    }
  }
}
