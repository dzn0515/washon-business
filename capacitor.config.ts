import type { CapacitorConfig } from '@capacitor/cli'

// business.autoon.kr 연결 전까지 Vercel URL 사용
const SERVER_URL = 'https://washon-business.vercel.app'

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
