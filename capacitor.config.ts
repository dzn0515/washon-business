import type { CapacitorConfig } from '@capacitor/cli'

const SERVER_URL = 'https://business.autoon.kr'

const config: CapacitorConfig = {
  appId: 'kr.autoon.washon.business',
  appName: 'AUTOON 사장님',
  webDir: 'public',
  server: {
    url: SERVER_URL,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A6DFF',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1A6DFF',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
